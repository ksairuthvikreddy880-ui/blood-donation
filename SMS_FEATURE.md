# SMS Notification Feature

## Overview
When a donor accepts a blood request, an automatic SMS notification is sent to the requester's contact phone number using Fast2SMS API.

## How It Works

1. Donor clicks "Accept" button on a blood request
2. System saves the acceptance to the database
3. System automatically sends SMS to the requester's contact phone number
4. SMS includes:
   - Donor's name and phone number
   - Blood group and units requested
   - Patient name
   - Hospital name
   - Message that donor will contact them shortly

## Configuration

The Fast2SMS API key is stored in `.env` file:
```
VITE_FAST2SMS_API_KEY="your_api_key_here"
```

## SMS Message Format

```
Blood Dono