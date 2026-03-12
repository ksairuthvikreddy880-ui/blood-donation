# Google Login Setup Guide

The Google login feature is now implemented in the app. Follow these steps to enable it:

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - For local development: `http://localhost:8080/auth/callback`
   - For production: `https://your-domain.com/auth/callback`
   - For Vercel: `https://your-vercel-app.vercel.app/auth/callback`
7. Copy your **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and click to expand
5. Toggle **Enable Sign in with Google**
6. Paste your **Client ID** and **Client Secret** from Google Cloud
7. Click **Save**

## Step 3: Add Redirect URL to Supabase

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add your site URL:
   - Local: `http://localhost:8080`
   - Production: `https://your-domain.com`
3. Add redirect URLs:
   - `http://localhost:8080/auth/callback`
   - `https://your-domain.com/auth/callback`

## Step 4: Test Locally

1. Run your app: `npm run dev`
2. Go to the login page
3. Click "Sign in with Google"
4. You should be redirected to Google login
5. After login, you'll be redirected back to the dashboard

## Step 5: Deploy to Vercel

1. Add your Vercel URL to Google Cloud Console authorized redirect URIs
2. Add your Vercel URL to Supabase URL Configuration
3. Deploy your app to Vercel
4. Test Google login on your production URL

## Troubleshooting

**"Redirect URI mismatch" error:**
- Make sure the redirect URI in Google Cloud Console matches exactly
- Check that you've added the URL to Supabase URL Configuration

**"Invalid Client ID" error:**
- Verify you copied the correct Client ID from Google Cloud
- Make sure you saved the credentials in Supabase

**Google login button doesn't work:**
- Check browser console for errors
- Make sure Google provider is enabled in Supabase
- Verify your Supabase URL is correct in `.env`

## How It Works

1. User clicks "Sign in with Google"
2. App redirects to Google login page
3. User authenticates with Google
4. Google redirects back to your app with auth code
5. Supabase exchanges code for session
6. User is logged in and redirected to dashboard

The user's profile is automatically created in Supabase with their Google email and name.
