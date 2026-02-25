<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\BurialRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Mail\UserInvitation;

class InvitationController extends Controller
{
    /**
     * Generate password based on burial record
     * Format: plotnumber+Lastname+lastfourdigits
     */
    private function generatePassword(BurialRecord $burialRecord)
    {
        $plotNumber = $burialRecord->plot->plot_number;
        
        // Get last name - use contact_last_name if available, otherwise extract from full name
        if ($burialRecord->contact_last_name) {
            $lastName = $burialRecord->contact_last_name;
        } else {
            $nameParts = explode(' ', $burialRecord->contact_name);
            $lastName = end($nameParts); // Get the last part of the name
        }
        
        $phone = $burialRecord->contact_phone;
        $lastFourDigits = substr($phone, -4);
        
        return $plotNumber . $lastName . $lastFourDigits;
    }

    /**
     * Send invitation to create user account
     * Generates credentials but does NOT create user yet
     */
    public function sendInvitation(Request $request, $burialRecordId)
    {
        $burialRecord = BurialRecord::with('plot')->findOrFail($burialRecordId);
        
        // Check if contact email exists
        if (!$burialRecord->contact_email || trim($burialRecord->contact_email) === '') {
            return $this->errorResponse('Contact email is missing. Please add the email to the burial record.', 400);
        }

        // Validate email format using PHP's built-in filter
        if (!filter_var($burialRecord->contact_email, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse('Contact email is invalid: ' . $burialRecord->contact_email, 400);
        }

        if (!$burialRecord->contact_phone || trim($burialRecord->contact_phone) === '') {
            return $this->errorResponse('Contact phone number is missing. Please add the phone number to the burial record.', 400);
        }

        // Check if user already exists and accepted
        $existingUser = User::where('email', $burialRecord->contact_email)->first();
        if ($existingUser && $existingUser->invitation_accepted) {
            return $this->successResponse([
                'message' => 'Account already active. Burial record linked to existing account'
            ], 'Burial record linked to existing account successfully');
        }

        // Generate password and token (don't create user yet)
        $password = $this->generatePassword($burialRecord);
        $token = Str::random(64);
        
        // Get full contact name
        $fullName = $burialRecord->contact_first_name 
            ? trim("{$burialRecord->contact_first_name} {$burialRecord->contact_middle_initial} {$burialRecord->contact_last_name}")
            : $burialRecord->contact_name;

        // Create invitation data array (no user created)
        $invitationData = [
            'burial_record_id' => $burialRecord->id,
            'email' => $burialRecord->contact_email,
            'name' => $fullName,
            'password' => $password,
            'token' => $token,
            'accept_url' => config('app.frontend_url') . '/accept-invitation?token=' . $token
        ];

        // Store invitation data temporarily (24 hour expiration)
        cache()->put('invitation_' . $token, $invitationData, now()->addDay());

        // Store status snapshot per burial record so admin UI can show pending before account creation
        cache()->put('invitation_status_burial_' . $burialRecord->id, [
            'status' => 'pending',
            'email' => $burialRecord->contact_email,
            'token' => $token,
            'expires_at' => now()->addDay()->toDateTimeString(),
        ], now()->addDay());

        // Send email with credentials
        try {
            Mail::to($burialRecord->contact_email)->send(new UserInvitation($invitationData, $burialRecord));
        } catch (\Exception $e) {
            Log::error('Email send failed for ' . $burialRecord->contact_email, [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return $this->errorResponse('This email is invalid or does not exist.', 400);
        }

        return $this->successResponse([
            'message' => 'Invitation sent successfully. User account will be created when they accept the invitation.'
        ], 'Invitation sent successfully');
    }

    /**
     * Resend invitation
     * Allows resending to accounts that haven't accepted yet, or returns success for active accounts
     */
    public function resendInvitation(Request $request, $burialRecordId)
    {
        $burialRecord = BurialRecord::with('plot')->findOrFail($burialRecordId);
        
        // Check if contact email exists
        if (!$burialRecord->contact_email || trim($burialRecord->contact_email) === '') {
            return $this->errorResponse('Contact email is missing. Please add the email to the burial record.', 400);
        }

        // Validate email format
        if (!filter_var($burialRecord->contact_email, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse('Contact email is invalid: ' . $burialRecord->contact_email, 400);
        }
        
        if (!$burialRecord->contact_phone || trim($burialRecord->contact_phone) === '') {
            return $this->errorResponse('Contact phone number is missing. Please add the phone number to the burial record.', 400);
        }

        // Check if user already exists and accepted
        $existingUser = User::where('email', $burialRecord->contact_email)->first();
        if ($existingUser && $existingUser->invitation_accepted) {
            return $this->successResponse([
                'message' => 'Account already active. Burial record linked to existing account'
            ], 'Burial record linked to existing account successfully');
        }

        // Regenerate password and token
        $password = $this->generatePassword($burialRecord);
        $token = Str::random(64);
        
        // Get full contact name
        $fullName = $burialRecord->contact_first_name 
            ? trim("{$burialRecord->contact_first_name} {$burialRecord->contact_middle_initial} {$burialRecord->contact_last_name}")
            : $burialRecord->contact_name;

        // Create invitation data array
        $invitationData = [
            'burial_record_id' => $burialRecord->id,
            'email' => $burialRecord->contact_email,
            'name' => $fullName,
            'password' => $password,
            'token' => $token,
            'accept_url' => config('app.frontend_url') . '/accept-invitation?token=' . $token
        ];

        // Store invitation data in cache (also serves as a flag that invitation was sent)
        cache()->put('invitation_' . $token, $invitationData, now()->addDay());

        // Refresh status snapshot for admin UI
        cache()->put('invitation_status_burial_' . $burialRecord->id, [
            'status' => 'pending',
            'email' => $burialRecord->contact_email,
            'token' => $token,
            'expires_at' => now()->addDay()->toDateTimeString(),
        ], now()->addDay());

        // Send email
        try {
            Mail::to($burialRecord->contact_email)->send(new UserInvitation($invitationData, $burialRecord));
        } catch (\Exception $e) {
            Log::error('Email resend failed for ' . $burialRecord->contact_email, [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return $this->errorResponse('Failed to send email. Please check the email address.', 400);
        }

        return $this->successResponse([
            'message' => 'Invitation resent successfully. User account will be created when they accept the invitation.'
        ], 'Invitation resent successfully');
    }

    /**
     * Get invitation details by token (without creating account)
     * Retrieves stored invitation data for user to review before accepting
     */
    public function getInvitationDetails(Request $request)
    {
        $token = $request->query('token');
        
        if (!$token) {
            return $this->errorResponse('Token is required', 400);
        }

        // Check cache first
        $invitationData = cache()->get('invitation_' . $token);

        if (!$invitationData) {
            return $this->errorResponse('Invalid or expired invitation token. Please request a new invitation.', 400);
        }

        return $this->successResponse([
            'email' => $invitationData['email'],
            'name' => $invitationData['name'],
            'password' => $invitationData['password']
        ], 'Invitation details retrieved');
    }

    /**
     * Accept invitation and create user account
     */
    public function acceptInvitation(Request $request)
    {
        $token = $request->validate(['token' => 'required|string|size:64'])['token'];

        // Retrieve invitation data from cache
        $invitationData = cache()->get('invitation_' . $token);
        
        if (!$invitationData) {
            return $this->errorResponse('Invalid or expired invitation token', 400);
        }

        // Check if user already exists
        $existingUser = User::where('email', $invitationData['email'])->first();
        if ($existingUser) {
            return $this->errorResponse('Account already exists for this email', 400);
        }

        // Create user account
        try {
            $user = User::create([
                'email' => $invitationData['email'],
                'name' => $invitationData['name'],
                'password' => Hash::make($invitationData['password']),
                'role' => 'visitor',
                'invitation_accepted' => true,
                'must_change_password' => true,
            ]);

            // Remove invitation from cache
            cache()->forget('invitation_' . $token);

            if (!empty($invitationData['burial_record_id'])) {
                cache()->forget('invitation_status_burial_' . $invitationData['burial_record_id']);
            }

            return $this->successResponse([
                'user' => $user,
                'message' => 'Accepted! You may now login'
            ], 'Account created successfully');
        } catch (\Exception $e) {
            Log::error('Failed to create account on invitation accept', [
                'error' => $e->getMessage(),
                'email' => $invitationData['email']
            ]);
            return $this->errorResponse('Failed to create account', 500);
        }
    }

    /**
     * Get invitation status for a burial record
     */
    public function getInvitationStatus($burialRecordId)
    {
        $burialRecord = BurialRecord::findOrFail($burialRecordId);
        
        if (!$burialRecord->contact_email) {
            return $this->successResponse(['status' => 'no_email'], 'No contact email available');
        }

        $user = User::where('email', $burialRecord->contact_email)->first();
        
        if (!$user) {
            $cachedStatus = cache()->get('invitation_status_burial_' . $burialRecord->id);

            if ($cachedStatus) {
                $expiresAt = isset($cachedStatus['expires_at']) ? Carbon::parse($cachedStatus['expires_at']) : null;
                $isExpired = $expiresAt ? $expiresAt->isPast() : false;

                return $this->successResponse([
                    'status' => $isExpired ? 'expired' : 'pending',
                    'user' => [
                        'email' => $cachedStatus['email'] ?? $burialRecord->contact_email,
                        'invitation_expires_at' => $cachedStatus['expires_at'] ?? null,
                    ]
                ], $isExpired ? 'Invitation expired' : 'Invitation pending');
            }

            return $this->successResponse(['status' => 'not_sent'], 'No invitation sent');
        }

        if ($user->invitation_accepted) {
            return $this->successResponse([
                'status' => 'accepted',
                'user' => $user
            ], 'Invitation accepted');
        }

        return $this->successResponse([
            'status' => 'pending',
            'user' => $user
        ], 'Invitation pending');
    }
}
