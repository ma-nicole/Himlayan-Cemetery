<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public $invitation;
    public $burialRecord;

    /**
     * Create a new message instance.
     */
    public function __construct($invitation, $burialRecord)
    {
        $this->invitation = $invitation;
        $this->burialRecord = $burialRecord;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Account Invitation - Himlayan Cemetery',
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
                'name' => $this->invitation['name'],
                'email' => $this->invitation['email'],
                'password' => $this->invitation['password'],
                'acceptUrl' => $this->invitation['accept_url'],
                'deceasedName' => $this->burialRecord->deceased_first_name . ' ' . $this->burialRecord->deceased_last_name,
                'plotNumber' => $this->burialRecord->plot->plot_number,
                'expiresAt' => now()->addDay()->format('F d, Y g:i A'),
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
