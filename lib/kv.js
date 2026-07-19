const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kv(...args) {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV not configured (set KV_REST_API_URL / KV_REST_API_TOKEN)');
  const path = args.map(encodeURIComponent).join('/');
  const r = await fetch(`${KV_URL}/${path}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const data = await r.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

module.exports = {
  sadd: (key, member) => kv('sadd', key, member),
  srem: (key, member) => kv('srem', key, member),
  sismember: (key, member) => kv('sismember', key, member).then((r) => r === 1),
  smembers: (key) => kv('smembers', key).then((r) => r || []),
};
