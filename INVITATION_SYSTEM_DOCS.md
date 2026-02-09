# User Invitation System Documentation

## Overview
The invitation system automatically creates user accounts from burial record primary contact information and sends credentials via email with a 24-hour expiration period. Users must change their password on first login for security.

## Features Implemented

### Backend Components

1. **Database Migration** (`2026_02_10_000001_add_invitation_fields_to_users_table.php`)
   - Status: ✅ **COMPLETED & MIGRATED**
   - Added fields:
     - `invitation_sent_at` (timestamp, nullable)
     - `invitation_expires_at` (timestamp, nullable)
     - `invitation_token` (string 64 chars, unique, nullable)
     - `invitation_accepted` (boolean, default false)
     - `must_change_password` (boolean, default false)
     - `last_password_change` (timestamp, nullable)

2. **InvitationController** (`backend/app/Http/Controllers/Api/InvitationController.php`)
   - Status: ✅ **COMPLETE**
   - Methods:
     - `sendInvitation($burialRecordId)` - Creates user account and sends invitation email
     - `resendInvitation($burialRecordId)` - Regenerates credentials and resends email
     - `getInvitationStatus($burialRecordId)` - Returns invitation status
   - Password Format: `{plot_number}{contact_last_name}{last_4_digits_phone}`
   - Expiration: 24 hours from sending
   - Validation: Requires contact_email and contact_phone in burial record

3. **Email System**
   - `UserInvitation` Mailable class (`backend/app/Mail/UserInvitation.php`)
   - Email template (`backend/resources/views/emails/user-invitation.blade.php`)
   - Professional HTML design with:
     - Green branded header
     - Deceased name and plot number context
     - Prominently displayed credentials
     - Expiration warning
     - Security reminders
     - Login call-to-action button

4. **AuthController Updates**
   - Added `changePassword()` method
   - Updated `login()` to return `must_change_password` field
   - Updated `user()` to include `must_change_password` field
   - Password change revokes all tokens (forces re-login)

5. **API Routes** (All require `auth:sanctum` middleware)
   - `POST /api/burial-records/{id}/invitation/send` - Send invitation (admin/staff only)
   - `POST /api/burial-records/{id}/invitation/resend` - Resend invitation (admin/staff only)
   - `GET /api/burial-records/{id}/invitation/status` - Get invitation status (admin/staff only)
   - `POST /api/auth/change-password` - Change password (all authenticated users)

### Frontend Components

1. **InvitationService** (`frontend/src/services/invitationService.js`)
   - Status: ✅ **COMPLETE**
   - API wrapper for invitation endpoints

2. **BurialDetails Component** (Updated)
   - Status: ✅ **COMPLETE**
   - Features:
     - Displays invitation status with color-coded badges
     - "Send Invitation" button (when not sent and email exists)
     - "Resend Invitation" button (when expired or pending)
     - Shows expiration date for pending invitations
     - Shows acceptance date for accepted invitations
     - Error handling with inline messages

3. **BurialList Component** (Updated)
   - Status: ✅ **COMPLETE**
   - Features:
     - Added "Account" column
     - Shows invitation status badges:
       - **Active** (Green) - User accepted invitation
       - **Pending** (Yellow) - Invitation sent, awaiting acceptance
       - **Expired** (Red) - Invitation expired
       - **Not Sent** (Gray) - No invitation sent yet
       - **No Email** (Red) - Contact email missing

4. **ChangePasswordPage** (`frontend/src/pages/ChangePasswordPage.jsx`)
   - Status: ✅ **COMPLETE**
   - Features:
     - Forces password change for users with `must_change_password=true`
     - Real-time password strength indicator
     - Validation:
       - Minimum 8 characters
       - Must differ from current password
       - Confirmation must match
     - Automatically logs out after successful change (requires re-login)
     - Redirects to dashboard if password change not required
     - Security warnings and best practices

5. **LoginPage** (Updated)
   - Status: ✅ **COMPLETE**
   - Checks `must_change_password` flag after login
   - Redirects to `/change-password` if password change required
   - Otherwise redirects to dashboard

6. **App.jsx** (Updated)
   - Status: ✅ **COMPLETE**
   - Added `/change-password` protected route

## Configuration Required

### Backend (.env file)

Add the following mail configuration to your `.env` file:

```env
# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Note for Gmail:**
- Use App Password, not your regular password
- Enable 2-factor authentication first
- Generate App Password at: https://myaccount.google.com/apppasswords

**Alternative Mail Services:**
- **Mailtrap** (testing): https://mailtrap.io/
- **SendGrid**: https://sendgrid.com/
- **Mailgun**: https://www.mailgun.com/
- **AWS SES**: https://aws.amazon.com/ses/

## User Flow

### For Admin/Staff

1. Navigate to Burial Records page
2. View burial record details
3. Check invitation status in "Account Invitation" section
4. If contact email exists and no invitation sent:
   - Click "Send Invitation" button
   - System creates user account with auto-generated password
   - Email sent to contact email with credentials
   - Invitation expires in 24 hours
5. If invitation expired or needs resending:
   - Click "Resend Invitation" button
   - New password generated
   - New expiration set (24 hours from resend)
   - Email sent again

### For Invited User

1. Receives email with credentials:
   - Email address (contact email from burial record)
   - Auto-generated password (format: plotnumber + lastname + last4digits)
   - Expiration timestamp (24 hours)
2. Clicks "Login to Your Account" button in email
3. Enters provided credentials on login page
4. System detects `must_change_password=true`
5. Redirected to Change Password page
6. Must enter:
   - Current password (the one from email)
   - New password (minimum 8 characters)
   - Confirm new password
7. Password strength indicator guides to strong password
8. After successful change:
   - `must_change_password` set to false
   - `last_password_change` updated
   - All tokens revoked (forces re-login)
   - Logged out automatically
9. Logs in again with new password
10. Full access to user dashboard

## Invitation Status States

- **no_email**: Contact email not provided in burial record
- **not_sent**: Invitation has never been sent
- **pending**: Invitation sent, not yet accepted, not expired
- **expired**: Invitation sent but 24-hour expiration passed
- **accepted**: User logged in and changed password

## Password Generation Formula

```
password = plot_number + contact_last_name + last_4_digits_of_contact_phone
```

**Example:**
- Plot Number: A-123
- Contact Last Name: Cruz
- Contact Phone: +639123456789
- **Generated Password:** `A-123Cruz6789`

## Security Features

1. **Time-Limited Invitations**: 24-hour expiration prevents stale credentials
2. **Forced Password Change**: Users must create own password on first login
3. **Token Revocation**: All sessions terminated after password change
4. **Unique Tokens**: 64-character random invitation tokens
5. **Password Validation**: Minimum 8 characters with strength indicator
6. **Email Validation**: System checks for contact email before sending

## Testing the System

### 1. Create/Update Burial Record
Ensure the burial record has:
- Primary contact first name
- Primary contact last name
- Primary contact email (valid email address)
- Primary contact phone (with country code)

### 2. Send Invitation
- Open burial record details
- Check "Account Invitation" section shows "Not Sent"
- Click "Send Invitation"
- Check for success message

### 3. Check Email
- Open email client
- Look for email from system (check spam folder)
- Verify email contains:
  - Deceased name and plot number
  - Login credentials (email and password)
  - Expiration date
  - Login button

### 4. Test Login with Generated Credentials
- Click login button or navigate to login page
- Enter email and generated password
- Should redirect to Change Password page

### 5. Test Password Change
- Enter current password (generated one)
- Enter new password (8+ characters)
- Confirm new password
- Submit form
- Should be logged out

### 6. Test Login with New Password
- Navigate to login page
- Enter email and NEW password
- Should redirect to dashboard (not change password page)

### 7. Test Resend
- Go back to burial record details
- Status should show "Accepted"
- Try expired scenario by manually updating database:
  ```sql
  UPDATE users 
  SET invitation_expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY) 
  WHERE email = 'test@example.com';
  ```
- Click "Resend Invitation"
- New password generated and email sent

## Troubleshooting

### Email Not Sending

**Check:**
1. `.env` file has correct MAIL_* settings
2. MAIL_USERNAME and MAIL_PASSWORD are correct
3. MAIL_ENCRYPTION is set (tls or ssl)
4. Firewall allows SMTP connection
5. Laravel logs: `storage/logs/laravel.log`

**Test mail configuration:**
```bash
cd backend
php artisan tinker
Mail::raw('Test email', function($msg) {
    $msg->to('your-email@example.com')->subject('Test');
});
```

### Password Not Working

**Check:**
1. Password generated correctly (review InvitationController::generatePassword)
2. User copied password exactly as shown (case-sensitive)
3. No extra spaces in email/password fields
4. Check database: `SELECT email, must_change_password FROM users WHERE email = 'test@example.com';`

### "Must Change Password" Loop

**Check:**
1. ChangePasswordPage is calling correct API endpoint
2. Backend is setting `must_change_password = false` after change
3. Frontend is reading updated user data
4. Check browser localStorage for user object

### Invitation Status Not Loading

**Check:**
1. invitationService API calls are working
2. Check browser console for errors
3. Verify API routes are registered: `php artisan route:list | grep invitation`
4. Check token in Authorization header: `Bearer <token>`

## Database Schema Reference

### users table (relevant fields)
```sql
id                      BIGINT UNSIGNED PRIMARY KEY
name                    VARCHAR(255)
email                   VARCHAR(255) UNIQUE
password                VARCHAR(255)
role                    ENUM('admin', 'staff', 'user', 'visitor')
invitation_sent_at      TIMESTAMP NULL
invitation_expires_at   TIMESTAMP NULL
invitation_token        VARCHAR(64) UNIQUE NULL
invitation_accepted     BOOLEAN DEFAULT FALSE
must_change_password    BOOLEAN DEFAULT FALSE
last_password_change    TIMESTAMP NULL
```

### API Response Examples

**Send Invitation Success:**
```json
{
  "success": true,
  "message": "Invitation sent successfully to user@example.com",
  "data": {
    "user_id": 10,
    "email": "user@example.com",
    "expires_at": "2026-02-11 10:30:00"
  }
}
```

**Get Invitation Status:**
```json
{
  "success": true,
  "data": {
    "status": "pending",
    "user": {
      "id": 10,
      "email": "user@example.com",
      "invitation_sent_at": "2026-02-10 10:30:00",
      "invitation_expires_at": "2026-02-11 10:30:00",
      "invitation_accepted": false,
      "must_change_password": true
    }
  }
}
```

## Next Steps for Production

1. **Queue Email Sending**:
   ```php
   // Change in InvitationController
   Mail::to($email)->queue(new UserInvitation($user, $password, $burialRecord));
   ```
   - Prevents timeout on slow SMTP servers
   - Set QUEUE_CONNECTION=database in .env
   - Run queue worker: `php artisan queue:work`

2. **Email Template Customization**:
   - Modify `backend/resources/views/emails/user-invitation.blade.php`
   - Add organization logo
   - Customize colors to match branding

3. **Rate Limiting**:
   - Add throttle middleware to invitation routes
   - Prevent spam/abuse

4. **Audit Logging**:
   - Log invitation sends/resends
   - Track password changes
   - Monitor expired invitations

5. **Mobile Responsive Email**:
   - Already responsive
   - Test on various email clients

## File Locations

### Backend
```
backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/
│   │           ├── InvitationController.php (NEW)
│   │           └── AuthController.php (UPDATED)
│   ├── Mail/
│   │   └── UserInvitation.php (NEW)
│   └── Models/
│       └── User.php (UPDATED)
├── database/
│   └── migrations/
│       └── 2026_02_10_000001_add_invitation_fields_to_users_table.php (NEW)
├── resources/
│   └── views/
│       └── emails/
│           └── user-invitation.blade.php (NEW)
└── routes/
    └── api.php (UPDATED)
```

### Frontend
```
frontend/
└── src/
    ├── components/
    │   └── burial/
    │       ├── BurialDetails.jsx (UPDATED)
    │       └── BurialList.jsx (UPDATED)
    ├── pages/
    │   ├── ChangePasswordPage.jsx (NEW)
    │   └── LoginPage.jsx (UPDATED)
    ├── services/
    │   └── invitationService.js (NEW)
    └── App.jsx (UPDATED)
```

## Support

For issues or questions:
1. Check Laravel logs: `backend/storage/logs/laravel.log`
2. Check browser console for frontend errors
3. Verify database migrations: `php artisan migrate:status`
4. Test API endpoints with Postman/curl
5. Review this documentation

---

**System Status:** ✅ FULLY IMPLEMENTED AND OPERATIONAL

**Last Updated:** February 2026
