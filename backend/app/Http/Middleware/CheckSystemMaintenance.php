<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CheckSystemMaintenance
{
    /**
     * Public/auth endpoints that remain available during maintenance.
     */
    private array $exceptPaths = [
        'api/login',
        'api/forgot-password',
        'api/reset-password',
        'api/system/maintenance-status',
        'api/system/maintenance',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $maintenance = Cache::get('system_maintenance', [
            'active' => false,
            'message' => 'System is under maintenance. Please try again later.',
            'updated_at' => null,
            'updated_by' => null,
        ]);

        if (!($maintenance['active'] ?? false)) {
            return $next($request);
        }

        if ($request->is($this->exceptPaths)) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && in_array($user->role, ['admin', 'staff'], true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => $maintenance['message'] ?? 'System is under maintenance. Please try again later.',
            'maintenance' => [
                'active' => true,
                'updated_at' => $maintenance['updated_at'] ?? null,
            ],
        ], 503);
    }
}
