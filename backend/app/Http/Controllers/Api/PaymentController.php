<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
    /**
     * Build a stable obligation key so related records share one effective status.
     */
    private function buildObligationKey(Payment $payment): string
    {
        // Service fees: group by notes text so duplicate payment records for the
        // same service request (same notes) collapse into a single obligation.
        if ($payment->payment_type === Payment::TYPE_SERVICE_FEE) {
            $notesKey = $payment->notes
                ? 'notes:' . md5(trim((string) $payment->notes))
                : 'payment:' . $payment->id;
            return implode('|', [
                'user:' . $payment->user_id,
                'type:service_fee',
                $notesKey,
            ]);
        }

        $plotPart = $payment->plot_id ? 'plot:' . $payment->plot_id : 'plot:' . $this->extractPlotToken($payment->notes);
        $amountPart = number_format((float) $payment->amount, 2, '.', '');

        return implode('|', [
            'user:' . $payment->user_id,
            $plotPart,
            'type:' . strtolower((string) $payment->payment_type),
            'amount:' . $amountPart,
        ]);
    }

    /**
     * Extract a plot-like token from notes when plot_id is not available.
     */
    private function extractPlotToken(?string $notes): string
    {
        if (!$notes) {
            return 'none';
        }

        if (preg_match('/\b([A-Z]-\d{1,3}-\d{1,3})\b/i', $notes, $matches)) {
            return strtoupper($matches[1]);
        }

        return 'none';
    }

    /**
     * Accept dues items only when tied to a real plot id or a parseable plot token.
     */
    private function hasKnownPlotReference(Payment $payment): bool
    {
        // Service fees created on approval don't need a plot reference.
        if ($payment->payment_type === Payment::TYPE_SERVICE_FEE) {
            return true;
        }

        return (bool) $payment->plot_id || $this->extractPlotToken($payment->notes) !== 'none';
    }

    /**
     * Apply an effective status to each payment based on matching verified obligations.
     */
    private function applyEffectiveStatuses($payments)
    {
        $verifiedKeys = [];
        foreach ($payments as $payment) {
            if ($payment->status === Payment::STATUS_VERIFIED) {
                $verifiedKeys[$this->buildObligationKey($payment)] = true;
            }
        }

        foreach ($payments as $payment) {
            $key = $this->buildObligationKey($payment);
            if (isset($verifiedKeys[$key])) {
                $effective = Payment::STATUS_VERIFIED;
            } elseif ($payment->status === Payment::STATUS_PENDING && $payment->paid_at) {
                // User has submitted payment via Xendit but admin hasn't verified yet
                $effective = 'awaiting_verification';
            } else {
                $effective = $payment->status;
            }
            $payment->setAttribute('effective_status', $effective);
        }

        return $payments;
    }
    /**
     * Retry without strict payment method filter when Xendit rejects business method choices.
     */
    private function createXenditInvoiceWithFallback(string $xenditSecret, array $payload): array
    {
        $response = Http::withBasicAuth($xenditSecret, '')
            ->acceptJson()
            ->post('https://api.xendit.co/v2/invoices', $payload);

        if ($response->successful()) {
            return [$response, false];
        }

        $gatewayBody = $response->json() ?? [];
        $gatewayMessage = strtolower((string) $this->extractXenditErrorMessage($gatewayBody));

        $shouldRetryWithoutFilter = isset($payload['payment_methods']) && (
            str_contains($gatewayMessage, 'payment method choices') ||
            str_contains($gatewayMessage, 'did not match') ||
            str_contains($gatewayMessage, 'available one on this business')
        );

        if (!$shouldRetryWithoutFilter) {
            return [$response, false];
        }

        unset($payload['payment_methods']);

        $retryResponse = Http::withBasicAuth($xenditSecret, '')
            ->acceptJson()
            ->post('https://api.xendit.co/v2/invoices', $payload);

        return [$retryResponse, true];
    }

    /**
     * Build a readable gateway error message from Xendit response body.
     */
    private function extractXenditErrorMessage(array $body): ?string
    {
        $candidates = [
            $body['message'] ?? null,
            $body['error_message'] ?? null,
            $body['errors'][0]['message'] ?? null,
            $body['error']['message'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && trim($candidate) !== '') {
                return trim($candidate);
            }
        }

        return null;
    }

    /**
     * Resolve a safe absolute frontend base URL for payment redirects.
     */
    private function resolveFrontendBaseUrl(): string
    {
        $frontend = trim((string) config('app.frontend_url', ''));
        $appUrl = trim((string) config('app.url', ''));

        $base = $frontend !== '' ? $frontend : ($appUrl !== '' ? $appUrl : 'https://himlayangpilipino.com');

        if (!preg_match('/^https?:\/\//i', $base)) {
            $base = 'https://' . ltrim($base, '/');
        }

        return rtrim($base, '/');
    }

    /**
     * Build return URL with status and optional payment tracking info.
     */
    private function buildPaymentReturnUrl(string $status, Payment $payment): string
    {
        $query = http_build_query([
            'status' => $status,
            'payment_id' => $payment->id,
            'ref' => $payment->reference_number,
        ]);

        return $this->resolveFrontendBaseUrl() . '/pay-dues?' . $query;
    }

    /**
     * Display a listing of payments
     */
    public function index(Request $request)
    {
        $query = Payment::with(['user:id,name,email', 'plot:id,plot_number,section', 'verifier:id,name']);

        // Whitelist approach: only admin and staff may see all payments.
        // Every other role (member, null, or any future role) is strictly
        // restricted to their own records, preventing data leakage.
        if (!in_array(auth()->user()->role, ['admin', 'staff'], true)) {
            $query->where('user_id', auth()->id());
        }

        // Status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Payment type filter
        if ($request->has('payment_type') && $request->payment_type) {
            $query->where('payment_type', $request->payment_type);
        }

        // Search by reference number
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 10);
        $payments = $query->paginate($perPage);
        $items = collect($payments->items());
        $this->applyEffectiveStatuses($items);

        return response()->json([
            'success' => true,
            'data' => $items->values(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ]
        ]);
    }

    /**
     * Initiate checkout for an existing pending payment — no new record is created.
     */
    public function checkout(Request $request, $id)
    {
        $payment = Payment::where('id', $id)
            ->where('user_id', auth()->id())
            ->where('status', Payment::STATUS_PENDING)
            ->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found or already processed.',
            ], 404);
        }

        $validated = $request->validate([
            'payment_method' => 'required|string|max:50',
        ]);

        $xenditSecret = config('services.xendit.secret_key');
        if (!$xenditSecret) {
            return response()->json([
                'success' => false,
                'message' => 'Xendit secret key is not configured.',
            ], 500);
        }

        $methodMap = [
            'gcash' => 'GCASH',
            'maya' => 'PAYMAYA',
            'bank' => 'BANK_TRANSFER',
            'card' => 'CREDIT_CARD',
        ];

        $payment->update(['payment_method' => $validated['payment_method']]);

        $externalId = 'himlayan-payment-' . $payment->id . '-' . time();

        $payload = [
            'external_id'          => $externalId,
            'amount'               => (float) $payment->amount,
            'payer_email'          => auth()->user()->email,
            'description'          => 'Himlayan dues payment (' . $payment->payment_type . ')',
            'currency'             => 'PHP',
            'success_redirect_url' => $this->buildPaymentReturnUrl('success', $payment),
            'failure_redirect_url' => $this->buildPaymentReturnUrl('failed', $payment),
        ];

        if (isset($methodMap[$validated['payment_method']])) {
            $payload['payment_methods'] = [$methodMap[$validated['payment_method']]];
        }

        try {
            [$xenditResponse] = $this->createXenditInvoiceWithFallback($xenditSecret, $payload);

            if (!$xenditResponse->successful()) {
                $gatewayBody    = $xenditResponse->json() ?? [];
                $gatewayMessage = $this->extractXenditErrorMessage($gatewayBody);

                return response()->json([
                    'success' => false,
                    'message' => $gatewayMessage
                        ? 'Failed to create payment checkout: ' . $gatewayMessage
                        : 'Failed to create payment checkout. Please try again.',
                    'errors' => $gatewayBody,
                ], 502);
            }

            $invoice = $xenditResponse->json();
            $payment->update([
                'reference_number' => $invoice['id'] ?? $payment->reference_number,
            ]);

            return response()->json([
                'success'      => true,
                'message'      => 'Payment initiated successfully. Redirecting to checkout.',
                'data'         => $payment->load(['user:id,name,email', 'plot:id,plot_number,section']),
                'checkout_url' => $invoice['invoice_url'] ?? null,
                'invoice_id'   => $invoice['id'] ?? null,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to connect to payment gateway.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created payment (member submits payment)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'plot_id' => 'nullable|exists:plots,id',
            'amount' => 'required|numeric|min:1',
            'payment_type' => 'required|string|max:50',
            'payment_method' => 'required|string|max:50',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if (auth()->user()->role === 'member' && empty($validated['plot_id']) && ($validated['payment_type'] ?? '') !== Payment::TYPE_SERVICE_FEE) {
            return response()->json([
                'success' => false,
                'message' => 'Please select a valid plot before making a payment.',
            ], 422);
        }

        $payment = Payment::create([
            ...$validated,
            'user_id' => auth()->id(),
            'status' => 'pending',
            'paid_at' => null,
        ]);

        $xenditSecret = config('services.xendit.secret_key');
        if (!$xenditSecret) {
            return response()->json([
                'success' => false,
                'message' => 'Xendit secret key is not configured.',
            ], 500);
        }

        $methodMap = [
            'gcash' => 'GCASH',
            'maya' => 'PAYMAYA',
            'bank' => 'BANK_TRANSFER',
            'card' => 'CREDIT_CARD',
        ];

        $externalId = 'himlayan-payment-' . $payment->id . '-' . time();

        $payload = [
            'external_id' => $externalId,
            'amount' => (float) $validated['amount'],
            'payer_email' => auth()->user()->email,
            'description' => 'Himlayan dues payment (' . $validated['payment_type'] . ')',
            'currency' => 'PHP',
            'success_redirect_url' => $this->buildPaymentReturnUrl('success', $payment),
            'failure_redirect_url' => $this->buildPaymentReturnUrl('failed', $payment),
        ];

        if (isset($methodMap[$validated['payment_method']])) {
            $payload['payment_methods'] = [$methodMap[$validated['payment_method']]];
        }

        try {
            [$xenditResponse] = $this->createXenditInvoiceWithFallback($xenditSecret, $payload);

            if (!$xenditResponse->successful()) {
                $gatewayBody = $xenditResponse->json() ?? [];
                $gatewayMessage = $this->extractXenditErrorMessage($gatewayBody);

                return response()->json([
                    'success' => false,
                    'message' => $gatewayMessage
                        ? 'Failed to create payment checkout: ' . $gatewayMessage
                        : 'Failed to create payment checkout. Please verify Xendit configuration and try again.',
                    'errors' => $gatewayBody,
                ], 502);
            }

            $invoice = $xenditResponse->json();
            $payment->update([
                'reference_number' => $invoice['id'] ?? $payment->reference_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment initiated successfully. Redirecting to checkout.',
                'data' => $payment->load(['user:id,name,email', 'plot:id,plot_number,section']),
                'checkout_url' => $invoice['invoice_url'] ?? null,
                'invoice_id' => $invoice['id'] ?? null,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to connect to payment gateway.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create payment directly via Xendit (compatibility endpoint)
     */
    public function createXendit(Request $request)
    {
        $validated = $request->validate([
            'plot_id' => 'nullable|exists:plots,id',
            'amount' => 'required|numeric|min:1',
            'payment_type' => 'required|string|max:50',
            'payment_method' => 'required|string|max:50',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if (auth()->user()->role === 'member' && empty($validated['plot_id']) && ($validated['payment_type'] ?? '') !== Payment::TYPE_SERVICE_FEE) {
            return response()->json([
                'success' => false,
                'message' => 'Please select a valid plot before making a payment.',
            ], 422);
        }

        $payment = Payment::create([
            ...$validated,
            'user_id' => auth()->id(),
            'status' => 'pending',
            'paid_at' => null,
        ]);

        $xenditSecret = config('services.xendit.secret_key');
        if (!$xenditSecret) {
            return response()->json([
                'success' => false,
                'message' => 'Xendit secret key is not configured.',
            ], 500);
        }

        $methodMap = [
            'gcash' => 'GCASH',
            'maya' => 'PAYMAYA',
            'bank' => 'BANK_TRANSFER',
            'card' => 'CREDIT_CARD',
        ];

        $externalId = 'himlayan-payment-' . $payment->id . '-' . time();

        $payload = [
            'external_id' => $externalId,
            'amount' => (float) $validated['amount'],
            'payer_email' => auth()->user()->email,
            'description' => 'Himlayan dues payment (' . $validated['payment_type'] . ')',
            'currency' => 'PHP',
            'success_redirect_url' => $this->buildPaymentReturnUrl('success', $payment),
            'failure_redirect_url' => $this->buildPaymentReturnUrl('failed', $payment),
        ];

        if (isset($methodMap[$validated['payment_method']])) {
            $payload['payment_methods'] = [$methodMap[$validated['payment_method']]];
        }

        try {
            [$xenditResponse] = $this->createXenditInvoiceWithFallback($xenditSecret, $payload);

            if (!$xenditResponse->successful()) {
                $gatewayBody = $xenditResponse->json() ?? [];
                $gatewayMessage = $this->extractXenditErrorMessage($gatewayBody);

                return response()->json([
                    'success' => false,
                    'message' => $gatewayMessage
                        ? 'Failed to create payment checkout: ' . $gatewayMessage
                        : 'Failed to create payment checkout. Please verify Xendit configuration and try again.',
                    'errors' => $gatewayBody,
                ], 502);
            }

            $invoice = $xenditResponse->json();
            $payment->update([
                'reference_number' => $invoice['id'] ?? $payment->reference_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment initiated successfully. Redirecting to checkout.',
                'data' => $payment->load(['user:id,name,email', 'plot:id,plot_number,section']),
                'checkout_url' => $invoice['invoice_url'] ?? null,
                'invoice_id' => $invoice['id'] ?? null,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to connect to payment gateway.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark a payment as paid by the user (sets paid_at, awaiting admin verification).
     */
    public function markPaid(Request $request, $id)
    {
        $payment = Payment::where('id', $id)
            ->where('user_id', auth()->id())
            ->where('status', Payment::STATUS_PENDING)
            ->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found or already processed.',
            ], 404);
        }

        if (!$payment->paid_at) {
            $payment->update(['paid_at' => now()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment marked as paid. Awaiting admin verification.',
            'data' => $payment,
        ]);
    }

    /**
     * Display the specified payment
     */
    public function show($id)
    {
        $payment = Payment::with(['user:id,name,email', 'plot:id,plot_number,section', 'verifier:id,name'])->find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        // Members can only view their own
        if (!in_array(auth()->user()->role, ['admin', 'staff'], true) && $payment->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }

    /**
     * Verify payment (admin/staff only)
     */
    public function verify(Request $request, $id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:verified,rejected',
            'notes' => 'nullable|string',
        ]);

        $payment->update([
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? $payment->notes,
            'verified_by' => auth()->id(),
            'verified_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment ' . $validated['status'] . ' successfully',
            'data' => $payment->load(['user:id,name,email', 'verifier:id,name'])
        ]);
    }

    /**
     * Delete a payment
     */
    public function destroy($id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment deleted successfully'
        ]);
    }

    /**
     * Get payment statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => Payment::count(),
            'pending' => Payment::where('status', 'pending')->count(),
            'verified' => Payment::where('status', 'verified')->count(),
            'rejected' => Payment::where('status', 'rejected')->count(),
            'total_amount' => Payment::where('status', 'verified')->sum('amount'),
            'pending_amount' => Payment::where('status', 'pending')->sum('amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get user's dues (plots they need to pay for)
     */
    public function myDues()
    {
        $payments = Payment::where('user_id', auth()->id())
            ->with('plot:id,plot_number,section')
            ->orderBy('created_at', 'desc')
            ->get();

        if ($payments->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        $this->applyEffectiveStatuses($payments);

        $verifiedKeys = [];
        foreach ($payments as $payment) {
            if (($payment->effective_status ?? $payment->status) === Payment::STATUS_VERIFIED) {
                $verifiedKeys[$this->buildObligationKey($payment)] = true;
            }
        }

        $outstanding = $payments
            ->filter(function ($payment) use ($verifiedKeys) {
                if (!$this->hasKnownPlotReference($payment)) {
                    return false;
                }

                if ($payment->status !== Payment::STATUS_PENDING) {
                    return false;
                }

                $key = $this->buildObligationKey($payment);
                return !isset($verifiedKeys[$key]);
            })
            ->groupBy(fn ($payment) => $this->buildObligationKey($payment))
            ->map(function ($group) {
                $latest = $group->sortByDesc('created_at')->first();
                $isOverdue = $latest->status === Payment::STATUS_PENDING
                    && $latest->created_at
                    && $latest->created_at->lt(now()->subDays(14));

                // Derive a display status:
                // - 'awaiting_verification' when user already paid (paid_at set) but admin hasn't verified yet
                // - 'overdue' when past 14 days and still pending
                // - otherwise use the raw status
                $displayStatus = $latest->paid_at
                    ? 'awaiting_verification'
                    : ($isOverdue ? 'overdue' : $latest->status);

                return [
                    'id' => $latest->id,
                    'plot_id' => $latest->plot_id,
                    'plot_number' => $latest->payment_type === Payment::TYPE_SERVICE_FEE
                        ? 'Service Fee'
                        : ($latest->plot->plot_number ?? ($this->extractPlotToken($latest->notes) !== 'none' ? $this->extractPlotToken($latest->notes) : 'N/A')),
                    'section' => $latest->plot->section ?? 'N/A',
                    'due_amount' => (float) $latest->amount,
                    'due_date' => optional($latest->created_at)->toDateString(),
                    'status' => $displayStatus,
                    'paid_at' => $latest->paid_at,
                    'payment_type' => $latest->payment_type,
                    'notes' => $latest->notes,
                    'description' => $latest->payment_type === Payment::TYPE_SERVICE_FEE
                        ? ($latest->notes ?: 'Service Fee')
                        : null,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $outstanding
        ]);
    }
}
