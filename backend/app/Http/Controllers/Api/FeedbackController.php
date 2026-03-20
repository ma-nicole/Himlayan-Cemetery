<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\User;
use App\Mail\FeedbackNotification;
use App\Mail\FeedbackResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class FeedbackController extends Controller
{
    /**
     * Resolve recipients for feedback notification emails.
     */
    private function resolveFeedbackRecipients(): array
    {
        $configured = config('mail.feedback_to');

        if (is_string($configured) && trim($configured) !== '') {
            $emails = array_filter(array_map('trim', explode(',', $configured)), function ($email) {
                return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
            });

            if (!empty($emails)) {
                return array_values(array_unique($emails));
            }
        }

        $adminAndStaffEmails = User::whereIn('role', ['admin', 'staff'])
            ->whereNotNull('email')
            ->pluck('email')
            ->filter(function ($email) {
                return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
            })
            ->unique()
            ->values()
            ->toArray();

        if (!empty($adminAndStaffEmails)) {
            return $adminAndStaffEmails;
        }

        $fallback = config('mail.from.address');

        if (is_string($fallback) && filter_var($fallback, FILTER_VALIDATE_EMAIL)) {
            return [$fallback];
        }

        return [];
    }

    /**
     * Display a listing of feedbacks (admin only)
     */
    public function index(Request $request)
    {
        $query = Feedback::with(['user:id,name,email', 'responder:id,name']);

        // Status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Rating filter
        if ($request->has('rating') && $request->rating) {
            $query->where('rating', $request->rating);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->get('per_page', 10);
        $feedbacks = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $feedbacks->items(),
            'meta' => [
                'current_page' => $feedbacks->currentPage(),
                'last_page' => $feedbacks->lastPage(),
                'per_page' => $feedbacks->perPage(),
                'total' => $feedbacks->total(),
            ]
        ]);
    }

    /**
     * Store a newly created feedback (public or member)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'phone_country_code' => 'nullable|string|max:5',
            'message' => 'required|string',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        // Validate phone number if provided
        if ($validated['phone']) {
            $phoneRequirements = $this->getPhoneRequirements($validated['phone_country_code'] ?? '+63');
            if (strlen($validated['phone']) !== $phoneRequirements['digits']) {
                return $this->errorResponse(
                    "Phone number must be exactly {$phoneRequirements['digits']} digits for {$phoneRequirements['country']}.",
                    400
                );
            }
        }

        $feedback = Feedback::create([
            ...$validated,
            'user_id' => auth()->id() ?? null,
            'status' => 'new',
        ]);

        // Log the feedback submission (avoiding email template rendering issues)
        if (config('mail.default') === 'log') {
            // When using log driver, just log the details without rendering template
            Log::info('=== NEW FEEDBACK SUBMISSION ===', [
                'feedback_id' => $feedback->id,
                'timestamp' => now()->toDateTimeString(),
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? 'N/A',
                'phone_country_code' => $validated['phone_country_code'] ?? 'N/A',
                'message' => $validated['message'],
                'rating' => $validated['rating'] ?? 'N/A',
            ]);
            Log::info('=== END FEEDBACK SUBMISSION ===');
        } else {
            // When using SMTP, send the email
            try {
                $recipients = $this->resolveFeedbackRecipients();

                if (empty($recipients)) {
                    throw new \Exception('No valid feedback notification recipients configured');
                }

                Mail::to($recipients)->send(new FeedbackNotification($feedback));
                
                Log::info('Feedback email sent successfully', [
                    'feedback_id' => $feedback->id,
                    'recipients' => $recipients,
                    'sender_email' => $validated['email'],
                    'sender_name' => $validated['name'],
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to send feedback notification email', [
                    'error' => $e->getMessage(),
                    'feedback_id' => $feedback->id,
                    'exception_class' => get_class($e),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback!',
            'data' => $feedback
        ], 201);
    }

    /**
     * Get phone requirements by country code
     */
    private function getPhoneRequirements($countryCode)
    {
        $requirements = [
            '+63' => ['digits' => 10, 'country' => 'Philippines'],
            '+1' => ['digits' => 10, 'country' => 'USA/Canada'],
            '+44' => ['digits' => 10, 'country' => 'UK'],
            '+61' => ['digits' => 9, 'country' => 'Australia'],
            '+81' => ['digits' => 10, 'country' => 'Japan'],
            '+82' => ['digits' => 10, 'country' => 'South Korea'],
            '+86' => ['digits' => 11, 'country' => 'China'],
            '+65' => ['digits' => 8, 'country' => 'Singapore'],
            '+60' => ['digits' => 10, 'country' => 'Malaysia'],
            '+971' => ['digits' => 9, 'country' => 'UAE'],
        ];
        return $requirements[$countryCode] ?? ['digits' => 10, 'country' => 'Selected Country'];
    }

    /**
     * Display the specified feedback
     */
    public function show($id)
    {
        $feedback = Feedback::with(['user:id,name,email', 'responder:id,name'])->find($id);

        if (!$feedback) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback not found'
            ], 404);
        }

        // Mark as read if it's new
        if ($feedback->status === 'new') {
            $feedback->update(['status' => 'read']);
        }

        return response()->json([
            'success' => true,
            'data' => $feedback
        ]);
    }

    /**
     * Respond to feedback (admin/staff only)
     * Saves the response to the database AND emails it to the feedback submitter.
     */
    public function respond(Request $request, $id)
    {
        $feedback = Feedback::with('user:id,name,email')->find($id);

        if (!$feedback) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback not found'
            ], 404);
        }

        $validated = $request->validate([
            'admin_response' => 'required|string',
        ]);

        $feedback->update([
            'admin_response' => $validated['admin_response'],
            'status'         => 'responded',
            'responded_by'   => auth()->id(),
            'responded_at'   => now(),
        ]);

        // Determine recipient email:
        // - If the feedback came from a logged-in user, prefer their current account email.
        // - Otherwise use the email they submitted with the feedback form.
        $recipientEmail = $feedback->user?->email ?? $feedback->email;

        if (!filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
            Log::warning('Feedback response email skipped – no valid recipient address', [
                'feedback_id'     => $feedback->id,
                'feedback_email'  => $feedback->email,
                'user_email'      => $feedback->user?->email,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Response saved, but no valid email address found to notify the submitter.',
                'data'    => $feedback->load('responder:id,name'),
            ]);
        }

        try {
            Mail::to($recipientEmail)->send(new FeedbackResponse($feedback));

            Log::info('Feedback response email sent', [
                'feedback_id'  => $feedback->id,
                'recipient'    => $recipientEmail,
                'responded_by' => auth()->id(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send feedback response email', [
                'feedback_id' => $feedback->id,
                'recipient'   => $recipientEmail,
                'error'       => $e->getMessage(),
            ]);

            // Still return success for the DB save; surface the email error to the client.
            return response()->json([
                'success' => true,
                'message' => 'Response saved, but the notification email could not be sent. Please check server mail configuration.',
                'email_error' => $e->getMessage(),
                'data'    => $feedback->load('responder:id,name'),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Response saved and email sent to ' . $recipientEmail,
            'data'    => $feedback->load('responder:id,name'),
        ]);
    }

    /**
     * Delete feedback
     */
    public function destroy($id)
    {
        $feedback = Feedback::find($id);

        if (!$feedback) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback not found'
            ], 404);
        }

        $feedback->delete();

        return response()->json([
            'success' => true,
            'message' => 'Feedback archived successfully'
        ]);
    }

    /**
     * Get feedback statistics
     */
    public function statistics()
    {
        $stats = [
            'total' => Feedback::count(),
            'new' => Feedback::where('status', 'new')->count(),
            'read' => Feedback::where('status', 'read')->count(),
            'responded' => Feedback::where('status', 'responded')->count(),
            'average_rating' => round(Feedback::whereNotNull('rating')->avg('rating'), 1) ?: 0,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Test email sending (admin only - for debugging)
     */
    public function testEmail()
    {
        // Only allow admin to test emails
        if (!auth()->check() || auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can test emails.'
            ], 403);
        }

        try {
            $testEmail = auth()->user()->email;
            $cemeteryEmail = config('mail.from.address');
            
            Log::info('Testing email configuration', [
                'from' => config('mail.mailers.smtp.username'),
                'to' => $testEmail,
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
            ]);

            // Send a simple test email
            Mail::raw('This is a test email from Himlayan Cemetery contact form. If you received this, email sending is working correctly!', function ($message) use ($testEmail) {
                $message->to($testEmail)
                    ->subject('Test Email from Himlayan Cemetery');
            });

            Log::info('Test email sent successfully to: ' . $testEmail);

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully! Check your inbox (including spam folder)',
                'email_sent_to' => $testEmail,
                'mail_config' => [
                    'host' => config('mail.mailers.smtp.host'),
                    'port' => config('mail.mailers.smtp.port'),
                    'encryption' => config('mail.mailers.smtp.encryption'),
                    'username' => config('mail.mailers.smtp.username'),
                ]
            ]);
        } catch (\Throwable $e) {
            Log::error('Test email failed', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'mail_host' => config('mail.mailers.smtp.host'),
                'mail_port' => config('mail.mailers.smtp.port'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send test email: ' . $e->getMessage(),
                'error_details' => [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'line' => $e->getLine(),
                ]
            ], 500);
        }
    }
}
