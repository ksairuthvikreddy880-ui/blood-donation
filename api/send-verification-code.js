import twilio from 'twilio';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in memory (in production, use a database)
    // For now, we'll send it via SMS
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: `Your Blood Donation Platform verification code is: ${code}. Valid for 10 minutes.`,
      from: twilioPhone,
      to: phone
    });

    // Store verification code (you should use a database in production)
    // For demo purposes, we'll return it (NOT SECURE - for testing only)
    return res.status(200).json({ 
      success: true, 
      message: 'Verification code sent',
      code: code // Remove this in production!
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to send verification code' 
    });
  }
}
