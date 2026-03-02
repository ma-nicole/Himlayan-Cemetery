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
     * Get member-specific dashboard statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function memberStats()
    {
        $user = auth()->user();
        $userId = $user->id;
        $currentYear = now()->year;

        // Count plots owned by the user (via burial records with matching contact_email)
        $myPlotsCount = Plot::whereHas('burialRecord', function ($query) use ($user) {
            $query->where('contact_email', $user->email);
        })->count();

        // Count pending payments for the user
        $pendingPaymentsCount = Payment::where('user_id', $userId)
            ->where('status', 'pending')
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
