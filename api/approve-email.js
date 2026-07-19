const { sign, safeEqualHex } = require('../lib/sign');
const { sadd, srem } = require('../lib/kv');

function page(title, body) {
  return `<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="font-family:-apple-system,sans-serif;max-width:480px;margin:80px auto;padding:0 20px;text-align:center;color:#1e293b">
${body}
</body>`;
}

module.exports = async (req, res) => {
  const secret = process.env.OTP_SECRET;
  res.setHeader('Content-Type', 'text/html');
  if (!secret) {
    res.status(500).send(page('Not configured', '<p>Server not configured.</p>'));
    return;
  }

  const email = String((req.query && req.query.email) || '').trim().toLowerCase();
  const sig = String((req.query && req.query.sig) || '');
  if (!email || !sig) {
    res.status(400).send(page('Missing info', '<p>Missing email or signature.</p>'));
    return;
  }

  const expected = sign(email, secret);
  if (!safeEqualHex(sig, expected)) {
    res.status(401).send(page('Invalid link', '<p>This approval link is invalid or has expired.</p>'));
    return;
  }

  try {
    await sadd('approved_emails', email);
    await srem('pending_emails', email);
  } catch (e) {
    res.status(500).send(page('Error', `<p>${e.message}</p>`));
    return;
  }

  res.status(200).send(page('Approved', `<h2>✅ Approved</h2><p><b>${email}</b> can now request a login code.</p>`));
};
