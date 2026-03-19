<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class StorageController extends Controller
{
    /**
     * Serve a public storage file through the backend API.
     *
     * This route exists so image/file URLs never depend on the /storage
     * symlink in public_html (which can silently break on shared hosting),
     * and never depend on mod_rewrite rules that may be server-specific.
     *
     * URL pattern: GET /api/file/{path}   (wildcard, e.g. deceased_photos/photo.jpg)
     */
    public function serve(string $path)
    {
        // Security: reject path-traversal attempts
        $path = str_replace('\\', '/', $path);
        if (str_contains($path, '..') || str_contains($path, "\0")) {
            abort(400, 'Invalid path');
        }

        $disk = Storage::disk('public');

        if (!$disk->exists($path)) {
            abort(404);
        }

        $mimeType = $disk->mimeType($path) ?: 'application/octet-stream';

        // Only allow safe media types — no PHP, HTML, JS, etc.
        $allowed = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'application/pdf',
        ];

        if (!in_array($mimeType, $allowed)) {
            abort(403, 'File type not allowed');
        }

        return response($disk->get($path), 200, [
            'Content-Type'            => $mimeType,
            'Cache-Control'           => 'public, max-age=86400',
            'Content-Length'          => $disk->size($path),
            'X-Content-Type-Options'  => 'nosniff',
        ]);
    }
}
