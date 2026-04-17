# Supabase Integration Guide

## Overview

The Blood Donation Platform uses Supabase as the backend for:
- User authentication
- Database storage
- Real-time subscriptions
- Row-level security

## Current Configuration

### Project Details
- **Project ID**: `YOUR_PROJECT_ID`
- **Project URL**: `https://YOUR_PROJECT_ID.supabase.co`
- **Publishable Key**: `YOUR_ANON_KEY`

### Environment Variables

```
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
```

## Supabase Client Setup

### Location
`src/integrations/supabase/client.ts`

### Configuration
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Features
- ✅ Local storage for session persistence
- ✅ Auto token refresh
- ✅ TypeScript support with Database types

## Database Schema

### Tables

#### profiles
- `user_id` (UUID) - Primary key, references auth.users
- `name` (TEXT) - User's full name
- `blood_group` (TEXT) - Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `phone` (TEXT) - Phone number
- `city` (TEXT) - City/location
- `last_donation_date` (DATE) - Last donation date
- `availability` (TEXT) - 'available' or 'unavailable'
- `verified` (BOOLEAN) - Account verification status
- `created_at` (TIMESTAMP) - Account creation date

#### blood_requests
- `id` (UUID) - Primary key
- `requester_id` (UUID) - References profiles.user_id
- `patient_name` (TEXT) - Patient name
- `blood_group` (TEXT) - Required blood type
- `units_needed` (INTEGER) - Units of blood needed
- `urgency` (TEXT) - 'critical', 'urgent', or 'normal'
- `hospital_name` (TEXT) - Hospital name
- `hospital_address` (TEXT) - Hospital address
- `contact_phone` (TEXT) - Contact phone number
- `city` (TEXT) - City/location
- `status` (TEXT) - 'pending', 'fulfilled', or 'closed'
- `units_fulfilled` (INTEGER) - Units fulfilled so far
- `created_at` (TIMESTAMP) - Request creation date

#### donor_acceptances
- `id` (UUID) - Primary key
- `request_id` (UUID) - References blood_requests.id
- `donor_id` (UUID) - References profiles.user_id
- `status` (TEXT) - 'accepted' or 'declined'
- `accepted_at` (TIMESTAMP) - Acceptance timestamp

## Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: { name: 'John Doe', phone: '+91XXXXXXXXXX' }
  }
});
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign Out
```typescript
await supabase.auth.signOut();
```

### OAuth (Google)
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin + '/dashboard'
  }
});
```

## Database Operations

### Read Data
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId);
```

### Insert Data
```typescript
const { data, error } = await supabase
  .from('blood_requests')
  .insert([{
    requester_id: userId,
    patient_name: 'John',
    blood_group: 'O+',
    units_needed: 2,
    urgency: 'critical',
    hospital_name: 'City Hospital',
    hospital_address: '123 Main St',
    contact_phone: '+91XXXXXXXXXX',
    city: 'Hyderabad'
  }]);
```

### Update Data
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({ availability: 'available' })
  .eq('user_id', userId);
```

### Delete Data
```typescript
const { data, error } = await supabase
  .from('blood_requests')
  .delete()
  .eq('id', requestId);
```

## Row Level Security (RLS)

### Policies

#### profiles
- **SELECT**: Everyone can view all profiles
- **INSERT**: Users can insert their own profile
- **UPDATE**: Users can update their own profile

#### blood_requests
- **SELECT**: Authenticated users can view all requests
- **INSERT**: Users can insert their own requests
- **UPDATE**: Users can update their own requests

#### donor_acceptances
- **SELECT**: Requesters can view acceptances for their requests
- **SELECT**: Donors can view their own acceptances
- **INSERT**: Donors can insert their own acceptances

## Real-time Subscriptions

### Subscribe to Changes
```typescript
const subscription = supabase
  .from('blood_requests')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe();
```

### Unsubscribe
```typescript
subscription.unsubscribe();
```

## Error Handling

### Common Errors

**401 Unauthorized**
- User not authenticated
- Session expired
- Invalid credentials

**403 Forbidden**
- User doesn't have permission
- RLS policy violation
- Insufficient privileges

**404 Not Found**
- Resource doesn't exist
- Table doesn't exist
- Record not found

**400 Bad Request**
- Invalid data format
- Missing required fields
- Invalid query

### Error Handling Pattern
```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select('*');
  
  if (error) throw error;
  
  // Use data
} catch (error) {
  console.error('Error:', error.message);
  // Handle error
}
```

## Deployment

### Vercel Environment Variables

Add to Vercel project settings:
```
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
```

### Redirect URLs

Configure in Supabase dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Add redirect URLs:
   - `https://yourdomain.com/auth`
   - `https://yourdomain.com/dashboard`
   - `http://localhost:8080/auth` (local development)

## Monitoring

### Supabase Dashboard

1. **Authentication**
   - View user accounts
   - Check login attempts
   - Monitor sessions

2. **Database**
   - View table data
   - Check query performance
   - Monitor storage usage

3. **Logs**
   - API logs
   - Auth logs
   - Database logs

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to Supabase
**Solution**:
1. Verify environment variables are set
2. Check Supabase project is active
3. Verify network connectivity
4. Check browser console for errors

### Authentication Issues

**Problem**: Users can't login
**Solution**:
1. Verify email/password are correct
2. Check user exists in Supabase
3. Verify RLS policies
4. Check auth logs in Supabase

### Database Issues

**Problem**: Can't read/write data
**Solution**:
1. Verify table exists
2. Check RLS policies
3. Verify user has permissions
4. Check database logs

## Security Best Practices

1. **Never commit secrets**
   - Use `.env` for local development
   - Use Vercel environment variables for production
   - Never share publishable key in code

2. **Use RLS policies**
   - Restrict data access at database level
   - Don't rely on frontend validation
   - Test policies thoroughly

3. **Validate input**
   - Validate email format
   - Validate phone number format
   - Sanitize user input

4. **Use HTTPS**
   - Always use HTTPS in production
   - Redirect HTTP to HTTPS
   - Use secure cookies

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)

