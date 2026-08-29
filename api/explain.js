module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server not configured. Set ANTHROPIC_API_KEY.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const summary = String((body && body.summary) || '').trim();
  if (!summary || summary.length > 4000) {
    res.status(400).json({ error: 'Missing or oversized question summary' });
    return;
  }

  const prompt = `You are a ServiceNow CMDB/CSDM subject-matter expert helping someone study for the CIS – CMDB Data Foundation certification exam.

${summary}

Explain in 3-5 concise sentences WHY the correct answer is right, referencing the relevant ServiceNow CSDM/CMDB concept, and briefly note why the other options are wrong or less correct. If the learner picked something different, address their specific mistake. Keep it focused and exam-relevant, no filler, no restating the question.`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    res.status(502).json({ error: 'AI request failed', detail });
    return;
  }

  const data = await r.json();
  const text = (data.content || []).map((c) => c.text || '').join('').trim();
  res.status(200).json({ explanation: text || 'No explanation returned.' });
};
