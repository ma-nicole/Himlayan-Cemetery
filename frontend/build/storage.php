<?php
declare(strict_types=1);

/**
 * Secure storage proxy – serves files from backend storage.
 * Requests are rewritten here from /storage/{file} by .htaccess,
 * bypassing any symlink limitations on the shared hosting server.
 */

$file = isset($_GET['file']) ? (string) $_GET['file'] : '';
$file = ltrim(strtr($file, ['\\' => '/', "\0" => '']), '/');

// Reject empty paths and any path-traversal attempts
if ($file === '' || strpos($file, '..') !== false) {
    http_response_code(400);
    exit;
}

// ── Discover the storage root ──────────────────────────────────────────────

$storageRoot = null;

// Method 1: read the exact path written by the deploy script
$configFile = __DIR__ . '/.storage_config';
if (is_readable($configFile)) {
    $candidate = trim(file_get_contents($configFile));
    if ($candidate !== '') {
        $real = realpath($candidate);
        if ($real && is_dir($real)) {
            $storageRoot = $real;
        }
    }
}

// Method 2: search sibling directories of public_html (fallback)
if ($storageRoot === null) {
    $parent = realpath(dirname(__DIR__));
    if ($parent) {
        foreach (glob($parent . '/*/backend/storage/app/public', GLOB_ONLYDIR) ?: [] as $c) {
            $real = realpath($c);
            if ($real) {
                $storageRoot = $real;
                break;
            }
        }
    }
}

if ($storageRoot === null) {
    http_response_code(500);
    exit;
}

// ── Resolve and validate the target path ──────────────────────────────────

$fullPath = realpath($storageRoot . DIRECTORY_SEPARATOR . $file);

if (
    $fullPath === false ||
    strncmp($fullPath, $storageRoot . DIRECTORY_SEPARATOR, strlen($storageRoot) + 1) !== 0 ||
    !is_file($fullPath) ||
    !is_readable($fullPath)
) {
    http_response_code(404);
    exit;
}

// ── Serve the file ─────────────────────────────────────────────────────────

$allowed = [
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'svg'  => 'image/svg+xml',
    'pdf'  => 'application/pdf',
];

$ext  = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
$mime = $allowed[$ext]
    ?? (function_exists('mime_content_type') ? mime_content_type($fullPath) : 'application/octet-stream');

header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=86400');
header('Content-Length: ' . filesize($fullPath));
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

readfile($fullPath);
exit;
