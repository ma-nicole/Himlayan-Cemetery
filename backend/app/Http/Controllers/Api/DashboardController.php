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
        $currentYear = now()->year;

        // Count plots owned by the user (via burial records with matching contact_email)
        $myPlotsCount = Plot::whereHas('burialRecord', function ($query) use ($user) {
            $query->where('contact_email', $user->email);
        })->count();

        // Count outstanding dues using the same logic as the Pay Dues page (myDues):
        // 1. Build the set of verified obligation keys to exclude already-paid obligations.
        // 2. Keep only pending payments that have a known plot/service reference.
        // 3. Group by obligation key (deduplication) — the unique group count is what
        //    the Pay Dues page shows, so these two numbers are always in sync.
        $allUserPayments = Payment::where('user_id', $userId)->get();

        $verifiedKeys = [];
        foreach ($allUserPayments as $pmt) {
            if ($pmt->status === Payment::STATUS_VERIFIED) {
                $verifiedKeys[$this->buildObligationKey($pmt)] = true;
            }
        }

        // Mirror the my-dues endpoint: include ALL pending records (unpaid, awaiting_verification,
        // under_investigation) — do NOT filter by paid_at, so this count always matches
        // what the member sees under "Outstanding Dues" on the Pay Dues page.
        $pendingPaymentsCount = $allUserPayments
            ->filter(function ($pmt) use ($verifiedKeys) {
                // Mirror hasKnownPlotReference: service fees are always valid;
                // other types require a plot_id.
                $hasRef = $pmt->payment_type === Payment::TYPE_SERVICE_FEE
                    || !empty($pmt->plot_id);
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

        // For visits, we don't have a tracking table, so we'll set to 0
        // You can implement visit tracking later if needed
        $visitsThisYear = 0;

        $stats = [
            'my_plots' => $myPlotsCount,
            'pending_payments' => $pendingPaymentsCount,
            'visits_this_year' => $visitsThisYear,
            'service_requests' => $serviceRequestsCount,
        ];

        return $this->successResponse($stats, 'Member dashboard statistics retrieved');
    }
}
