import type { VercelNodeRequest, VercelNodeResponse } from '../src/server/vercelHttp.ts';

export default function handler(req: VercelNodeRequest, res: VercelNodeResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }
  const nowMs = Date.now();
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).json({
    serverTimeMs: nowMs,
    iso: new Date(nowMs).toISOString(),
  });
}
