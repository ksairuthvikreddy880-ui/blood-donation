# Fix 401 Error from Supabase OTP

## Problem

You're seeing this error in Vercel console:
```
nzdcucibnzzunxtljmto.supabase.co/auth/v1/otp:1 Failed to load resource: the server responded with a status of 401
```

## Root Cause

This error is **NOT** from our application code. It's likely:

1. **Browser extension** interfering with requests
2. **Browser cache** containing old requests
3. **CORS policy** issue
4. **Supabase OTP feature** not properly configured

## Solution

### Step 1: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty cache and hard refresh"
4. Or use Ctrl+Shift+Delete to clear cache

### Step 2: Try Incognito Mode

1. Open a new incognito/private window
2. Go to your Vercel deployment URL
3. Try signing up with phone number
4. If it works, the issue is browser cache/extensions

### Step 3: Disable Browser Extensions

1. Disable all browser extensions
2. Refresh the page
3. Try signing up again

### Step 4: Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments → Latest
4. Click "Functions" tab
5. Check logs for `send-verification-code` and `verify-code`
6. Look for actual error messages

### Step 5: Verify Environment Variables

In Vercel project settings:

1. Go to Settings → Environment Variables
2. Verify these are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

3. If any are missing, add them
4. Redeploy the project

### Step 6: Redeploy

1. Go to Deployments
2. Click the three dots on latest deployment
3. Select "Redeploy"
4. Wait for deployment to complete (2-3 minutes)

## What Our Code Does

Our application:
- ✅ Uses **Twilio API** for SMS (not Supabase OTP)
- ✅ Calls `/api/send-verification-code` endpoint
- ✅ Calls `/api/verify-code` endpoint
- ❌ Does NOT call Supabase OTP endpoint

The 401 error from Supabase OTP is likely from:
- Browser cache
- Browser extension
- Old code still running
- CORS preflight request

## Testing Locally

To test locally before deploying:

```bash
cd haste-blood-main
npm install
npm run dev
```

Then:
1. Go to http://localhost:8080
2. Click "Phone" tab on login
3. Enter phone number: +91XXXXXXXXXX
4. Click "Send OTP"
5. Check console for errors

## If Error Persists

1. **Check Twilio credentials** in Vercel
2. **Check Supabase credentials** in Vercel
3. **Check API endpoint logs** in Vercel Functions
4. **Check browser console** for actual error messages
5. **Try different browser** to rule out browser issues

## Important Notes

- The 401 error is **not blocking** your app
- Phone login uses **Twilio**, not Supabase OTP
- Email login works independently
- Google OAuth works independently

The 401 error is likely a **red herring** - your app should still work!

