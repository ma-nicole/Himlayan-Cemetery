<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\SecurityAuditService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    /**
     * Handle Xendit payment webhook callbacks.
     *
     * Xendit calls this endpoint when a payment invoice changes state.
     * We verify the callback token, find the matching payment record by
     * reference_number (set to the Xendit invoice ID at checkout time),
     * update paid_at, and preserve the existing admin-verification workflow.
     */
    public function xendit(Request $request)
    {
        // ── 1. Authenticate the webhook ──────────────────────────────
        $configuredToken = config('services.xendit.webhook_token');
        $receivedToken   = $request->header('x-callback-token');

        if ($configuredToken && $configuredToken !== $receivedToken) {
            Log::warning('Xendit webhook: invalid callback token', [
                'ip'             => $request->ip(),
                'received_token' => substr((string) $receivedToken, 0, 8) . '...',
            ]);
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // ── 2. Parse payload ─────────────────────────────────────────
        $data       = $request->all();
        $eventType  = strtoupper((string) ($data['status'] ?? ''));
        $externalId = $data['external_id'] ?? null;
        $invoiceId  = $data['id'] ?? null;
        $paidAtRaw  = $data['paid_at'] ?? null;

        Log::info('Xendit webhook received', [
            'event'       => $eventType,
            'invoice_id'  => $invoiceId,
            'external_id' => $externalId,
        ]);

        // Only process successful payment events
        if (!in_array($eventType, ['PAID', 'SETTLED'], true)) {
            return response()->json(['received' => true]);
        }

        // ── 3. Find the payment record ───────────────────────────────
        $payment = null;

        // Primary: match by reference_number (set to Xendit invoice ID at checkout)
        if ($invoiceId) {
            $payment = Payment::where('reference_number', $invoiceId)->first();
        }

        // Fallback: parse payment ID from external_id ("himlayan-payment-{id}-{ts}")
        if (!$payment && $externalId) {
            if (preg_match('/^himlayan-payment-(\d+)-/', (string) $externalId, $m)) {
                $payment = Payment::find((int) $m[1]);
            }
        }

        if (!$payment) {
            Log::warning('Xendit webhook: no matching payment found', [
                'invoice_id'  => $invoiceId,
                'external_id' => $externalId,
            ]);
            // Return 200 so Xendit does not retry indefinitely for unknown payments
            return response()->json(['received' => true]);
        }

        // ── 4. Idempotency check ─────────────────────────────────────
        // Skip if already verified — do not overwrite an admin decision
        if ($payment->status === Payment::STATUS_VERIFIED) {
            return response()->json(['received' => true]);
        }

        // ── 5. Mark payment as submitted / awaiting verification ─────
        $changed = false;

        if (!$payment->paid_at) {
            $payment->paid_at = $paidAtRaw ? Carbon::parse($paidAtRaw) : now();
            $changed = true;
        }

        // Derive payment method from Xendit payload if not already set
        if (!$payment->payment_method) {
            $rawMethod = $data['payment_method'] ?? $data['payment_channel'] ?? null;
            if ($rawMethod) {
                $methodMap = [
                    'GCASH'         => 'gcash',
                    'PAYMAYA'       => 'maya',
                    'OVO'           => 'maya',
                    'CREDIT_CARD'   => 'card',
                    'DEBIT_CARD'    => 'card',
                    'BANK_TRANSFER' => 'bank',
                    'WIRE_TRANSFER' => 'bank',
                ];
                $payment->payment_method = $methodMap[strtoupper($rawMethod)] ?? strtolower($rawMethod);
                $changed = true;
            }
        }

        if ($changed) {
            $payment->save();
        }

        SecurityAuditService::log(
            'payment.webhook',
            'success',
            'Xendit webhook: payment marked as paid and awaiting admin verification',
            $request,
            $payment->user_id,
            [
                'payment_id'  => $payment->id,
                'invoice_id'  => $invoiceId,
                'event'       => $eventType,
            ]
        );

        return response()->json(['received' => true]);
    }
}
