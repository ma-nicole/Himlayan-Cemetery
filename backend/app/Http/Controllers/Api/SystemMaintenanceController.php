<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SystemMaintenanceController extends Controller
{
    private const CACHE_KEY = 'system_maintenance';

    public function status()
    {
        $maintenance = Cache::get(self::CACHE_KEY, [
            'active' => false,
            'message' => 'System is under maintenance. Please try again later.',
            'updated_at' => null,
            'updated_by' => null,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'active' => (bool) ($maintenance['active'] ?? false),
                'message' => $maintenance['message'] ?? 'System is under maintenance. Please try again later.',
                'updated_at' => $maintenance['updated_at'] ?? null,
                'updated_by' => $maintenance['updated_by'] ?? null,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'active' => 'required|boolean',
            'message' => 'nullable|string|max:500',
        ]);

        $maintenance = [
            'active' => $validated['active'],
            'message' => $validated['message'] ?? 'System is under maintenance. Please try again later.',
            'updated_at' => now()->toIso8601String(),
            'updated_by' => $request->user()?->email,
        ];

        Cache::forever(self::CACHE_KEY, $maintenance);

        return response()->json([
            'success' => true,
            'message' => $validated['active']
                ? 'Maintenance mode enabled.'
                : 'Maintenance mode disabled.',
            'data' => $maintenance,
        ]);
    }
}
