<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BurialRecord;
use App\Models\Payment;
use App\Models\Plot;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        // Get monthly burial data for last 6 months
        $monthlyBurials = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $count = BurialRecord::whereMonth('burial_date', $date->month)
                                ->whereYear('burial_date', $date->year)
                                ->count();
            $monthlyBurials[] = [
                'label' => $date->format('M'),
                'value' => $count
            ];
        }

        $stats = [
            'plots' => [
                'total' => Plot::count(),
                'available' => Plot::where('status', 'available')->count(),
                'occupied' => Plot::has('burialRecord')->count(), // Count plots with actual burial records
                'reserved' => Plot::where('status', 'reserved')->count(),
                'maintenance' => Plot::where('status', 'maintenance')->count(),
            ],
            'burials' => [
                'total' => BurialRecord::count(),
                'this_month' => BurialRecord::whereMonth('created_at', now()->month)
                                            ->whereYear('created_at', now()->year)
                                            ->count(),
                'this_year' => BurialRecord::whereYear('created_at', now()->year)->count(),
            ],
            'service_requests' => [
                'total' => ServiceRequest::count(),
                'pending' => ServiceRequest::where('status', 'pending')->count(),
            ],
            'monthly_burials' => $monthlyBurials,
            'recent_burials' => BurialRecord::with('plot')
                                            ->orderBy('created_at', 'desc')
                                            ->limit(5)
                                            ->get()
                                            ->map(function ($record) {
                                                return [
                                                    'id' => $record->id,
                                                    'deceased_name' => $record->deceased_name,
                                                    'burial_date' => $record->burial_date->format('Y-m-d'),
                                                    'plot_number' => $record->plot->plot_number,
                                                ];
                                            }),
        ];

        return $this->successResponse($stats, 'Dashboard statistics retrieved');
    }

    /**
     * Build a stable obligation key — must match PaymentController::buildObligationKey exactly.
     */
    private function buildObligationKey($payment): string
    {
        // Service fees: group by notes text (same request = same notes).
        // Keeps separate service-fee obligations with the same amount distinct.
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

        $plotPart = $payment->plot_id ? 'plot:' . $payment->plot_id : 'plot:none';
        $amountPart = number_format((float) $payment->amount, 2, '.', '');
        return implode('|', [
            'user:' . $payment->user_id,
            $plotPart,
            'type:' . strtolower((string) $payment->payment_type),
            'amount:' . $amountPart,
        ]);
    }

    /**
     * Get member-specific dashboard statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function memberStats()    {
        $user = auth()->user();
        $userId = $user->id;

        // Count plots owned by the user (via burial records with matching contact_email)
        $myPlotsCount = Plot::whereHas('burialRecord', function ($query) use ($user) {
            $query->where('contact_email', $user->email);
        })->count();

        // ── Outstanding dues count ──────────────────────────────────────────
        // Must mirror PaymentController::myDues() exactly so the dashboard
        // count always equals the number of cards on the Pay Dues page.
        //
        // Step 1: Exclude service-fee payments for cancelled service requests
        //         (same filter that myDues applies at the query level).
        $cancelledIds = ServiceRequest::where('user_id', $userId)
            ->where('status', 'cancelled')
            ->pluck('id');

        $paymentQuery = Payment::where('user_id', $userId);

        if ($cancelledIds->isNotEmpty()) {
            $paymentQuery->where(function ($q) use ($cancelledIds) {
                $q->where('payment_type', '!=', Payment::TYPE_SERVICE_FEE)
                  ->orWhere(function ($q2) use ($cancelledIds) {
                      $q2->where('payment_type', Payment::TYPE_SERVICE_FEE);
                      foreach ($cancelledIds as $rid) {
                          $q2->where('notes', 'not like', '%Request #' . $rid . ')');
                      }
                  });
            });
        }

        $allUserPayments = $paymentQuery->get();

        // Step 2: Build verified-obligation set
        $verifiedKeys = [];
        foreach ($allUserPayments as $pmt) {
            if ($pmt->status === Payment::STATUS_VERIFIED) {
                $verifiedKeys[$this->buildObligationKey($pmt)] = true;
            }
        }

        // Step 3: Filter + group (same rules as myDues)
        $pendingPaymentsCount = $allUserPayments
            ->filter(function ($pmt) use ($verifiedKeys) {
                // hasKnownPlotReference: service fees always valid, others need plot_id
                // or a parseable plot token inside notes.
                if ($pmt->payment_type === Payment::TYPE_SERVICE_FEE) {
                    $hasRef = true;
                } else {
                    $hasRef = (bool) $pmt->plot_id
                        || (bool) preg_match('/\b([A-Z]-\d{1,3}-\d{1,3})\b/i', (string) $pmt->notes);
                }

                return $hasRef
                    && $pmt->status === Payment::STATUS_PENDING
                    && !isset($verifiedKeys[$this->buildObligationKey($pmt)]);
            })
            ->groupBy(fn ($pmt) => $this->buildObligationKey($pmt))
            ->count();

        // Count only pending service requests for the user
        $serviceRequestsCount = ServiceRequest::where('user_id', $userId)
            ->where('status', 'pending')
            ->count();

        $stats = [
            'my_plots' => $myPlotsCount,
            'pending_payments' => $pendingPaymentsCount,
            'visits_this_year' => 0,
            'service_requests' => $serviceRequestsCount,
        ];

        return $this->successResponse($stats, 'Member dashboard statistics retrieved');
    }
}
