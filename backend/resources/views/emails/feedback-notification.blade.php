<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
        .email-container { background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
        .timestamp { background-color: rgba(255,255,255,0.15); display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-top: 12px; }
        .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 10px; }
        .priority-high { background-color: #fee2e2; color: #dc2626; }
        .priority-medium { background-color: #fef3c7; color: #d97706; }
        .priority-low { background-color: #d1fae5; color: #059669; }
        .content { padding: 25px; }
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 15px; font-weight: 600; }
        .contact-card { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 10px; padding: 20px; margin-bottom: 20px; }
        .contact-name { font-size: 20px; font-weight: 600; color: #1a472a; margin-bottom: 5px; }
        .contact-info { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px; }
        .contact-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #555; }
        .contact-item a { color: #1a472a; text-decoration: none; }
        .contact-item a:hover { text-decoration: underline; }
        .icon { width: 18px; height: 18px; display: inline-block; }
        .subject-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 15px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
        .subject-label { font-size: 11px; text-transform: uppercase; color: #856404; font-weight: 600; }
        .subject-text { font-size: 16px; color: #333; margin-top: 3px; }
        .rating-container { margin-bottom: 20px; }
        .stars { font-size: 24px; letter-spacing: 2px; }
        .star-filled { color: #fbbf24; }
        .star-empty { color: #d1d5db; }
        .rating-text { font-size: 13px; color: #666; margin-top: 5px; }
        .message-section { margin-bottom: 20px; }
        .message-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-top: 10px; font-size: 15px; line-height: 1.8; }
        .actions { background-color: #f8f9fa; padding: 20px 25px; border-top: 1px solid #e9ecef; }
        .action-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; text-align: center; }
        .btn-primary { background-color: #1a472a; color: white; }
        .btn-secondary { background-color: white; color: #1a472a; border: 2px solid #1a472a; }
        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; background-color: #f8f9fa; }
        .footer p { margin: 5px 0; }
        .divider { height: 1px; background: linear-gradient(to right, transparent, #ddd, transparent); margin: 20px 0; }
        .stats-row { display: table; width: 100%; text-align: center; padding: 20px 0; background-color: #fafafa; border-radius: 8px; margin-bottom: 20px; border-collapse: collapse; }
        .stat-item { display: table-cell; padding: 10px 20px; border-right: 1px solid #e9ecef; }
        .stat-item:last-child { border-right: none; }
        .stat-value { font-size: 18px; font-weight: 700; color: #1a472a; }
        .stat-label { font-size: 11px; color: #888; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>{{ !$feedback->rating ? '💌 New Member Contact Form' : '📬 New Feedback Submission' }}</h1>
            <p>Himlayang Pilipino Cemetery Management System</p>
            <div class="timestamp">📅 {{ now()->timezone('Asia/Manila')->format('F j, Y \a\t g:i A') }}</div>
            @if($feedback->rating)
                @if($feedback->rating <= 2)
                    <div class="priority-badge priority-high">⚠️ Needs Attention</div>
                @elseif($feedback->rating == 3)
                    <div class="priority-badge priority-medium">📋 Review Required</div>
                @else
                    <div class="priority-badge priority-low">✅ Positive Feedback</div>
                @endif
            @endif
        </div>
        
        <div class="content">
            <!-- Contact Information Card -->
            <div class="section-title">👤 Contact Information</div>
            <div class="contact-card">
                <div class="contact-name">{{ $feedback->name }}</div>
                <div class="contact-info">
                    <div class="contact-item">
                        ✉️ <a href="mailto:{{ $feedback->email }}">{{ $feedback->email }}</a>
                    </div>
                    @if($feedback->phone)
                    <div class="contact-item">
                        📞 <a href="tel:{{ $feedback->phone_country_code }}{{ $feedback->phone }}">{{ $feedback->phone_country_code }} {{ $feedback->phone }}</a>
                    </div>
                    @endif
                </div>
            </div>

            <!-- Subject (if provided) -->
            @if($feedback->subject)
            <div class="subject-box">
                <div class="subject-label">📌 Subject</div>
                <div class="subject-text">{{ $feedback->subject }}</div>
            </div>
            @endif

            <!-- Rating Display -->
            @if($feedback->rating)
            <div class="section-title">⭐ Customer Rating</div>
            <div class="rating-container">
                <div class="stars">
                    @for($i = 1; $i <= 5; $i++)
                        @if($i <= $feedback->rating)
                            <span class="star-filled">★</span>
                        @else
                            <span class="star-empty">★</span>
                        @endif
                    @endfor
                </div>
                <div class="rating-text">
                    @if($feedback->rating == 5)
                        Excellent! The customer is very satisfied.
                    @elseif($feedback->rating == 4)
                        Good experience. Minor improvements may help.
                    @elseif($feedback->rating == 3)
                        Average. Consider following up for more details.
                    @elseif($feedback->rating == 2)
                        Below expectations. Prompt response recommended.
                    @else
                        Poor experience. Immediate attention required.
                    @endif
                </div>
            </div>
            @endif

            <!-- Quick Stats -->
            <div class="stats-row">
                @if($feedback->rating)
                <div class="stat-item">
                    <div class="stat-value">{{ $feedback->rating }}/5</div>
                    <div class="stat-label">Rating</div>
                </div>
                @endif
                <div class="stat-item">
                    <div class="stat-value">{{ str_word_count($feedback->message) }}</div>
                    <div class="stat-label">Words</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{{ ucfirst($feedback->status ?? 'New') }}</div>
                    <div class="stat-label">Status</div>
                </div>
            </div>

            <!-- Message Content -->
            <div class="section-title">{{ !$feedback->rating ? '📝 Member Inquiry' : '💬 Message Content' }}</div>
            <div class="message-section">
                <div class="message-box">
                    {!! nl2br(e($feedback->message)) !!}
                </div>
            </div>

            <div class="divider"></div>

            <!-- Suggested Response Tips -->
            <div class="section-title">💡 Response Tips</div>
            <ul style="color: #666; font-size: 13px; padding-left: 20px;">
                @if(!$feedback->rating)
                    {{-- Contact Form Tips --}}
                    <li>Thank the member for reaching out</li>
                    <li>Address their inquiry or concern directly</li>
                    <li>Provide clear information about the {{ $feedback->subject ?? 'topic' }}</li>
                    <li>Respond within 24-48 hours</li>
                @else
                    {{-- Feedback Tips --}}
                    @if($feedback->rating <= 2)
                        <li>Acknowledge their concerns and apologize for any inconvenience</li>
                        <li>Offer a specific solution or next steps</li>
                        <li>Follow up within 24 hours</li>
                    @elseif($feedback->rating >= 4)
                        <li>Thank them for their positive feedback</li>
                        <li>Ask if they'd be willing to share their experience online</li>
                        <li>Invite them to contact you for any future needs</li>
                    @else
                        <li>Thank them for reaching out</li>
                        <li>Address their inquiry or concerns directly</li>
                        <li>Provide helpful information or next steps</li>
                    @endif
                @endif
            </ul>
        </div>

        <!-- Action Buttons -->
        <div class="actions">
            <div class="action-buttons">
                <a href="mailto:{{ $feedback->email }}?subject=Re: {{ $feedback->subject ?? 'Your message to Himlayang Pilipino' }}" class="btn btn-primary">
                    ✉️ Reply via Email
                </a>
                @if($feedback->phone)
                <a href="tel:{{ $feedback->phone_country_code }}{{ $feedback->phone }}" class="btn btn-secondary">
                    📞 Call Customer
                </a>
                @endif
            </div>
        </div>

        <div class="footer">
            <p><strong>Himlayang Pilipino Cemetery Management System</strong></p>
            <p>This is an automated notification. Please respond to the customer directly.</p>
            <p style="margin-top: 10px; color: #aaa;">
                Feedback ID: #{{ $feedback->id ?? 'N/A' }} | Received: {{ now()->timezone('Asia/Manila')->format('M j, Y g:i A') }}
            </p>
        </div>
    </div>
</body>
</html>
