import { verifyQuest2AnswerLocal } from '../../src/utils/quests.ts';
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
    res.status(405).json({ ok: false, correct: false, error: 'Method not allowed.' });
    return;
  }

  const body = await parseJsonBody(req);
  const stepIndex = Number(body.stepIndex);
  const answer = String(body.answer ?? '');

  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 2) {
    res.status(400).json({ ok: false, correct: false, error: 'Pertanyaan tidak valid.' });
    return;
  }
  if (!answer.trim()) {
    res.status(200).json({ ok: true, correct: false, empty: true });
    return;
  }

  const correct = verifyQuest2AnswerLocal(stepIndex, answer);
  res.status(200).json({ ok: true, correct });
}
