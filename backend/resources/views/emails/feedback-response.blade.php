<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Response to Your Feedback</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                                💬 Response to Your Feedback
                            </h1>
                            <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0 0; font-size: 14px;">
                                Himlayang Pilipino Memorial Park
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                                Hello <strong>{{ $feedback->name }}</strong>,
                            </p>

                            <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 25px 0;">
                                Thank you for reaching out to us. Our team has reviewed your message and would like to respond:
                            </p>

                            <!-- Original message recap -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px;">
                                        <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 600;">
                                            Your original message
                                        </p>
                                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">{{ $feedback->message }}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Admin response -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #1a472a; border-radius: 0 10px 10px 0; padding: 20px 22px;">
                                        <p style="color: #14532d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; font-weight: 700;">
                                            ✉️ Our Response
                                        </p>
                                        <p style="color: #1f2937; font-size: 15px; line-height: 1.75; margin: 0; white-space: pre-wrap;">{{ $feedback->admin_response }}</p>
                                        <p style="color: #6b7280; font-size: 12px; margin: 14px 0 0 0;">
                                            Responded by the Himlayan Team · {{ $feedback->responded_at ? $feedback->responded_at->timezone('Asia/Manila')->format('F j, Y \a\t g:i A') : now()->timezone('Asia/Manila')->format('F j, Y \a\t g:i A') }}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin: 0 0 20px 0;">
                                If you have any further questions or concerns, feel free to reply to this email or visit our office.
                            </p>

                            <!-- Contact info box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                                        <p style="color: #92400e; font-size: 13px; margin: 0; font-weight: 600;">📍 Visit Us</p>
                                        <p style="color: #92400e; font-size: 13px; margin: 6px 0 0 0; line-height: 1.5;">
                                            Himlayang Pilipino Memorial Park<br>
                                            Himlayan Road, Barangay Pasong Tamo<br>
                                            Tandang Sora, Quezon City 1107
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                © {{ date('Y') }} Himlayang Pilipino Memorial Park. All rights reserved.
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                                This email was sent in response to feedback submitted through our system.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
