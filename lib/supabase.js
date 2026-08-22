const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path, opts = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase not configured (set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || 'return=representation',
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`Supabase error ${r.status}: ${text}`);
  }
  if (r.status === 204) return null;
  const ct = r.headers.get('content-type') || '';
  return ct.includes('application/json') ? r.json() : null;
}

module.exports = { sb };
