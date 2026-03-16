<?php

namespace App\Http\Middleware;

use App\Services\SecurityAuditService;
use App\Services\ValidationRules;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Keys that should not be transformed to avoid mutating credentials/tokens.
     */
    private array $skipTransformKeys = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'new_password_confirmation',
        'token',
    ];

    /**
     * Handle an incoming request by sanitizing input and rejecting suspicious payloads.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $flaggedFields = [];

        $sanitizedBody = $this->sanitizeArray($request->all(), $flaggedFields);
        $request->merge($sanitizedBody);

        $sanitizedQuery = $this->sanitizeArray($request->query(), $flaggedFields);
        $request->query->replace($sanitizedQuery);

        if (!empty($flaggedFields)) {
            $uniqueFields = array_values(array_unique($flaggedFields));

            SecurityAuditService::log(
                'input.sanitization',
                'failed',
                'Request blocked due to suspicious input payload',
                $request,
                $request->user()?->id,
                ['fields' => $uniqueFields]
            );

            return response()->json([
                'success' => false,
                'message' => 'Invalid input detected. Please remove unsafe characters and try again.',
                'fields' => $uniqueFields,
                'code' => 'input_sanitization_failed',
            ], 422);
        }

        return $next($request);
    }

    private function sanitizeArray(array $payload, array &$flaggedFields, string $path = ''): array
    {
        $sanitized = [];

        foreach ($payload as $key => $value) {
            $currentPath = $path === '' ? (string) $key : $path . '.' . $key;
            $fieldName = strtolower((string) $key);

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value, $flaggedFields, $currentPath);
                continue;
            }

            if (!is_string($value)) {
                $sanitized[$key] = $value;
                continue;
            }

            if (in_array($fieldName, $this->skipTransformKeys, true)) {
                $sanitized[$key] = $value;
                continue;
            }

            $cleaned = str_replace("\0", '', $value);

            if ($this->containsSuspiciousPayload($cleaned)) {
                $flaggedFields[] = $currentPath;
            }

            // Remove script tags/event handlers and strip any remaining HTML tags.
            $cleaned = ValidationRules::sanitizeHtml($cleaned);
            $cleaned = strip_tags($cleaned);
            $cleaned = trim($cleaned);

            $sanitized[$key] = $cleaned;
        }

        return $sanitized;
    }

    private function containsSuspiciousPayload(string $value): bool
    {
        $patterns = [
            '/(<script\b|javascript:|onerror\s*=|onload\s*=|<iframe\b)/i',
            '/(\bunion\b\s+\bselect\b|\bselect\b.+\bfrom\b|\bdrop\b\s+\btable\b|\binsert\b\s+\binto\b|\bdelete\b\s+\bfrom\b|\bupdate\b\s+\w+\s+\bset\b)/i',
            '/(\bor\b\s+1\s*=\s*1|\band\b\s+1\s*=\s*1|--|\/\*|\*\/|#)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }

        return false;
    }
}
