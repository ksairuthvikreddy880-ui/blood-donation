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
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and code are required' });
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid verification code format' });
    }

    // TODO: In production, verify the code against your database
    // For now, we'll accept any 6-digit code
    
    console.log('Code verified for phone:', phone);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Phone number verified',
      verified: true
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to verify code',
      details: error.toString()
    });
  }
}
