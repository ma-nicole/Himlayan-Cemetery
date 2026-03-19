<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private function buildSocialAvatarUrl(?string $avatarPath): ?string
    {
        if (!$avatarPath || trim($avatarPath) === '') return null;
        $avatarPath = trim($avatarPath);
        // External social avatar — preserve as-is, force HTTPS
        if (preg_match('/^https?:\/\//i', $avatarPath)) {
            if (!preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?#i', $avatarPath)) {
                return preg_replace('/^http:\/\//i', 'https://', $avatarPath);
            }
            // localhost URL — fall through to local path handling
            $avatarPath = ltrim(parse_url($avatarPath, PHP_URL_PATH) ?? '', '/');
        }
        $normalized = ltrim(str_replace('\\', '/', $avatarPath), '/');
        if (str_starts_with($normalized, 'storage/')) {
            $normalized = substr($normalized, strlen('storage/'));
        }
        // Route through the backend API file-serving endpoint to avoid
        // relying on the /storage symlink in public_html.
        return rtrim(config('app.url'), '/') . '/api/file/' . $normalized;
    }

    /**
     * Redirect to OAuth provider
     * 
     * @param string $provider
     * @return \Illuminate\Http\JsonResponse
     */
    public function redirect($provider)
    {
        $validProviders = ['google', 'facebook', 'apple'];

        if (!in_array($provider, $validProviders)) {
            return $this->errorResponse('Invalid provider', 400);
        }

        try {
            $url = Socialite::driver($provider)
                ->stateless()
                ->redirect()
                ->getTargetUrl();

            return $this->successResponse(['url' => $url], 'Redirect URL generated');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to get redirect URL: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Handle OAuth callback
     * 
     * @param string $provider
     * @return \Illuminate\Http\RedirectResponse
     */
    public function callback($provider)
    {
        $validProviders = ['google', 'facebook', 'apple'];

        if (!in_array($provider, $validProviders)) {
            return redirect(config('app.frontend_url') . '/login?error=invalid_provider');
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();

            // Find or create user
            $user = User::where('email', $socialUser->getEmail())->first();

            if (!$user) {
                // Create new user
                $user = User::create([
                    'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
                    'email' => $socialUser->getEmail(),
                    'password' => Hash::make(Str::random(24)),
                    'role' => 'member',
                    'provider' => $provider,
                    'provider_id' => $socialUser->getId(),
                    'avatar' => $socialUser->getAvatar(),
                    'email_verified_at' => now(),
                ]);
            } else {
                // Update provider info if needed
                $user->update([
                    'provider' => $provider,
                    'provider_id' => $socialUser->getId(),
                    'avatar' => $socialUser->getAvatar() ?? $user->avatar,
                ]);
            }

            // Delete existing tokens
            $user->tokens()->delete();

            // Create new token with explicit expiry
            $expiryMinutes = (int) config('sanctum.expiration', 120);
            $tokenExpiresAt = now()->addMinutes($expiryMinutes);
            $token = $user->createToken('auth_token', ['*'], $tokenExpiresAt)->plainTextToken;

            // Redirect to frontend with token
            $frontendUrl = config('app.frontend_url', 'https://himlayangpilipino.com');
            
            return redirect($frontendUrl . '/auth/callback?' . http_build_query([
                'token' => $token,
                'token_expires_at' => $tokenExpiresAt->toISOString(),
                'user' => json_encode([
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'role' => $user->role,
                    'avatar' => $this->buildSocialAvatarUrl($user->avatar),
                    'updated_at' => $user->updated_at?->toISOString(),
                ]),
            ]));

        } catch (\Exception $e) {
            $frontendUrl = config('app.frontend_url', 'https://himlayangpilipino.com');
            return redirect($frontendUrl . '/login?error=' . urlencode($e->getMessage()));
        }
    }
}
