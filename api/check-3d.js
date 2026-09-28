const BASE_URL = 'https://openapi.tripo3d.ai/v3';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.TRIPO_API_KEY;
  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  if (!key) return res.status(500).json({ error: 'TRIPO_API_KEY is not configured.' });
  if (!id) return res.status(400).json({ error: 'id is required.' });

  try {
    const r = await fetch(`${BASE_URL}/tasks/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    const p = await r.json();
    if (!r.ok || p.code !== 0) {
      return res.status(r.status || 502).json({ error: p.message || p.suggestion || 'Tripo status request failed.' });
    }
    const d = p.data;
    return res.status(200).json({
      id: d.task_id,
      status: d.status,
      progress: d.progress || 0,
      modelUrl: d.output?.model_url || null,
      previewUrl: d.output?.rendered_image_url || null,
      error: d.error_message || null
    });
  } catch (e) {
    return res.status(502).json({ error: e instanceof Error ? e.message : 'Tripo unavailable.' });
  }
}
