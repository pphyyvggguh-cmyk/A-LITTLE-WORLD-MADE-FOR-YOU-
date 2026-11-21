import type { VercelNodeRequest, VercelNodeResponse } from '../src/server/vercelHttp.ts';

export default function handler(req: VercelNodeRequest, res: VercelNodeResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  const aiConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    mode: 'firebase',
    runtime: 'vercel-serverless',
    aiConfigured,
  });
}
