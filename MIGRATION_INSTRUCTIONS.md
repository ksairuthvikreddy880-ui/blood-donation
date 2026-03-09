# Database Migration Instructions

## Issue
The blood request acceptance system requires a new database table `donor_acceptances` that hasn't been created yet.

## Current Status
The app will work with limited functionality:
- ✅ Users can create blood requests
- ✅ Requests are saved to database
- ✅ Request tracking works
- ❌ Donors cannot see incoming requests
- ❌ Donors cannot accept requests
- ❌ Requesters cannot see accepted donors

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20260220000000_add_donor_acceptances.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify success - you should see "Success. No rows returned"

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
cd haste-blood-main
supabase db push
```

## What the Migration Does

The migration creates:

1. **donor_acceptances table**
   - Tracks which donors accepted which blood requests
   - Links donors to requests
   - Records units committed
   - Tracks acceptance status

2. **units_fulfilled column**
   - Added to blood_requests table
   - Tracks how many units have been committed
   - Auto-updates when donors accept

3. **calculate_distance function**
   - PostgreSQL function for distance calculations
   - Uses Haversine formula
   - Returns distance in kilometers

## After Migration

Once the migration is applied, the full system will be active:

- ✅ Donors will see incoming blood requests in their dashboard
- ✅ Donors can accept/decline requests
- ✅ Requesters will see which donors accepted their requests
- ✅ Contact details revealed after acceptance
- ✅ Multi-unit request tracking
- ✅ Automatic status updates (pending → accepted → fulfilled)

## Verification

After applying the migration, verify it worked:

1. Refresh the website
2. Sign in as a donor
3. Check if "Blood Requests Near You" section appears (if there are matching requests)
4. Create a blood request
5. Check if it shows in "My Blood Requests" with proper tracking

## Troubleshooting

### Error: "relation already exists"
- The table was already created
- Safe to ignore
- The app should work normally

### Error: "permission denied"
- You need admin access to the Supabase project
- Contact your project administrator

### Error: "syntax error"
- Make sure you copied the entire SQL file
- Check for any missing characters
- Try copying again

## Migration File Location

The migration SQL file is located at:
```
haste-blood-main/supabase/migrations/20260220000000_add_donor_acceptances.sql
```

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Check the Supabase logs in the dashboard
3. Verify your Supabase project is active
4. Ensure you have the correct permissions

---

**Note**: The app is designed to work gracefully without the migration, but with limited functionality. Apply the migration to unlock the full blood request acceptance system.
