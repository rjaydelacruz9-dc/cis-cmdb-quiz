const { sb } = require('../lib/supabase');

function status(correct, attempted, total) {
  return correct === total && attempted === total ? 'mastered' : 'incomplete';
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

  const identity = String(body.identity || '').trim().toLowerCase();
  if (!identity) {
    res.status(400).json({ error: 'identity required' });
    return;
  }

  try {
    if (body.action === 'get-all') {
      const [progress, sessions] = await Promise.all([
        sb(`quiz_progress?identity=eq.${encodeURIComponent(identity)}&select=category,correct,attempted,total,status`),
        sb(`quiz_sessions?identity=eq.${encodeURIComponent(identity)}&select=session_json`),
      ]);
      res.status(200).json({
        progress: progress || [],
        session: sessions && sessions[0] ? sessions[0].session_json : null,
      });
      return;
    }

    if (body.action === 'save-progress') {
      const stats = Array.isArray(body.categoryStats) ? body.categoryStats : [];
      const rows = stats.map((s) => ({
        identity,
        category: s.category,
        correct: s.correct,
        attempted: s.attempted,
        total: s.total,
        status: status(s.correct, s.attempted, s.total),
        updated_at: new Date().toISOString(),
      }));
      if (rows.length) {
        await sb('quiz_progress?on_conflict=identity,category', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=minimal',
          body: JSON.stringify(rows),
        });
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (body.action === 'save-session') {
      await sb('quiz_sessions?on_conflict=identity', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: JSON.stringify([{ identity, session_json: body.session, updated_at: new Date().toISOString() }]),
      });
      res.status(200).json({ ok: true });
      return;
    }

    if (body.action === 'clear-session') {
      await sb(`quiz_sessions?identity=eq.${encodeURIComponent(identity)}`, {
        method: 'DELETE',
        prefer: 'return=minimal',
      });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
