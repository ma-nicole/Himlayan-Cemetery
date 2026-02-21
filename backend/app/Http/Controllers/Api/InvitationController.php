<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\BurialRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
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
     * Allows multiple burial records for the same active account
     */
    public function sendInvitation(Request $request, $burialRecordId)
    {
        $burialRecord = BurialRecord::with('plot')->findOrFail($burialRecordId);
        
        // Validate that burial record has contact information
        if (!$burialRecord->contact_email) {
            return $this->errorResponse('Burial record must have a contact email address', 400);
        }

        if (!$burialRecord->contact_phone) {
            return $this->errorResponse('Burial record must have a contact phone number', 400);
        }

        // Check if user already exists with this email
        $existingUser = User::where('email', $burialRecord->contact_email)->first();
        
        // If user exists and invitation is already accepted, just return success
        if ($existingUser && $existingUser->invitation_accepted) {
            return $this->successResponse([
                'user' => $existingUser,
                'is_existing_account' => true,
                'message' => 'This burial record is now linked to an existing active account'
            ], 'Burial record linked to existing account successfully');
        }

        // Generate password
        $password = $this->generatePassword($burialRecord);
        
        // Generate invitation token
        $token = Str::random(64);
        
        // Get full contact name
        $fullName = $burialRecord->contact_first_name 
            ? trim("{$burialRecord->contact_first_name} {$burialRecord->contact_middle_initial} {$burialRecord->contact_last_name}")
            : $burialRecord->contact_name;

        // Create or update user
        $user = User::updateOrCreate(
            ['email' => $burialRecord->contact_email],
            [
                'name' => $fullName,
                'password' => Hash::make($password),
                'role' => 'visitor',
                'invitation_token' => $token,
                'invitation_sent_at' => now(),
                'invitation_expires_at' => now()->addDay(), // 1 day expiration
                'invitation_accepted' => false,
                'must_change_password' => true,
            ]
        );

        // Send email with credentials
        try {
            Mail::to($user->email)->send(new UserInvitation($user, $password, $burialRecord));
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to send invitation email: ' . $e->getMessage(), 500);
        }

        return $this->successResponse([
            'user' => $user,
            'invitation_sent_at' => $user->invitation_sent_at,
            'invitation_expires_at' => $user->invitation_expires_at,
            'is_existing_account' => false
        ], 'Invitation sent successfully');
    }

    /**
     * Resend invitation
     * Allows resending to accounts that haven't accepted yet, or returns success for active accounts
     */
    public function resendInvitation(Request $request, $burialRecordId)
    {
        $burialRecord = BurialRecord::with('plot')->findOrFail($burialRecordId);
        
        // Find the user
        $user = User::where('email', $burialRecord->contact_email)->first();
        
        if (!$user) {
            return $this->errorResponse('No invitation found for this burial record', 404);
        }

        // If user already accepted, just return success
        if ($user->invitation_accepted) {
            return $this->successResponse([
                'user' => $user,
                'is_existing_account' => true,
                'message' => 'This burial record is linked to an active account. Invitation not needed.'
            ], 'Burial record linked to existing account successfully');
        }

        // Regenerate password and token
        $password = $this->generatePassword($burialRecord);
        $token = Str::random(64);
        
        // Update user
        $user->update([
            'password' => Hash::make($password),
            'invitation_token' => $token,
            'invitation_sent_at' => now(),
            'invitation_expires_at' => now()->addDay(),
            'must_change_password' => true,
        ]);

        // Send email
        try {
            Mail::to($user->email)->send(new UserInvitation($user, $password, $burialRecord));
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to resend invitation email: ' . $e->getMessage(), 500);
        }

        return $this->successResponse([
            'user' => $user,
            'invitation_sent_at' => $user->invitation_sent_at,
            'invitation_expires_at' => $user->invitation_expires_at,
            'is_existing_account' => false
        ], 'Invitation resent successfully');
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
            return $this->successResponse(['status' => 'not_sent'], 'No invitation sent');
        }

        // Check if invitation was actually sent (not just user exists)
        if (!$user->invitation_sent_at) {
            return $this->successResponse(['status' => 'not_sent'], 'No invitation sent');
        }

        if ($user->invitation_accepted) {
            return $this->successResponse([
                'status' => 'accepted',
                'user' => $user
            ], 'Invitation accepted');
        }

        if ($user->invitation_expires_at && $user->invitation_expires_at < now()) {
            return $this->successResponse([
                'status' => 'expired',
                'user' => $user,
                'expired_at' => $user->invitation_expires_at
            ], 'Invitation expired');
        }

        return $this->successResponse([
            'status' => 'pending',
            'user' => $user,
            'sent_at' => $user->invitation_sent_at,
            'expires_at' => $user->invitation_expires_at
        ], 'Invitation pending');
    }
}
