<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffAdminInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public array $invitation;

    public function __construct(array $invitation)
    {
        $this->invitation = $invitation;
    }

    public function envelope(): Envelope
    {
        $roleLabel = ucfirst($this->invitation['role'] ?? 'Staff');
        return new Envelope(
            subject: "{$roleLabel} Account Invitation — Himlayan Cemetery",
        );
    }

    public function content(): Content
    {
        $frontendUrl = rtrim(
            preg_replace('#^http://#', 'https://', (string) config('app.frontend_url', 'https://himlayangpilipino.com')),
            '/'
        );

        return new Content(
            view: 'emails.staff-admin-invitation',
            with: [
                'name'       => $this->invitation['name'],
                'email'      => $this->invitation['email'],
                'password'   => $this->invitation['password'],
                'role'       => $this->invitation['role'],
                'roleLabel'  => ucfirst($this->invitation['role'] ?? 'Staff'),
                'acceptUrl'  => $this->invitation['accept_url'],
                'loginUrl'   => $frontendUrl . '/login',
                'expiresAt'  => now()->addDay()->format('F d, Y g:i A'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
