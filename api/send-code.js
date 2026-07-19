const crypto = require('crypto');
const { sign } = require('../lib/sign');
const { sadd, sismember } = require('../lib/kv');

async function notifyAdmin(email, secret) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!adminEmail || !apiKey) return;
  const site = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const approveUrl = `${site}/api/approve-email?email=${encodeURIComponent(email)}&sig=${sign(email, secret)}`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.OTP_FROM_EMAIL || 'onboarding@resend.dev',
      to: [adminEmail],
      subject: 'CIS CMDB Quiz — new access request',
      html: `<p><b>${email}</b> is requesting access to the quiz.</p><p><a href="${approveUrl}">Approve this email →</a></p>`,
    }),
  }).catch(() => {});
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = process.env.OTP_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || !apiKey) {
    res.status(500).json({ error: 'Server not configured. Set OTP_SECRET and RESEND_API_KEY.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const email = String((body && body.email) || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Valid email required' });
    return;
  }

  let approved;
  try {
    approved = await sismember('approved_emails', email);
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  if (!approved) {
    try {
      await sadd('pending_emails', email);
      await notifyAdmin(email, secret);
    } catch (e) {
      res.status(500).json({ error: e.message });
      return;
    }
    res.status(200).json({ status: 'pending' });
    return;
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const expiry = Date.now() + 10 * 60 * 1000;
  const payload = `${email}:${expiry}`;
  const token = `${Buffer.from(payload).toString('base64')}.${sign(`${payload}:${code}`, secret)}`;

  const emailResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.OTP_FROM_EMAIL || 'onboarding@resend.dev',
      to: [email],
      subject: 'Your CIS CMDB Quiz login code',
      html: `<p>Your one-time login code is:</p><h2 style="letter-spacing:4px">${code}</h2><p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>`,
    }),
  });

  if (!emailResp.ok) {
    const detail = await emailResp.text().catch(() => '');
    res.status(502).json({ error: 'Failed to send email', detail });
    return;
  }

  res.status(200).json({ status: 'sent', token });
};
