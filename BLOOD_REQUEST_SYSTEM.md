# Blood Request System - Complete Implementation

## Overview
The blood request system connects people who need blood with verified, eligible donors nearby. It includes matching logic, acceptance flow, and request tracking.

## Features Implemented

### 1. Request Blood Form
- **Location**: Dashboard → Quick Actions → "Request Blood" button
- **Fields**:
  - Patient Name (required)
  - Blood Group (dropdown: A+, A-, B+, B-, AB+, AB-, O+, O-)
  - Units Required (1-10)
  - Urgency Level (Critical / Urgent / Scheduled)
  - Hospital Name & Address (required)
  - Contact Person & Phone (required)
  - Auto-detect Location (Geolocation API)
  - Manual location fallback (City / Pincode)
  - Search Radius (5-20 km)

### 2. Donor Matching Logic
**File**: `src/utils/donorMatching.ts`

Matches donors based on:
- Blood group compatibility
- Availability status = `available`
- Visibility = `public`
- Verified = `true`
- Eligibility (56-day rule since last donation)
- Within search radius
- Sorted by distance (nearest first)

### 3. Donor Dashboard - Incoming Requests
**Location**: Dashboard (automatically shown to eligible donors)

Displays:
- Blood group needed
- Patient name
- Hospital name & location
- Distance from donor
- Urgency level
- Units required
- Time posted
- Accept / Decline buttons

**Privacy**: Contact details hidden until donor accepts

### 4. Acceptance Flow
When donor clicks "Accept":
1. Creates entry in `donor_acceptances` table
2. Updates `blood_requests.units_fulfilled`
3. Changes request status to `accepted` or `fulfilled`
4. Reveals contact details to donor
5. Notifies requester (future: email/SMS)

### 5. My Requests Dashboard
**Location**: Dashboard → "My Blood Requests" section

Shows requester:
- All their blood requests
- Request status (Pending / Accepted / Fulfilled / Expired)
- Units needed vs fulfilled
- List of accepted donors with contact info
- Donor details (name, phone, blood group)
- Acceptance timestamps

### 6. Request Status States
- **Pending**: Waiting for donors
- **Accepted**: At least one donor accepted (but not fully fulfilled)
- **Fulfilled**: All required units covered
- **Expired**: Request closed/cancelled

## Database Schema

### New Tables

#### `donor_acceptances`
```sql
- id (UUID, primary key)
- request_id (UUID, foreign key → blood_requests)
- donor_id (UUID, foreign key → auth.users)
- status (TEXT: accepted, completed, cancelled)
- units_committed (INTEGER, default 1)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- UNIQUE constraint on (request_id, donor_id)
```

### Updated Tables

#### `blood_requests`
Added column:
- `units_fulfilled` (INTEGER, default 0)

## Files Created/Modified

### New Files
1. `supabase/migrations/20260220000000_add_donor_acceptances.sql` - Database migration
2. `src/utils/donorMatching.ts` - Matching and acceptance logic
3. `src/components/BloodRequestCard.tsx` - Donor view of incoming requests
4. `src/components/MyRequestsSection.tsx` - Requester view of their requests

### Modified Files
1. `src/pages/Dashboard.tsx` - Added incoming requests section and My Requests
2. `src/components/RequestBloodModal.tsx` - Already implemented (form submission)

## How It Works

### For Requesters:
1. Click "Request Blood" in dashboard
2. Fill form with patient/hospital details
3. Auto-detect or manually enter location
4. Submit request
5. View request status in "My Blood Requests"
6. See accepted donors with contact info

### For Donors:
1. Eligible donors see "Blood Requests Near You" section
2. Review request details (patient, hospital, distance, urgency)
3. Click "Accept" to commit to donation
4. Contact details revealed after acceptance
5. Request removed from their list after acceptance

## Privacy & Security

### Before Acceptance:
- Donor phone: Hidden
- Requester phone: Hidden
- Exact addresses: Hidden (area only)

### After Acceptance:
- Donor sees: Requester contact details
- Requester sees: Donor name, phone, blood group

## Eligibility Rules

Donors must meet ALL criteria to see requests:
- ✅ Availability = `available`
- ✅ Visibility = `public`
- ✅ Verified = `true`
- ✅ Last donation ≥ 56 days ago (or never donated)
- ✅ Within request search radius

## Distance Calculation

Uses Haversine formula:
```typescript
calculateDistance(lat1, lon1, lat2, lon2) → distance in km
```

## Multi-Unit Requests

- Requester can request 1-10 units
- Multiple donors can accept same request
- Request status changes to `fulfilled` when `units_fulfilled >= units_required`
- Partially fulfilled requests remain `accepted` status

## Future Enhancements

### Not Yet Implemented:
1. ❌ Email/SMS notifications to donors
2. ❌ Push notifications
3. ❌ Donor response tracking (response rate)
4. ❌ Request expiration (auto-expire after 24-48 hours)
5. ❌ Donor commitment cancellation
6. ❌ Rating system after donation
7. ❌ Request edit/cancel functionality
8. ❌ Blood group compatibility matching (e.g., O- can donate to all)
9. ❌ Donor availability scheduling
10. ❌ Hospital verification system

## Testing Checklist

### Requester Flow:
- [ ] Create blood request with all fields
- [ ] Auto-detect location works
- [ ] Manual location fallback works
- [ ] Request appears in "My Requests"
- [ ] Status updates when donor accepts
- [ ] Accepted donor details visible

### Donor Flow:
- [ ] Eligible donors see incoming requests
- [ ] Requests sorted by urgency and distance
- [ ] Accept button works
- [ ] Contact details revealed after acceptance
- [ ] Request removed from list after acceptance
- [ ] Ineligible donors don't see requests

### Edge Cases:
- [ ] Multiple donors accepting same request
- [ ] Request fulfilled when units covered
- [ ] Donor outside radius doesn't see request
- [ ] Unverified donor doesn't see requests
- [ ] Donor in cooldown period doesn't see requests

## Migration Instructions

To apply the database migration:

1. **Using Supabase CLI**:
   ```bash
   supabase db push
   ```

2. **Using Supabase Dashboard**:
   - Go to SQL Editor
   - Copy contents of `supabase/migrations/20260220000000_add_donor_acceptances.sql`
   - Run the SQL

3. **Verify Migration**:
   ```sql
   SELECT * FROM donor_acceptances LIMIT 1;
   SELECT units_fulfilled FROM blood_requests LIMIT 1;
   ```

## API Functions

### `findMatchingDonors(bloodGroup, latitude, longitude, radiusKm)`
Returns array of matched donors sorted by distance

### `getPendingRequestsForDonor(donorUserId)`
Returns array of blood requests visible to specific donor

### `acceptBloodRequest(requestId, donorUserId, unitsCommitted)`
Records donor acceptance and updates request status

### `declineBloodRequest(requestId)`
Hides request from donor's list (no database record)

## Component Props

### `<BloodRequestCard>`
```typescript
{
  request: BloodRequestWithDetails;
  onAccept: () => void;
  onDecline: () => void;
}
```

### `<MyRequestsSection>`
```typescript
{
  userId: string;
}
```

### `<RequestBloodModal>`
```typescript
{
  isOpen: boolean;
  onClose: () => void;
}
```

## Status Indicators

### Request Status Colors:
- 🟡 Pending (yellow)
- 🔵 Accepted (blue)
- 🟢 Fulfilled (green)
- ⚫ Expired (gray)

### Urgency Colors:
- 🔴 Critical (red)
- 🟠 Urgent (orange)
- 🔵 Scheduled (blue)

---

**Last Updated**: February 20, 2026
**Version**: 1.0.0
