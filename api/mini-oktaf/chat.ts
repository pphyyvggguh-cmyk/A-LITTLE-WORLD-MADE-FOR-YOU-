import { processMiniOktafChatRequest } from '../../src/server/miniOktafService.ts';
import {
  parseJsonBody,
  type VercelNodeRequest,
  type VercelNodeResponse,
} from '../../src/server/vercelHttp.ts';

export default async function handler(req: VercelNodeRequest, res: VercelNodeResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed.' });
    return;
  }

  const body = await parseJsonBody(req);
  const result = await processMiniOktafChatRequest({
    apiKey: process.env.GEMINI_API_KEY,
    body,
  });

  res.status(result.status).json(result.json);
}
