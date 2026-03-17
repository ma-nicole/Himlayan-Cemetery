<?php

namespace App\Mail;

use App\Models\Feedback;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FeedbackResponse extends Mailable
{
    use Queueable, SerializesModels;

    public Feedback $feedback;

    public function __construct(Feedback $feedback)
    {
        $this->feedback = $feedback;
    }

    public function envelope(): Envelope
    {
        $subject = $this->feedback->subject
            ? 'Re: ' . $this->feedback->subject
            : 'Response to your feedback – Himlayang Pilipino';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.feedback-response',
            with: ['feedback' => $this->feedback],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
