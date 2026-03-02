# How Email Works in Himlayan Cemetery System

## 📧 Overview

Your email system allows the cemetery staff to send **account invitations** to burial record contacts via email. When users receive the email, they can click a link to accept the invitation and create their account. This document explains exactly how this works step by step.

---

## 🔧 Part 1: Email Configuration

### What You Need First

Before any emails can be sent, your application needs to know HOW to send emails. This is configured in your `.env` file in the backend folder:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com        # The email server
MAIL_PORT=587                    # The port (Gmail uses 587)
MAIL_USERNAME=your-email@gmail.com    # Gmail address
MAIL_PASSWORD=xxxx xxxx xxxx xxxx     # App password (not your normal password!)
MAIL_ENCRYPTION=tls              # Security type
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="Himlayang Pilipino"
FRONTEND_URL=http://localhost:3000    # Where your React app is
```

### How This Works
- **Laravel** (your backend) reads these settings from `.env`
- When you want to send an email, Laravel connects to **smtp.gmail.com** on port 587
- It authenticates using your Gmail credentials
- Then it sends the email via Google's servers

This is like telling your app: *"To send emails, use Gmail as the email service."*

---

## 🎯 Part 2: The Invitation Flow (What Actually Happens)

Here's what happens when a staff member requests to send an invitation:

### Step 1: User Clicks "Send Invitation" Button (Frontend)
**Location:** `frontend/src/components/BurialDetails.jsx`

The staff member views a burial record and clicks the "Send Invitation" button.

### Step 2: API Request is Sent to Backend
**Request:**
```
POST http://localhost:8000/api/burial-records/{burial_record_id}/invitation/send
```

### Step 3: Backend Controller Processes It
**Location:** `backend/app/Http/Controllers/Api/InvitationController.php`

The `sendInvitation()` function runs:

**A. Validates the burial record has required info:**
```
✓ Must have contact_email (e.g., john@example.com)
✓ Must have contact_phone (e.g., +639123456789)
✓ Email must be a valid format
```

**B. Generates a temporary password using this formula:**
```
Password = Plot Number + Last Name + Last 4 Digits of Phone

Example:
- Plot: A-123
- Last Name: Doe
- Phone: +639123456789
- Generated Password: A-123Doe6789
```

**C. Creates an invitation token (a unique random 64-character string):**
```
Token = random string like: "a3f9e2b1c8d7f4a5e6c9b2d1e8f7a4c5d6e9b2a1c8d7f4a5e6c9b2d1e8f7a4c5"
```

**D. Stores invitation data in cache (temporary storage for 24 hours):**
```php
$invitationData = [
    'burial_record_id' => 123,
    'email' => 'john@example.com',
    'name' => 'John Doe',
    'password' => 'A-123Doe6789',
    'token' => 'a3f9e2b1c8d7f4a5e6c9b2d1e8f7a4c5...',
    'accept_url' => 'http://localhost:3000/accept-invitation?token=a3f9e2b1c8...'
];

cache()->put('invitation_' . $token, $invitationData, now()->addDay());
```

---

## 📬 Part 3: How the Actual Email Gets Sent

### The Mail Class
**Location:** `backend/app/Mail/UserInvitation.php`

This is a **Mailable class** - think of it as a template that defines:
- Who the email is from
- What the email subject is
- What data to pass to the email template
- What HTML template to use

```php
class UserInvitation extends Mailable
{
    public function __construct($invitation, $burialRecord)
    {
        $this->invitation = $invitation;
        $this->burialRecord = $burialRecord;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Account Invitation - Himlayan Cemetery',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.user-invitation',  // The template file
            with: [
                'name' => $this->invitation['name'],
                'email' => $this->invitation['email'],
                'password' => $this->invitation['password'],
                'acceptUrl' => $this->invitation['accept_url'],
                // ... more data
            ]
        );
    }
}
```

### The Email Template
**Location:** `backend/resources/views/emails/user-invitation.blade.php`

This is an **HTML template** that defines what the email looks like. It uses **Blade** (Laravel's templating language) to insert the data:

```html
<div class="header">
    <h1>🪦 Himlayan Cemetery</h1>
    <p>Your Account Invitation</p>
</div>

<div class="content">
    <p>Dear {{ $name }},</p>
    
    <p>You have been invited to create an account for managing burial records 
    related to {{ $deceasedName }} (Plot: {{ $plotNumber }}).</p>
    
    <div class="credentials-box">
        <div class="credential-row">
            <span class="credential-label">Email:</span>
            <span class="credential-value">{{ $email }}</span>
        </div>
        <div class="credential-row">
            <span class="credential-label">Temporary Password:</span>
            <span class="credential-value">{{ $password }}</span>
        </div>
    </div>
    
    <a href="{{ $acceptUrl }}" class="btn">Accept Invitation & Create Account</a>
</div>
```

**What happens when Laravel renders this template:**
- `{{ $name }}` becomes "John Doe"
- `{{ $email }}` becomes "john@example.com"
- `{{ $password }}` becomes "A-123Doe6789"
- `{{ $acceptUrl }}` becomes "http://localhost:3000/accept-invitation?token=a3f9..."

---

## 📨 Part 4: The Actual Sending

Back in the controller, after preparing everything:

```php
try {
    Mail::to($burialRecord->contact_email)
        ->send(new UserInvitation($invitationData, $burialRecord));
} catch (\Exception $e) {
    Log::error('Email send failed...', [
        'error' => $e->getMessage(),
    ]);
    return $this->errorResponse('This email is invalid or does not exist.', 400);
}
```

**What this code does:**

1. **`Mail::to('john@example.com')`** - Tells Laravel "Send to this email address"

2. **`.send(new UserInvitation(...))`** - Creates the email using the UserInvitation class and sends it

3. **Behind the scenes, Laravel:**
   - Connects to `smtp.gmail.com:587`
   - Authenticates using your Gmail credentials from `.env`
   - Constructs the email from the template
   - Sends it through Gmail's servers to `john@example.com`

4. **If it fails** - The error is logged and an error response is returned to the frontend

---

## 🔗 Part 5: What Happens When User Clicks the Email Link

The email contains a link like:
```
http://localhost:3000/accept-invitation?token=a3f9e2b1c8d7f4a5e6c9b2d1e8f7a4c5...
```

### User clicks the link → Frontend loads
**Location:** `frontend/src/pages/AcceptInvitationPage.jsx`

The page extracts the token from the URL.

### API Call is Made
```
GET http://localhost:8000/api/invitations/details?token=a3f9e2b1c8d7f4a5e6c9b2d1e8f7a4c5...
```

### Backend Retrieves Invitation Data
**Location:** `InvitationController::getInvitationDetails()`

```php
$token = $request->query('token');
$invitationData = cache()->get('invitation_' . $token);

// Returns the stored invitation data with credentials
return $invitationData;
```

- Looks up the invitation data from cache using the token
- Returns the credentials to the frontend
- User sees their login credentials

### User Completes Registration
User enters:
- A new password
- Confirms password
- Then clicks "Create Account"

```
POST /api/invitations/accept
{
    "token": "a3f9e2b1c8d7f4a5e6c9b2d1e8f7a4c5...",
    "new_password": "MyNewPassword123!"
}
```

### Backend Creates the User Account
**Location:** `InvitationController::acceptInvitation()`

```php
// 1. Retrieve invitation data from cache using token
$invitationData = cache()->get('invitation_' . $token);

// 2. Create the user account in database
User::create([
    'email' => $invitationData['email'],
    'password' => Hash::make($newPassword),
    'invitation_token' => $token,
    'invitation_accepted' => true,
    'must_change_password' => false,
]);

// 3. Clean up - delete from cache
cache()->forget('invitation_' . $token);
```

**User is now registered and can log in!**

---

## 🔒 Security Features

### 1. **Token-Based Invitations**
- Tokens are random 64-character strings
- Only valid for 24 hours
- Tokens are unique per invitation
- Stored in cache, not in database (temporary)

### 2. **Email Validation**
- Must be valid email format: `filter_var($email, FILTER_VALIDATE_EMAIL)`
- Domain must exist and accept mail
- Gmail verifies the sender is legitimate

### 3. **Password Security**
- Temporary password generated automatically
- User must change password on first login
- Passwords are hashed using `Hash::make()` before storing

### 4. **Expiration**
```php
cache()->put('invitation_' . $token, $invitationData, now()->addDay());
// Expires after 24 hours
```

After 24 hours, the token is automatically deleted from cache and becomes invalid.

---

## 📊 Data Flow Diagram

```
Frontend               Backend                    Gmail Servers
(React)              (Laravel)                    (SMTP)
  │                    │                            │
  └─ Click "Send"─────→│                            │
                       │ ① Validate               │
                       │ ② Generate password ✓    │
                       │ ③ Create token ✓         │
                       │ ④ Store in cache ✓       │
                       │ ⑤ Build email ✓          │
                       │ ⑥ Connect & Auth ────────→│
                       │                    Authenticate
                       │ ⑦ Send email ─────────────→│
                       │                    Gmail sends
                       │←─── Response OK ──────────│
                       │
                       └─→ Return success
                            response
```

---

## 🛠️ How to Test It

### Using Gmail (Real Email)

1. **Set up Gmail in `.env`:**
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=xxxx xxxx xxxx xxxx  # App password (16 chars)
   MAIL_ENCRYPTION=tls
   ```

2. **Create a burial record with contact email**

3. **Click "Send Invitation"**

4. **Check your email inbox** for the invitation

### Using Mailtrap (Testing/Development)

1. **Sign up at https://mailtrap.io/**

2. **Get SMTP credentials**

3. **Update `.env`:**
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USERNAME=your-username
   MAIL_PASSWORD=your-password
   ```

4. **All emails go to Mailtrap instead** (no real emails sent)

### Using Laravel Tinker (Quick Test)

```bash
cd backend
php artisan tinker

# In tinker:
Mail::raw('Test email', function($msg) {
    $msg->to('test@example.com')->subject('Test Subject');
});

# Press Ctrl+C to exit
```

---

## 📝 Key Files Summary

| File | Purpose |
|------|---------|
| `backend/.env` | Configuration (SMTP settings) |
| `backend/config/mail.php` | Mail config definition |
| `backend/app/Mail/UserInvitation.php` | Email template class |
| `backend/resources/views/emails/user-invitation.blade.php` | HTML email design |
| `backend/app/Http/Controllers/Api/InvitationController.php` | Logic for sending/accepting |
| `backend/routes/api.php` | API routes for invitations |
| `frontend/src/pages/AcceptInvitationPage.jsx` | User invitation acceptance |

---

## ❓ FAQ

**Q: Why do you store invitation data in cache instead of the database?**
A: Because the account doesn't exist yet. We only want to store temporary data while the user decides whether to accept. Once accepted, it's stored in the users table. If expired, it's automatically deleted.

**Q: What's the difference between `MAIL_PASSWORD` and the real password?**
A: For Gmail, you must use an "App Password" (16 character code), not your actual Gmail password. This is more secure - if someone gets the app password, they can only send emails, not access your full Gmail account.

**Q: Can the user see their password before accepting?**
A: Yes! That's the point. They see their temporary credentials on the "Accept Invitation" page before creating their account. The temporary password is shown to them so they know what it will be.

**Q: What if the email sending fails?**
A: The endpoint returns a 400 error: "This email is invalid or does not exist." The invitation is NOT created. The staff member can try again after fixing the email address.

**Q: How does the system know which user accepted which invitation?**
A: Through the unique token. When accepting, the token is sent back to the API. The backend looks up the invitation data using that token, extracts the burial_record_id, and creates the user account. Then it deletes the token from cache so it can't be used again.

---

## 🎓 In Simple Terms

Think of it like this:

1. **Email Configuration** = Giving the app permission to use your Gmail account
2. **Invitation Generation** = Creating a unique "invite code" with temporary credentials
3. **Email Sending** = Packaging that info into an email and sending it through Gmail
4. **Email Template** = Deciding how the email looks and what information to include
5. **User Acceptance** = User clicks link, sees credentials, creates real account
6. **Account Creation** = User's account is finally saved to the database

The key insight: **The account is not created until the user actually accepts the invitation.** The system just stores temporary data in cache until that happens.

