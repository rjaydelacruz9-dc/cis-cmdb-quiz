const crypto = require('crypto');

function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = process.env.OTP_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server not configured. Set OTP_SECRET.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const email = String((body && body.email) || '').trim().toLowerCase();
  const code = String((body && body.code) || '').trim();
  const token = (body && body.token) || '';

  if (!email || !/^\d{6}$/.test(code) || !token.includes('.')) {
    res.status(400).json({ error: 'Missing or invalid fields' });
    return;
  }

  const [encodedPayload, sig] = token.split('.');
  let payload;
  try {
    payload = Buffer.from(encodedPayload, 'base64').toString('utf8');
  } catch (e) {
    res.status(400).json({ error: 'Invalid token' });
    return;
  }

  const [tokenEmail, expiryStr] = payload.split(':');
  const expiry = Number(expiryStr);

  if (tokenEmail !== email) {
    res.status(400).json({ error: 'Email mismatch' });
    return;
  }
  if (!expiry || Date.now() > expiry) {
    res.status(400).json({ error: 'Code expired, request a new one' });
    return;
  }

  const expectedSig = sign(`${payload}:${code}`, secret);
  const sigBuf = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');
  const valid = sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);

  if (!valid) {
    res.status(401).json({ error: 'Incorrect code' });
    return;
  }

  res.status(200).json({ ok: true });
};
