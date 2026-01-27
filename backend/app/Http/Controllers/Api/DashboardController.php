<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BurialRecord;
use App\Models\Plot;
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
        $stats = [
            'plots' => [
                'total' => Plot::count(),
                'available' => Plot::where('status', 'available')->count(),
                'occupied' => Plot::where('status', 'occupied')->count(),
                'reserved' => Plot::where('status', 'reserved')->count(),
                'maintenance' => Plot::where('status', 'maintenance')->count(),
            ],
            'burials' => [
                'total' => BurialRecord::count(),
                'this_month' => BurialRecord::whereMonth('burial_date', now()->month)
                                            ->whereYear('burial_date', now()->year)
                                            ->count(),
                'this_year' => BurialRecord::whereYear('burial_date', now()->year)->count(),
            ],
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
}
