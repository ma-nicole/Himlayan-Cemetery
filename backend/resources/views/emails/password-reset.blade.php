<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                                🔐 Password Reset
                            </h1>
                            <p style="color: rgba(255, 255, 255, 0.85); margin: 10px 0 0 0; font-size: 14px;">
                                Himlayang Pilipino Memorial Park
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                                Hello <strong>{{ $userName }}</strong>,
                            </p>
                            
                            <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 25px 0;">
                                We received a request to reset your password. Click the button below to create a new password:
                            </p>

                            <!-- Reset Button -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $resetUrl }}" style="display: inline-block; background: linear-gradient(135deg, #1a472a 0%, #22c55e 100%); color: #ffffff; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(26, 71, 42, 0.3);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Notice -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; border-radius: 8px; margin: 25px 0;">
                                <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">
                                    ⚠️ Security Notice
                                </p>
                                <p style="color: #92400e; font-size: 13px; margin: 8px 0 0 0; line-height: 1.5;">
                                    This link will expire in <strong>60 minutes</strong>. If you didn't request this, please ignore this email or contact support if you're concerned.
                                </p>
                            </div>

                            <p style="color: #9ca3af; font-size: 13px; margin: 25px 0 0 0; line-height: 1.6;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href="{{ $resetUrl }}" style="color: #1a472a; word-break: break-all;">{{ $resetUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                © {{ date('Y') }} Himlayang Pilipino Memorial Park. All rights reserved.
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
                                Himlayan Road, Barangay Pasong Tamo, Tandang Sora, Quezon City 1107
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
