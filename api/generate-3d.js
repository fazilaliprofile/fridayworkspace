const TRIPO_BASE_URL = 'https://openapi.tripo3d.ai/v3';
const TRIPO_MODEL = 'v3.1-20260211';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'TRIPO_API_KEY is not configured in Vercel environment variables.'
    });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'A 3D prompt is required.' });
  }

  try {
    const response = await fetch(`${TRIPO_BASE_URL}/generation/text-to-model`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        model: TRIPO_MODEL,
        texture: true,
        pbr: true,
        texture_quality: 'detailed',
        geometry_quality: 'detailed',
        auto_size: true,
        export_uv: true
      })
    });

    const payload = await response.json();
    if (!response.ok || payload.code !== 0) {
      return res.status(response.status || 502).json({
        error: payload.message || payload.suggestion || 'Tripo generation request failed.',
        code: payload.code
      });
    }

    return res.status(200).json({
      taskId: payload.data.task_id,
      provider: 'tripo',
      model: TRIPO_MODEL
    });
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : 'Unable to reach Tripo.'
    });
  }
}
