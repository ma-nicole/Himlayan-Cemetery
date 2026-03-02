<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\PasswordResetMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user and create token
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if email exists
        if (!$user) {
            return $this->errorResponse(
                'The email address you entered isn\'t connected to an account. Please check your email and try again.',
                401
            );
        }

        // Check if password is correct
        if (!Hash::check($request->password, $user->password)) {
            return $this->errorResponse(
                'The password you entered is incorrect. Please try again or reset your password.',
                401
            );
        }

        // Delete existing tokens
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'must_change_password' => $user->must_change_password,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Login successful');
    }

    /**
     * Logout user (revoke token)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logged out successfully');
    }

    /**
     * Get authenticated user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function user(Request $request)
    {
        $user = $request->user();
        
        $avatarUrl = null;
        if ($user->avatar) {
            // Build the full URL for the avatar
            $avatarUrl = url('storage/' . $user->avatar);
        }

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'avatar' => $avatarUrl,
            'role' => $user->role,
            'must_change_password' => $user->must_change_password,
        ], 'User retrieved successfully');
    }

    /**
     * Register a new user
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'visitor', // Default role for new registrations
        ]);

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 'Registration successful', 201);
    }

    /**
     * Change user password
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('Current password is incorrect', 401);
        }

        // Check if new password is different from current
        if (Hash::check($request->new_password, $user->password)) {
            return $this->errorResponse('New password must be different from current password', 422);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->must_change_password = false;
        $user->last_password_change = now();
        
        // Mark invitation as accepted if this is first password change
        if ($user->invitation_sent_at && !$user->invitation_accepted) {
            $user->invitation_accepted = true;
        }
        
        $user->save();

        // Revoke all tokens to force re-login
        $user->tokens()->delete();

        return $this->successResponse(null, 'Password changed successfully. Please log in again with your new password.');
    }

    /**
     * Send password reset link to email
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Always return success message for security (don't reveal if email exists)
        if (!$user) {
            return $this->successResponse(null, 'If an account with that email exists, we have sent a password reset link.');
        }

        // Rate limiting: Check if reset was requested recently (within 2 minutes)
        $recentReset = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('created_at', '>', now()->subMinutes(2))
            ->first();

        if ($recentReset) {
            return $this->errorResponse('Please wait a few minutes before requesting another reset link.', 429);
        }

        // Generate secure token
        $token = Str::random(64);

        // Delete any existing reset tokens for this email
        DB::table('password_resets')->where('email', $request->email)->delete();

        // Store new token (hashed for security)
        DB::table('password_resets')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Build reset URL (pointing to frontend)
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $resetUrl = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        try {
            Mail::to($request->email)->send(new PasswordResetMail($resetUrl, $user->name));
        } catch (\Exception $e) {
            \Log::error('Password reset email failed: ' . $e->getMessage());
            return $this->errorResponse('Failed to send reset email. Please try again later.', 500);
        }

        return $this->successResponse(null, 'If an account with that email exists, we have sent a password reset link.');
    }

    /**
     * Reset password using token
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Find the reset record
        $resetRecord = DB::table('password_resets')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return $this->errorResponse('Invalid or expired reset link.', 400);
        }

        // Check if token is expired (60 minutes)
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            DB::table('password_resets')->where('email', $request->email)->delete();
            return $this->errorResponse('This reset link has expired. Please request a new one.', 400);
        }

        // Verify token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return $this->errorResponse('Invalid reset link.', 400);
        }

        // Find user
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->last_password_change = now();
        $user->save();

        // Revoke all tokens
        $user->tokens()->delete();

        // Delete the reset record
        DB::table('password_resets')->where('email', $request->email)->delete();

        return $this->successResponse(null, 'Password has been reset successfully. You can now log in with your new password.');
    }
}
