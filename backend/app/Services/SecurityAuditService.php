<?php

namespace App\Services;

use App\Models\SecurityAuditLog;
use Illuminate\Http\Request;
use Throwable;

class SecurityAuditService
{
    /**
     * Persist a security-relevant event without breaking request flow on log failure.
     */
    public static function log(
        string $event,
        string $status,
        ?string $message = null,
        ?Request $request = null,
        ?int $userId = null,
        array $metadata = []
    ): void {
        try {
            SecurityAuditLog::create([
                'user_id' => $userId,
                'event' => $event,
                'status' => $status,
                'message' => $message,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
                'request_path' => $request?->path(),
                'request_method' => $request?->method(),
                'metadata' => empty($metadata) ? null : $metadata,
            ]);
        } catch (Throwable $e) {
            // Intentionally swallow logging failures.
        }
    }
}
