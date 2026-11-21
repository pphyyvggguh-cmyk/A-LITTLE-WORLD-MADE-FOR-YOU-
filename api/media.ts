import { fetchPublicMediaBlob } from '../src/server/mediaBlobService.ts';
import {
  getQueryParam,
  type VercelNodeRequest,
  type VercelNodeResponse,
} from '../src/server/vercelHttp.ts';

export default async function handler(req: VercelNodeRequest, res: VercelNodeResponse) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const id = getQueryParam(req, 'id');
  const result = await fetchPublicMediaBlob({ id });

  if (result.status !== 200 || !result.buffer) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(result.status).json({ ok: false, error: result.error || 'Media unavailable.' });
    return;
  }

  res.setHeader('Content-Type', result.mimeType);
  res.setHeader('Cache-Control', result.cacheControl || 'public, max-age=31536000, immutable');
  res.setHeader('Content-Length', String(result.buffer.length));
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'HEAD') {
    res.status(200).end();
    return;
  }
  res.status(200).send(result.buffer);
}
