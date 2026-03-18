<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnforcePasswordChange
{
    /**
     * Requests allowed through even when must_change_password is true.
     * Format: "METHOD:path" where path matches $request->path() (no leading slash).
     */
    private const ALLOWED = [
        'POST:api/auth/change-password',
        'GET:api/user',
        'POST:api/logout',
    ];

    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            $key = $request->method() . ':' . $request->path();

            if (!in_array($key, self::ALLOWED)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must change your temporary password before accessing this resource.',
                    'must_change_password' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}
