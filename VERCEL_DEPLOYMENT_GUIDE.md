# Vercel Deployment Guide

## Overview

This guide helps you deploy the Blood Donation Platform to Vercel with proper Twilio SMS integration.

## Prerequisites

1. Vercel account (https://vercel.com)
2. GitHub repository with the code
3. Twilio account with credentials
4. Supabase project with credentials

## Step 1: Prepare Environment Variables

Make sure you have all required environment variables:

```
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_URL=your_supabase_url

TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Click "Import"
5. In "Environment Variables" section, add:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
6. Click "Deploy"

### Option B: Using Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts and add environment variables when asked.

## Step 3: Configure Environment Variables in Vercel

1. Go to your Vercel project settings
2. Click "Environment Variables"
3. Add each variable:
   - Name: `VITE_SUPABASE_PROJECT_ID`, Value: `your_project_id`
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`, Value: `your_publishable_key`
   - Name: `VITE_SUPABASE_URL`, Value: `your_supabase_url`
   - Name: `TWILIO_ACCOUNT_SID`, Value: `your_account_sid`
   - Name: `TWILIO_AUTH_TOKEN`, Value: `your_auth_token`
   - Name: `TWILIO_PHONE_NUMBER`, Value: `your_twilio_phone_number`

4. Make sure each variable is available in:
   - Production
   - Preview
   - Development

5. Click "Save"

## Step 4: Redeploy

After adding environment variables:

1. Go to "Deployments"
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Confirm

## Troubleshooting

### 401 Error from Supabase OTP

**Problem:** `nzdcucibnzzunxtljmto.supabase.co/auth/v1/otp:1 Failed to load resource: 401`

**Solution:** This error is not from our code. It might be:
1. A browser extension interfering with requests
2. Supabase OTP feature not enabled
3. CORS issue

**Fix:**
- Clear browser cache and cookies
- Try in incognito/private mode
- Check browser console for actual errors
- Verify Supabase credentials are correct

### API Endpoints Not Found

**Problem:** `404 Not Found` when calling `/api/send-verification-code`

**Solution:**
1. Verify `api/` folder exists in root
2. Check `vercel.json` configuration
3. Ensure API files have `.js` extension
4. Redeploy after changes

### Twilio Credentials Not Configured

**Problem:** `Error: Twilio credentials not configured`

**Solution:**
1. Verify all three Twilio variables are set in Vercel
2. Check variable names are exactly:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
3. Redeploy after adding variables
4. Wait 2-3 minutes for deployment to complete

### SMS Not Sending

**Problem:** SMS verification code not received

**Solution:**
1. Check Twilio console for delivery status
2. Verify phone number format: `+91XXXXXXXXXX`
3. Ensure Twilio account has credit
4. Check Twilio logs for error messages
5. Verify phone number is verified in Twilio (trial accounts)

## Verifying Deployment

1. Go to your Vercel deployment URL
2. Try signing up with phone number
3. Check browser console for errors
4. Check Vercel function logs:
   - Go to project → Deployments → Latest → Functions
   - Click on `api/send-verification-code`
   - View logs

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Twilio credentials verified
- [ ] Supabase credentials verified
- [ ] API endpoints responding correctly
- [ ] SMS sending successfully
- [ ] Email login working
- [ ] Google OAuth working
- [ ] Database migrations applied
- [ ] CORS properly configured

## Monitoring

### Vercel Analytics

1. Go to project → Analytics
2. Monitor:
   - Function execution time
   - Error rates
   - Request count

### Twilio Logs

1. Go to Twilio Console
2. Check Message Logs for delivery status
3. Monitor account balance

### Supabase Logs

1. Go to Supabase project
2. Check Auth logs for login attempts
3. Monitor database queries

## Common Issues

| Issue | Solution |
|-------|----------|
| 401 Supabase error | Clear cache, try incognito mode |
| API 404 | Redeploy, check vercel.json |
| SMS not sending | Check Twilio credentials, account balance |
| Email login fails | Verify Supabase credentials |
| Google OAuth fails | Check redirect URL in Google Console |

## Support

For issues:
1. Check Vercel deployment logs
2. Check Twilio console logs
3. Check browser console errors
4. Review this guide's troubleshooting section

