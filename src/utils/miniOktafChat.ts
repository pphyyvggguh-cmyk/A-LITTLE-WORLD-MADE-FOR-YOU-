import type { OktafExpression, OktafPose } from '../data/miniOktaf';

export interface MiniOktafChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pose?: OktafPose;
  expression?: OktafExpression;
  createdAt: string;
}

export interface MiniOktafChatApiReply {
  ok: true;
  reply: string;
  pose: OktafPose;
  expression: OktafExpression;
}

export interface MiniOktafChatApiError {
  ok: false;
  code: string;
  error: string;
}

export const VALID_OKTAF_POSES = new Set<OktafPose>([
  'standing',
  'walking',
  'running',
  'jumping',
  'sitting',
  'sleeping',
  'waving',
  'pointing',
  'gift',
  'cake',
  'peeking',
  'cheering',
  'birthday_cake',
  'globe',
  'heart',
  'curious',
  'celebrating',
  'relaxing',
]);

export const VALID_OKTAF_EXPRESSIONS = new Set<OktafExpression>([
  'normal',
  'happy',
  'laughing',
  'surprised',
  'pouty',
  'shy',
  'sleepy',
  'wink',
]);

export const MAX_CHAT_INPUT_CHARS = 600;
export const MAX_CHAT_HISTORY_TURNS = 14;

export function sanitizePose(raw: unknown, fallback: OktafPose = 'happy' as OktafPose): OktafPose {
  if (typeof raw === 'string' && VALID_OKTAF_POSES.has(raw as OktafPose)) {
    return raw as OktafPose;
  }
  return VALID_OKTAF_POSES.has(fallback) ? fallback : 'waving';
}

export function sanitizeExpression(
  raw: unknown,
  fallback: OktafExpression = 'happy'
): OktafExpression {
  if (typeof raw === 'string' && VALID_OKTAF_EXPRESSIONS.has(raw as OktafExpression)) {
    return raw as OktafExpression;
  }
  return fallback;
}

export function validateUserChatPrompt(raw: string): { ok: true; text: string } | { ok: false; error: string } {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return { ok: false, error: 'Ketik dulu pesan buat Mini Oktaf ya ♡' };
  }
  if (cleaned.length > MAX_CHAT_INPUT_CHARS) {
    return {
      ok: false,
      error: `Pesan kepanjangan (maksimal ${MAX_CHAT_INPUT_CHARS} karakter ya).`,
    };
  }
  return { ok: true, text: cleaned };
}

export function trimChatHistory(messages: MiniOktafChatMessage[]): Array<{ role: 'user' | 'assistant'; text: string }> {
  return messages
    .slice(-MAX_CHAT_HISTORY_TURNS)
    .map((m) => ({
      role: m.role,
      text: m.text.trim().slice(0, 1200),
    }))
    .filter((m) => m.text.length > 0);
}

export function parseMiniOktafApiResult(rawText: string): {
  reply: string;
  pose: OktafPose;
  expression: OktafExpression;
} {
  const trimmed = rawText.trim();
  try {
    const parsed = JSON.parse(trimmed) as {
      reply?: unknown;
      pose?: unknown;
      expression?: unknown;
    };
    const reply =
      typeof parsed.reply === 'string' && parsed.reply.trim()
        ? parsed.reply.trim()
        : trimmed;
    return {
      reply,
      pose: sanitizePose(parsed.pose, 'waving'),
      expression: sanitizeExpression(parsed.expression, 'happy'),
    };
  } catch {
    return {
      reply: trimmed,
      pose: 'waving',
      expression: 'happy',
    };
  }
}

export async function requestMiniOktafChatReply(params: {
  messages: MiniOktafChatMessage[];
  currentChapter: string;
  collectedFlowerCount: number;
  fetchImpl?: typeof fetch;
}): Promise<MiniOktafChatApiReply> {
  const fetchFn = params.fetchImpl ?? fetch;
  const payload = {
    messages: trimChatHistory(params.messages),
    currentChapter: params.currentChapter,
    collectedFlowerCount: params.collectedFlowerCount,
  };

  const response = await fetchFn('/api/mini-oktaf/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | MiniOktafChatApiReply
    | MiniOktafChatApiError
    | null;

  if (!response.ok || !body || !body.ok) {
    const errorMsg =
      (body && 'error' in body && body.error) ||
      `Mini Oktaf lagi belum bisa tersambung (HTTP ${response.status}).`;
    throw new Error(errorMsg);
  }

  return {
    ok: true,
    reply: body.reply,
    pose: sanitizePose(body.pose, 'waving'),
    expression: sanitizeExpression(body.expression, 'happy'),
  };
}
