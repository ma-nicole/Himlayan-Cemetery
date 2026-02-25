<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Invitation</title>
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
        .content {
            padding: 30px;
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
            width: 100px;
        }
        .credential-value {
            color: #1a472a;
            font-weight: bold;
            font-size: 16px;
        }
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box {
            background: #d1ecf1;
            border-left: 4px solid #0c5460;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: #1a472a;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Cemetery Management System</h1>
            <p style="margin: 10px 0 0 0;">Account Invitation</p>
        </div>

        <div class="content">
            <h2>Hello, {{ $name }}!</h2>

            <p>You've been invited to access the Cemetery Management System as a family representative for:</p>

            <div class="info-box">
                <strong>Deceased:</strong> {{ $deceasedName }}<br>
                <strong>Plot Number:</strong> {{ $plotNumber }}
            </div>

            <p><strong>Click the button below to accept and activate your account:</strong></p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $acceptUrl }}" style="display: inline-block; background-color: #1a472a; color: white; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                    ✓ Accept Invitation
                </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 20px;"><strong>Your account credentials:</strong></p>

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
                <strong>⚠️ Important:</strong><br>
                • This invitation expires on <strong>{{ $expiresAt }}</strong><br>
                • You will be required to change your password on your first login<br>
                • Keep your credentials secure and do not share them
            </div>

            <center>
                <a href="{{ config('app.frontend_url') }}/login" class="btn">Login to Your Account</a>
            </center>

            <h3>What you can do with your account:</h3>
            <ul>
                <li>View and manage burial record information</li>
                <li>Update contact details</li>
                <li>Request services (maintenance, floral arrangements)</li>
                <li>Access QR code information</li>
                <li>Receive updates and announcements</li>
            </ul>

            <p>If you did not expect this invitation or have any questions, please contact the cemetery administration.</p>
        </div>

        <div class="footer">
            <p>This is an automated message from Himalayan Cemetery Management System.<br>
            Please do not reply to this email.</p>
            <p>&copy; {{ date('Y') }} Himalayan Cemetery. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
