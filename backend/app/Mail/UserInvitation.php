<?php

namespace App\Mail;

use App\Models\User;
use App\Models\BurialRecord;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $password;
    public $burialRecord;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $password, BurialRecord $burialRecord)
    {
        $this->user = $user;
        $this->password = $password;
        $this->burialRecord = $burialRecord;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Cemetery Management System - Account Invitation',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.user-invitation',
            with: [
                'userName' => $this->user->name,
                'email' => $this->user->email,
                'password' => $this->password,
                'deceasedName' => $this->burialRecord->deceased_name,
                'plotNumber' => $this->burialRecord->plot->plot_number,
                'expiresAt' => $this->user->invitation_expires_at->format('F d, Y g:i A'),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
