# Quick Setup Guide - Email Configuration

## Gmail Configuration (Recommended for Testing)

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Follow the prompts to enable it

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" for the app
3. Select "Other" for the device and name it "Cemetery System"
4. Click "Generate"
5. Copy the 16-character password

### Step 3: Update .env File
Open `backend/.env` and add/update these lines:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx  # The 16-char app password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="Himlayang Pilipino"

FRONTEND_URL=http://localhost:3000
```

### Step 4: Test Email Sending
```bash
cd backend
php artisan tinker

# In tinker, run:
Mail::raw('Test email from Cemetery System', function($msg) {
    $msg->to('your-test-email@example.com')->subject('Test Email');
});

# Press Ctrl+C to exit tinker

# Check your test email inbox (including spam folder)
```

## Alternative: Mailtrap (Development/Testing)

Mailtrap is perfect for testing without sending real emails.

### Step 1: Create Account
1. Go to https://mailtrap.io/
2. Sign up for free account
3. Go to "Email Testing" → "Inboxes"
4. Click on your inbox

### Step 2: Copy SMTP Settings
You'll see something like:
```
Host: smtp.mailtrap.io
Port: 2525
Username: xxxxxxxxxxxx
Password: xxxxxxxxxxxx
```

### Step 3: Update .env File
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@cemetery.com
MAIL_FROM_NAME="Himlayang Pilipino"

FRONTEND_URL=http://localhost:3000
```

### Step 4: Test
Emails will appear in Mailtrap inbox instead of real email addresses.

## Testing the Invitation System

### 1. Create a Test Burial Record
- Make sure to fill in:
  - Primary Contact First Name: John
  - Primary Contact Last Name: Doe
  - Primary Contact Email: your-test-email@example.com
  - Primary Contact Phone: +639123456789
  - Plot Number: A-123

### 2. Send Invitation
- Open the burial record details
- Scroll to "Account Invitation" section
- Click "Send Invitation"
- Should see success message

### 3. Check Email
- Gmail: Check inbox and spam folder
- Mailtrap: Check your Mailtrap inbox
- Look for email with subject "Cemetery Management System - Account Invitation"

### 4. Test Login
- Email will contain:
  - Email: your-test-email@example.com
  - Password: A-123Doe6789 (format: plotnumber + lastname + last4digits)
- Click login button in email or go to login page
- Should redirect to Change Password page

### 5. Change Password
- Enter current password: A-123Doe6789
- Enter new password: MyNewPassword123!
- Confirm password: MyNewPassword123!
- Submit
- Should be logged out

### 6. Login with New Password
- Email: your-test-email@example.com
- Password: MyNewPassword123!
- Should login successfully to dashboard

## Common Issues

### "Connection refused" error
**Problem:** Can't connect to SMTP server

**Solution:**
1. Check MAIL_HOST and MAIL_PORT are correct
2. Check firewall isn't blocking port 587 or 465
3. Try MAIL_PORT=465 with MAIL_ENCRYPTION=ssl
4. Check antivirus isn't blocking connection

### "Authentication failed" error
**Problem:** Username or password incorrect

**Solution:**
1. Verify MAIL_USERNAME is your full email address
2. For Gmail, ensure you're using App Password (not regular password)
3. Check for extra spaces in .env file
4. Try removing quotes around values in .env

### Email sent but not received
**Problem:** Email delivered but not in inbox

**Solution:**
1. Check spam/junk folder
2. Check email filters/rules
3. Wait 5-10 minutes (some servers are slow)
4. Check Laravel logs: `backend/storage/logs/laravel.log`
5. For Gmail, check "All Mail" folder

### Email has broken styling
**Problem:** Email looks plain or unstyled

**Solution:**
1. Some email clients strip CSS
2. Our template uses inline styles which work in most clients
3. Test in different email clients (Gmail, Outlook, Apple Mail)
4. The content is still readable even without perfect styling

## Restart Backend After .env Changes

After updating .env file:

```bash
# Stop the backend if running
# Then restart it

cd backend
php artisan config:clear
php artisan cache:clear
php artisan serve
```

## Production Recommendations

For production use, consider:

1. **SendGrid** (99% deliverability, free tier: 100 emails/day)
   - https://sendgrid.com/
   - Professional email delivery
   - Analytics and tracking

2. **Mailgun** (Good for high volume)
   - https://www.mailgun.com/
   - 5,000 emails/month free

3. **AWS SES** (Very cheap for high volume)
   - https://aws.amazon.com/ses/
   - $0.10 per 1,000 emails

4. **Configure queue workers** for better performance:
   ```bash
   # In .env
   QUEUE_CONNECTION=database
   
   # Run migration
   php artisan queue:table
   php artisan migrate
   
   # Start queue worker
   php artisan queue:work
   ```

---

**Need Help?** Check INVITATION_SYSTEM_DOCS.md for full documentation.
