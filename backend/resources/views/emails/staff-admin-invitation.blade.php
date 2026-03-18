<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $roleLabel }} Account Invitation — Himlayan Cemetery</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: #1a472a;
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header .subtitle {
            margin: 8px 0 0;
            font-size: 14px;
            opacity: 0.85;
        }
        .content {
            padding: 30px;
        }
        .role-badge {
            display: inline-block;
            background: #1a472a;
            color: #ffffff;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .info-box {
            background: #f0f9f4;
            border-left: 4px solid #1a472a;
            padding: 16px 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .credentials-box {
            background: #f8f9fa;
            border-left: 4px solid #1a472a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .credential-row {
            margin: 10px 0;
        }
        .credential-label {
            font-weight: bold;
            color: #666;
            display: inline-block;
            min-width: 110px;
        }
        .credential-value {
            color: #1a472a;
            font-weight: bold;
            font-size: 15px;
            word-break: break-all;
        }
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
        }
        .btn-accept {
            display: inline-block;
            background-color: #1a472a;
            color: #ffffff !important;
            padding: 14px 34px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
        ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
        }
        hr {
            border: none;
            border-top: 1px solid #e9ecef;
            margin: 24px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Himlayan Cemetery Management System</h1>
            <p class="subtitle">Staff &amp; Administrator Account Invitation</p>
        </div>

        <div class="content">
            <h2>Hello, {{ $name }}!</h2>

            <p>
                You have been invited to join the <strong>Himlayan Cemetery Management System</strong>
                as a member of the administration team.
            </p>

            <div class="info-box">
                <p style="margin: 0;"><strong>Assigned Role:</strong>&nbsp;
                    <span class="role-badge">{{ $roleLabel }}</span>
                </p>
                <p style="margin: 10px 0 0; font-size: 14px; color: #555;">
                    @if($role === 'admin')
                        As an <strong>Administrator</strong>, you will have full access to manage users,
                        burial records, plots, payments, announcements, service requests, and system settings.
                    @else
                        As a <strong>Staff</strong> member, you will be able to manage burial records,
                        plots, payments, announcements, and service requests.
                    @endif
                </p>
            </div>

            <p><strong>To activate your account, click the button below:</strong></p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $acceptUrl }}" class="btn-accept">✓ Accept Invitation &amp; Activate Account</a>
            </div>

            <hr>

            <p style="color: #555; font-size: 14px; margin-top: 20px;">
                <strong>Your temporary login credentials</strong> (you will be required to change your
                password on first login):
            </p>

            <div class="credentials-box">
                <div class="credential-row">
                    <span class="credential-label">Email:</span>
                    <span class="credential-value">{{ $email }}</span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Password:</span>
                    <span class="credential-value">{{ $password }}</span>
                </div>
            </div>

            <div class="warning-box">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 8px 0 0;">
                    <li>This invitation link expires on <strong>{{ $expiresAt }}</strong>.</li>
                    <li>You <strong>must change your password</strong> on your very first login — access will
                        be blocked until you do.</li>
                    <li>The role assigned to your account (<strong>{{ $roleLabel }}</strong>) cannot be
                        changed through this activation link.</li>
                    <li>Keep your credentials secure and do not share them with anyone.</li>
                </ul>
            </div>

            <p style="text-align: center;">
                <a href="{{ $loginUrl }}" style="color: #1a472a; font-weight: bold;">
                    Go to Login Page
                </a>
            </p>

            <hr>

            <p style="font-size: 13px; color: #888;">
                If you did not expect this invitation or believe it was sent in error, please ignore this
                email or contact the cemetery administration immediately.
            </p>
        </div>

        <div class="footer">
            <p>This is an automated message from Himlayan Cemetery Management System.<br>
            Please do not reply to this email.</p>
            <p>&copy; {{ date('Y') }} Himlayan Cemetery. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
