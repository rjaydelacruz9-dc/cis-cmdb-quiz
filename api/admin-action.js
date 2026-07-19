const { sadd, srem, smembers } = require('../lib/kv');

function checkAdmin(body) {
  const okUser = process.env.ADMIN_USERNAME || 'admin';
  const okPass = process.env.ADMIN_PASSWORD || 'rjdc123';
  return body.adminUser === okUser && body.adminPass === okPass;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  if (!checkAdmin(body)) {
    res.status(401).json({ error: 'Incorrect admin credentials' });
    return;
  }

  const email = String(body.email || '').trim().toLowerCase();

  try {
    if (body.action === 'list') {
      const [pending, approved] = await Promise.all([smembers('pending_emails'), smembers('approved_emails')]);
      res.status(200).json({ pending, approved });
      return;
    }
    if (body.action === 'approve') {
      if (!email) { res.status(400).json({ error: 'Email required' }); return; }
      await sadd('approved_emails', email);
      await srem('pending_emails', email);
      res.status(200).json({ ok: true });
      return;
    }
    if (body.action === 'deny') {
      if (!email) { res.status(400).json({ error: 'Email required' }); return; }
      await srem('pending_emails', email);
      res.status(200).json({ ok: true });
      return;
    }
    if (body.action === 'revoke') {
      if (!email) { res.status(400).json({ error: 'Email required' }); return; }
      await srem('approved_emails', email);
      res.status(200).json({ ok: true });
      return;
    }
    res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
