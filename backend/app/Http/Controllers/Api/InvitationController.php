<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\BurialRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Mail\UserInvitation;

class InvitationController extends Controller
{
    /**
     * Resolve a usable mailer even when MAIL_MAILER is blank/misconfigured.
     */
    private function resolveMailer(): string
    {
        $configured = trim((string) config('mail.default', ''));

        if ($configured !== '' && is_array(config("mail.mailers.$configured"))) {
            return $configured;
        }

        if (is_array(config('mail.mailers.smtp'))) {
            return 'smtp';
        }

        return $configured !== '' ? $configured : 'smtp';
    }

    /**
     * Sanitize low-level mail error text for safe API responses.
     */
    private function sanitizeMailErrorMessage(string $message): string
    {
        $clean = trim(preg_replace('/\s+/', ' ', $message) ?? '');

        if ($clean === '') {
            return 'No error details were returned by the mail transport.';
        }

        foreach ([
            (string) config('mail.mailers.smtp.password'),
            (string) config('mail.mailers.smtp.username'),
            (string) config('mail.from.address'),
        ] as $secret) {
            if ($secret !== '') {
                $clean = str_replace($secret, '***', $clean);
            }
        }

        return Str::limit($clean, 240, '...');
    }

    /**
     * Validate active mail configuration before attempting to send.
     */
    private function validateMailConfiguration(): ?string
    {
        $mailer = $this->resolveMailer();

        if ($mailer !== 'smtp') {
            if (!is_array(config("mail.mailers.$mailer"))) {
                return 'Mail transport is misconfigured. Please set MAIL_MAILER to a valid mailer (for example: smtp).';
            }

            return null;
        }

        $requiredKeys = [
            'mail.mailers.smtp.host' => 'MAIL_HOST',
            'mail.mailers.smtp.port' => 'MAIL_PORT',
            'mail.mailers.smtp.username' => 'MAIL_USERNAME',
            'mail.mailers.smtp.password' => 'MAIL_PASSWORD',
            'mail.from.address' => 'MAIL_FROM_ADDRESS',
            'mail.from.name' => 'MAIL_FROM_NAME',
        ];

        $missing = [];
        foreach ($requiredKeys as $configKey => $envKey) {
            $value = config($configKey);
            if ($value === null || trim((string) $value) === '') {
                $missing[] = $envKey;
            }
        }

        if (in_array('MAIL_FROM_ADDRESS', $missing, true) || config('mail.from.address') === 'hello@example.com') {
            if (!in_array('MAIL_FROM_ADDRESS', $missing, true)) {
                $missing[] = 'MAIL_FROM_ADDRESS';
            }
        }

        if (empty($missing)) {
            return null;
        }

        return 'Email service configuration is incomplete on the server. Missing: ' . implode(', ', $missing) . '.';
    }

    /**
     * Convert low-level mail exceptions into actionable user-facing messages.
     */
    private function mapMailErrorToMessage(\Throwable $exception): string
    {
        $error = strtolower($exception->getMessage());

        if (
            str_contains($error, 'authentication') ||
            str_contains($error, '535') ||
            str_contains($error, 'username and password not accepted')
        ) {
            return 'Email service authentication failed. Please verify SMTP credentials on the server.';
        }

        if (
            str_contains($error, 'failed to connect') ||
            str_contains($error, 'connection could not be established') ||
            str_contains($error, 'connection refused') ||
            str_contains($error, 'timed out') ||
            str_contains($error, 'php_network_getaddresses') ||
            str_contains($error, 'name or service not known') ||
            str_contains($error, 'stream_socket_client') ||
            str_contains($error, 'network is unreachable')
        ) {
            return 'Email service is unreachable right now. Please verify MAIL_HOST and MAIL_PORT on the server.';
        }

        if (
            str_contains($error, 'starttls') ||
            str_contains($error, 'encryption') ||
            str_contains($error, 'ssl') ||
            str_contains($error, 'tls') ||
            str_contains($error, 'stream_socket_enable_crypto')
        ) {
            return 'Email encryption settings are invalid. Please verify MAIL_ENCRYPTION and MAIL_PORT on the server.';
        }

        if (
            str_contains($error, 'recipient address rejected') ||
            str_contains($error, 'user unknown') ||
            str_contains($error, 'no such user') ||
            str_contains($error, '550')
        ) {
            return 'Recipient address was rejected by the mail provider. Please double-check the email address.';
        }

        if (
            str_contains($error, 'from address') ||
            str_contains($error, 'sender address rejected') ||
            str_contains($error, 'mail_from_address') ||
            str_contains($error, 'sender verify failed') ||
            str_contains($error, 'domain does not exist') ||
            str_contains($error, 'mail from address')
        ) {
            return 'Sender address/domain is invalid or rejected. Please verify MAIL_FROM_ADDRESS and sender domain DNS settings.';
        }

        return 'Unable to send invitation email right now. Mail transport returned: ' . $this->sanitizeMailErrorMessage($exception->getMessage());
    }

    /**
     * Generate password based on burial record
     * Format: plotnumber+Lastname+lastfourdigits
     */
    private function generatePassword(BurialRecord $burialRecord)
    {
        $plotNumber = preg_replace('/[^A-Za-z0-9]/', '', (string) $burialRecord->plot->plot_number);
        
        // Get last name - use contact_last_name if available, otherwise extract from full name
        if ($burialRecord->contact_last_name) {
            $lastName = $burialRecord->contact_last_name;
        } else {
            $nameParts = explode(' ', $burialRecord->contact_name);
            $lastName = end($nameParts); // Get the last part of the name
        }

        $lastName = preg_replace('/[^A-Za-z]/', '', (string) $lastName);
        $lastName = ucfirst(strtolower($lastName));
        
        $phone = preg_replace('/\D/', '', (string) $burialRecord->contact_phone);
        $lastFourDigits = substr($phone, -4);

        $password = $plotNumber . $lastName . $lastFourDigits . '!Aa';

        // Ensure minimum length for strong password baseline.
        if (strlen($password) < 12) {
            $password .= Str::upper(Str::random(12 - strlen($password)));
        }

        return $password;
    }

    /**
     * Validate burial/contact data required for invitation generation.
     */
    private function validateInvitationPrerequisites(BurialRecord $burialRecord): ?string
    {
        if (!$burialRecord->plot || trim((string) $burialRecord->plot->plot_number) === '') {
            return 'Plot information is missing for this burial record. Please assign a plot with a plot number before sending an invitation.';
        }

        $phoneDigits = preg_replace('/\D/', '', (string) $burialRecord->contact_phone);
        if (strlen($phoneDigits) < 4) {
            return 'Contact phone number must have at least 4 digits to generate initial credentials.';
        }

        $hasLastName = trim((string) $burialRecord->contact_last_name) !== '';
        $hasContactName = trim((string) $burialRecord->contact_name) !== '';
        if (!$hasLastName && !$hasContactName) {
            return 'Contact name is missing. Please provide contact name details before sending an invitation.';
        }

        return null;
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

        $prerequisiteError = $this->validateInvitationPrerequisites($burialRecord);
        if ($prerequisiteError) {
            return $this->errorResponse($prerequisiteError, 400);
        }

        // Check if user already exists and accepted
        $existingUser = User::where('email', $burialRecord->contact_email)->first();
        if ($existingUser && $existingUser->invitation_accepted) {
            return $this->successResponse([
                'message' => 'Account already active. Burial record linked to existing account'
            ], 'Burial record linked to existing account successfully');
        }

        // Generate password and token (don't create user yet)
        try {
            $password = $this->generatePassword($burialRecord);
        } catch (\Throwable $e) {
            Log::error('Invitation preparation failed', [
                'burial_record_id' => $burialRecord->id,
                'recipient' => $burialRecord->contact_email,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return $this->errorResponse('Unable to prepare invitation credentials. Please verify plot and contact details for this burial record.', 500);
        }
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

        $expiresAt = now()->addDay();

        $mailConfigError = $this->validateMailConfiguration();
        if ($mailConfigError) {
            Log::error('Invitation email blocked: invalid mail configuration', [
                'burial_record_id' => $burialRecord->id,
                'recipient' => $burialRecord->contact_email,
                'message' => $mailConfigError,
            ]);

            return $this->errorResponse($mailConfigError, 500);
        }

        // Send email with credentials
        try {
            Mail::mailer($this->resolveMailer())
                ->to($burialRecord->contact_email)
                ->send(new UserInvitation($invitationData, $burialRecord));
        } catch (\Throwable $e) {
            // Keep status accurate: do not leave record as pending when email was not sent.
            cache()->forget('invitation_' . $token);
            cache()->forget('invitation_status_burial_' . $burialRecord->id);

            Log::error('Email send failed for ' . $burialRecord->contact_email, [
                'error' => $e->getMessage(),
                'exception_class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'full_trace' => $e->getTraceAsString()
            ]);

            return $this->errorResponse($this->mapMailErrorToMessage($e), 500);
        }

        // Persist invitation only after successful delivery.
        cache()->put('invitation_' . $token, $invitationData, $expiresAt);
        cache()->put('invitation_status_burial_' . $burialRecord->id, [
            'status' => 'pending',
            'email' => $burialRecord->contact_email,
            'token' => $token,
            'expires_at' => $expiresAt->toDateTimeString(),
        ], $expiresAt);

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

        $prerequisiteError = $this->validateInvitationPrerequisites($burialRecord);
        if ($prerequisiteError) {
            return $this->errorResponse($prerequisiteError, 400);
        }

        // Check if user already exists and accepted
        $existingUser = User::where('email', $burialRecord->contact_email)->first();
        if ($existingUser && $existingUser->invitation_accepted) {
            return $this->successResponse([
                'message' => 'Account already active. Burial record linked to existing account'
            ], 'Burial record linked to existing account successfully');
        }

        // Regenerate password and token
        try {
            $password = $this->generatePassword($burialRecord);
        } catch (\Throwable $e) {
            Log::error('Invitation resend preparation failed', [
                'burial_record_id' => $burialRecord->id,
                'recipient' => $burialRecord->contact_email,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return $this->errorResponse('Unable to prepare invitation credentials. Please verify plot and contact details for this burial record.', 500);
        }
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

        $expiresAt = now()->addDay();

        $mailConfigError = $this->validateMailConfiguration();
        if ($mailConfigError) {
            Log::error('Invitation resend blocked: invalid mail configuration', [
                'burial_record_id' => $burialRecord->id,
                'recipient' => $burialRecord->contact_email,
                'message' => $mailConfigError,
            ]);

            return $this->errorResponse($mailConfigError, 500);
        }

        // Send email
        try {
            Mail::mailer($this->resolveMailer())
                ->to($burialRecord->contact_email)
                ->send(new UserInvitation($invitationData, $burialRecord));
        } catch (\Throwable $e) {
            cache()->forget('invitation_' . $token);
            cache()->forget('invitation_status_burial_' . $burialRecord->id);

            Log::error('Email resend failed for ' . $burialRecord->contact_email, [
                'error' => $e->getMessage(),
                'exception_class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'full_trace' => $e->getTraceAsString()
            ]);

            return $this->errorResponse($this->mapMailErrorToMessage($e), 500);
        }

        cache()->put('invitation_' . $token, $invitationData, $expiresAt);
        cache()->put('invitation_status_burial_' . $burialRecord->id, [
            'status' => 'pending',
            'email' => $burialRecord->contact_email,
            'token' => $token,
            'expires_at' => $expiresAt->toDateTimeString(),
        ], $expiresAt);

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
                // If the cached email doesn't match current email, treat as not sent (email was changed)
                if ($cachedStatus['email'] !== $burialRecord->contact_email) {
                    return $this->successResponse(['status' => 'not_sent'], 'No invitation sent');
                }

                $expiresAt = isset($cachedStatus['expires_at']) ? Carbon::parse($cachedStatus['expires_at']) : null;
                $isExpired = $expiresAt ? $expiresAt->isPast() : false;

                return $this->successResponse([
                    'status' => $isExpired ? 'expired' : 'pending',
                    'user' => [
                        'email' => $burialRecord->contact_email,
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
