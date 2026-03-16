<?php

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'himlayangpilipino.com,www.himlayangpilipino.com',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    'guard' => ['web'],

    // Token lifetime in minutes for personal access tokens.
    'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 120),

    // Maximum token age (minutes) allowed for sensitive operations.
    'sensitive_operation_expiration' => env('SANCTUM_SENSITIVE_OPERATION_EXPIRATION', 15),

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];
