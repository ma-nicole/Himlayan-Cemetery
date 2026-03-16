<?php

namespace App\Http\Middleware;

use App\Services\SecurityAuditService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRecentAuthentication
{
    /**
     * Require a recently issued access token for sensitive operations.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();

        if (!$token || !$token->created_at) {
            SecurityAuditService::log(
                'auth.recent_auth_check',
                'failed',
                'Sensitive action blocked: no valid access token context',
                $request,
                $user?->id
            );

            return response()->json([
                'success' => false,
                'message' => 'Recent authentication is required for this operation.',
                'code' => 'recent_auth_required',
            ], 401);
        }

        $sensitiveWindowMinutes = (int) config('sanctum.sensitive_operation_expiration', 15);
        $isRecent = $token->created_at->copy()->addMinutes($sensitiveWindowMinutes)->isFuture();

        if (!$isRecent) {
            SecurityAuditService::log(
                'auth.recent_auth_check',
                'failed',
                'Sensitive action blocked: recent authentication window expired',
                $request,
                $user?->id,
                ['window_minutes' => $sensitiveWindowMinutes]
            );

            return response()->json([
                'success' => false,
                'message' => 'This action requires a recent login. Please log in again and retry.',
                'code' => 'recent_auth_expired',
            ], 401);
        }

        return $next($request);
    }
}
