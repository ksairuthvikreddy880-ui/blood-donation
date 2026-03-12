# Blood Donation Platform - Features Summary

## Authentication Features

### 1. Email/Password Authentication
- Sign up with email and password
- Sign in with existing credentials
- Password validation (minimum 6 characters)
- Email verification on signup

### 2. Google OAuth Login
- One-click Google login
- Automatic profile creation
- No password needed
- Secure OAuth 2.0 flow

**Setup:** See `GOOGLE_LOGIN_SETUP.md`

### 3. Twilio SMS Verification
- Phone number verification during signup
- 6-digit verification code sent via SMS
- Verified phone stored in user profile
- Supports international numbers

**Setup:** See `TWILIO_SETUP.md`

## Core Features

### Blood Request Management
- Create blood requests with patient details
- View all blood requests in table format
- Filter by status (All, Pending, Fulfilled)
- Accept/decline requests
- Edit your own requests
- Real-time updates

### Donor System
- Register as a donor
- Set availability status
- View donor eligibility (56-day rule)
- Public profile visibility
- Donor status badge

### Blood Centres Locator
- Find nearby blood centres
- Distance calculation (Haversine formula)
- Map and list view toggle
- 15 blood centres in Hyderabad
- Geolocation support

### Dashboard
- Real-time profile data
- Quick action buttons
- Recent activity feed
- Blood request statistics
- Live stats counter

### Notifications
- WhatsApp message on request acceptance
- Pre-filled message with request details
- Donor contact information included
- One-click send

## Database Features

### Tables
- `profiles` - User profiles and donor info
- `blood_requests` - Blood donation requests
- `donor_acceptances` - Donor acceptance tracking
- `ratings` - Donor ratings and feedback
- `user_roles` - User role management

### Security
- Row-level security (RLS) policies
- User authentication required
- Data privacy controls
- Automatic profile creation on signup

## Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
- Deploy to Vercel
- Add environment variables
- Configure Supabase
- Set up Google OAuth
- Configure Twilio (optional)

## Environment Variables Required

```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_TWILIO_ACCOUNT_SID (optional)
VITE_TWILIO_AUTH_TOKEN (optional)
VITE_TWILIO_PHONE_NUMBER (optional)
```

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + Google OAuth
- **SMS:** Twilio
- **Hosting:** Vercel
- **Maps:** Geolocation API

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Configure Supabase database
5. Run development server: `npm run dev`
6. Open http://localhost:8080

## Documentation

- `GOOGLE_LOGIN_SETUP.md` - Google OAuth setup
- `TWILIO_SETUP.md` - SMS verification setup
- `COMPLETE_DATABASE_SETUP.sql` - Database schema
- `BLOOD_REQUEST_SYSTEM.md` - Request system details
