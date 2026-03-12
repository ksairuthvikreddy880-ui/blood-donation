# Twilio SMS Verification Integration

## Overview

Twilio SMS verification has been integrated into the signup process. When users sign up with a phone number, they'll receive an SMS with a 6-digit verification code before their account is created.

## How It Works

### Signup Flow with SMS Verification

1. **User enters details** (Name, Phone, Email, Password)
2. **Clicks "Send Verification Code"** button
3. **SMS sent** to the provided phone number with 6-digit code
4. **User enters code** in the verification screen
5. **Code verified** via API
6. **Account created** with verified phone number

### Login with Phone Number

1. **User clicks "Phone" tab** on login page
2. **Enters phone number** (+91XXXXXXXXXX)
3. **Clicks "Send OTP"** button
4. **SMS sent** with 6-digit verification code
5. **User enters code** received via SMS
6. **Verified and logged in** to dashboard

### Login with Email

- Traditional email/password login
- Click "Email" tab on login page
- Enter email and password
- Sign in to dashboard

### Without Phone Number (Signup)

- Users can skip the phone field
- Account is created directly without SMS verification
- Phone can be added later in profile settings

## Setup Instructions

### 1. Create Twilio Account

1. Visit [Twilio Console](https://www.twilio.com/console)
2. Sign up for a free account
3. Verify your email and phone number
4. Get $15 free trial credit

### 2. Get Credentials

1. Go to **Account** → **API Keys & Tokens**
2. Copy **Account SID**
3. Copy **Auth Token**
4. Go to **Phone Numbers** → **Manage Numbers**
5. Get a Twilio phone number (format: +1XXXXXXXXXX)

### 3. Update Environment Variables

Add to `.env`:

```
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 4. Deploy to Vercel

1. Go to Vercel project settings
2. Add the three Twilio environment variables
3. Redeploy the project

## API Endpoints

### Send Verification Code

**Endpoint:** `POST /api/send-verification-code`

**Request:**
```json
{
  "phone": "+91XXXXXXXXXX"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent",
  "code": "123456"
}
```

### Verify Code

**Endpoint:** `POST /api/verify-code`

**Request:**
```json
{
  "phone": "+91XXXXXXXXXX",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified",
  "verified": true
}
```

## Features

✅ **SMS Verification** - 6-digit code sent via SMS
✅ **Optional Phone** - Users can skip phone verification
✅ **Error Handling** - Clear error messages for failed verification
✅ **Loading States** - Visual feedback during SMS sending/verification
✅ **Code Validation** - Ensures 6-digit format
✅ **Back Button** - Users can go back and re-enter phone number

## Testing

### Local Testing

1. Use your own phone number (with country code: +91 for India)
2. Click "Send Verification Code"
3. Receive SMS with 6-digit code
4. Enter code and complete signup

### Trial Account Limits

- **Free Credit:** $15
- **SMS Cost:** $0.0075 per message (USA), $0.0070 (India)
- **Verified Numbers Only:** Can only send to verified phone numbers in trial

## Security Considerations

⚠️ **Current Implementation (Development):**
- Verification codes are generated and sent via SMS
- Codes are valid for 10 minutes
- API endpoints have CORS enabled for development

⚠️ **Production Recommendations:**
1. Store verification codes in database with expiration
2. Implement rate limiting (max 3 attempts per phone)
3. Add cooldown between SMS sends (60 seconds)
4. Use HTTPS only
5. Remove code from API response (currently returned for testing)
6. Implement phone number validation
7. Add spam/abuse detection

## Troubleshooting

### "Twilio credentials not configured"
- Verify all three environment variables are set
- Check credentials are correct in Twilio console
- Restart development server after adding env vars

### "Invalid phone number"
- Include country code (+91 for India)
- Format: +91XXXXXXXXXX
- Remove spaces or dashes

### SMS not received
- Verify phone number is added to Twilio account
- Check Twilio console logs for delivery status
- Ensure you have trial credit remaining
- Check spam/junk folder

### "Invalid verification code"
- Code must be exactly 6 digits
- Code is valid for 10 minutes
- Check for typos when entering code

## Files Modified

- `src/pages/Auth.tsx` - Added SMS verification UI and logic
- `api/send-verification-code.js` - Sends SMS with verification code
- `api/verify-code.js` - Verifies the code entered by user

## Next Steps

1. Set up Twilio account and get credentials
2. Add environment variables to `.env`
3. Test signup with phone verification
4. Deploy to Vercel with environment variables
5. Monitor SMS delivery in Twilio console
6. Implement production security measures

