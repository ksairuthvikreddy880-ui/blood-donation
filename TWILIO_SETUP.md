# Twilio SMS Verification Setup

This guide will help you set up Twilio for phone number verification during signup.

## Step 1: Create Twilio Account

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Sign up for a free account
3. Verify your email and phone number
4. You'll get $15 free trial credit

## Step 2: Get Your Credentials

1. Go to **Account** → **API Keys & Tokens**
2. Copy your **Account SID**
3. Copy your **Auth Token**
4. Go to **Phone Numbers** → **Manage Numbers**
5. Get a phone number (or use your trial number)
6. Copy your **Twilio Phone Number** (format: +1XXXXXXXXXX)

## Step 3: Add to Environment Variables

Update your `.env` file:

```
VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

## Step 4: Add to Vercel

1. Go to your Vercel project settings
2. Go to **Environment Variables**
3. Add the three Twilio variables
4. Redeploy your project

## Step 5: Install Twilio Package

```bash
npm install twilio
```

## How It Works

1. User enters phone number during signup
2. App sends verification code via SMS using Twilio
3. User enters the code they received
4. Code is verified
5. Account is created with verified phone number

## Testing

**Local Testing:**
- Use your own phone number
- You'll receive SMS with verification code
- Enter the code to complete signup

**Trial Account Limitations:**
- Can only send SMS to verified numbers
- Limited to $15 free credit
- After trial, you'll need to add a payment method

## Pricing

- **Outbound SMS**: $0.0075 per message (USA)
- **Outbound SMS**: $0.0070 per message (India)
- **Free trial**: $15 credit

## Troubleshooting

**"Invalid phone number" error:**
- Make sure phone number includes country code (+91 for India)
- Format: +91XXXXXXXXXX

**"Twilio credentials not configured" error:**
- Check that all three environment variables are set
- Verify credentials are correct in Twilio console

**SMS not received:**
- Check that phone number is verified in Twilio console
- Verify you have enough trial credit
- Check Twilio logs for delivery status

## Security Notes

- Never commit `.env` file to git
- Use `.env.example` to document required variables
- In production, store verification codes in a database with expiration
- Implement rate limiting to prevent abuse
- Use HTTPS only for production

## Next Steps

1. Set up Twilio account
2. Add credentials to `.env`
3. Test signup with phone verification
4. Deploy to Vercel with environment variables
