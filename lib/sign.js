const crypto = require('crypto');

function sign(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function safeEqualHex(a, b) {
  const ab = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

module.exports = { sign, safeEqualHex };
