<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PaymentController extends Controller
{
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

        // For members, only show their own payments
        if (auth()->user()->role === 'member') {
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

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ]
        ]);
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
            $xenditResponse = Http::withBasicAuth($xenditSecret, '')
                ->acceptJson()
                ->post('https://api.xendit.co/v2/invoices', $payload);

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
            $xenditResponse = Http::withBasicAuth($xenditSecret, '')
                ->acceptJson()
                ->post('https://api.xendit.co/v2/invoices', $payload);

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
        if (auth()->user()->role === 'member' && $payment->user_id !== auth()->id()) {
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
        // This would typically be linked to plots owned by the user
        // For now, return user's pending payments
        $payments = Payment::where('user_id', auth()->id())
            ->where('status', 'pending')
            ->with('plot:id,plot_number,section')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }
}
