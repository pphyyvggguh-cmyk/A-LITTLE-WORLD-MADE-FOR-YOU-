import { GoogleGenAI, Type } from '@google/genai';
import {
  buildMiniOktafSystemInstruction,
  parseMiniOktafApiResult,
  sanitizeExpression,
  sanitizePose,
  trimChatHistory,
  VALID_OKTAF_EXPRESSIONS,
  VALID_OKTAF_POSES,
  validateUserChatPrompt,
  type MiniOktafChatMessage,
} from '../utils/miniOktafChat.ts';

export interface MiniOktafChatServiceResult {
  status: number;
  json:
    | {
        ok: true;
        reply: string;
        pose: string;
        expression: string;
      }
    | {
        ok: false;
        code: string;
        error: string;
      };
}

export interface MiniOktafGenAiLike {
  models: {
    generateContent(
      params: Parameters<GoogleGenAI['models']['generateContent']>[0]
    ): Promise<{ text?: string }>;
  };
}

const PRIMARY_GEMINI_MODEL = 'gemini-4-hydrogen';
const MODEL_NOT_FOUND_FALLBACKS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash'] as const;

function getUpstreamErrorInfo(err: unknown): {
  status: number;
  message: string;
  isApiKeyError: boolean;
} {
  const rawStatus = Number(
    (err as { status?: unknown; code?: unknown })?.status ??
      (err as { error?: { code?: unknown } })?.error?.code ??
      0
  );
  const msg = err instanceof Error ? err.message : String(err || '');
  const lower = msg.toLowerCase();

  let status = Number.isFinite(rawStatus) && rawStatus >= 100 ? rawStatus : 0;
  if (!status) {
    if (lower.includes('404') || lower.includes('not_found') || lower.includes('not found')) {
      status = 404;
    } else if (lower.includes('401') || lower.includes('unauthenticated')) {
      status = 401;
    } else if (lower.includes('403') || lower.includes('permission_denied')) {
      status = 403;
    } else if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
      status = 429;
    } else if (lower.includes('400') || lower.includes('invalid_argument')) {
      status = 400;
    }
  }

  const isApiKeyError =
    status === 401 ||
    status === 403 ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied') ||
    lower.includes('unauthenticated');

  return { status, message: msg, isApiKeyError };
}

function isModelNotFoundError(err: unknown): boolean {
  const { status, message } = getUpstreamErrorInfo(err);
  const lower = message.toLowerCase();
  return (
    status === 404 ||
    lower.includes('not_found') ||
    lower.includes('is not found') ||
    lower.includes('not supported for generatecontent')
  );
}

function isRetryableModelFailure(err: unknown): boolean {
  if (isModelNotFoundError(err)) return true;
  const { status, message, isApiKeyError } = getUpstreamErrorInfo(err);
  if (isApiKeyError || status === 429) return false;
  const lower = message.toLowerCase();
  const isTimeoutOrNetwork =
    (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('deadline') ||
    lower.includes('fetch failed') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout');
  return status >= 500 || isTimeoutOrNetwork;
}

function isStructuredSchemaUnsupportedError(err: unknown): boolean {
  const { status, message, isApiKeyError } = getUpstreamErrorInfo(err);
  if (isApiKeyError || status !== 400) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('schema') ||
    lower.includes('response_mime_type') ||
    lower.includes('json mode') ||
    lower.includes('invalid_argument')
  );
}

const ATTEMPT_TIMEOUT_MS = 10_000;

export async function processMiniOktafChatRequest(input: {
  apiKey: string | undefined;
  body: Record<string, unknown> | null | undefined;
  aiClientFactory?: (apiKey: string) => MiniOktafGenAiLike;
  attemptTimeoutMs?: number;
}): Promise<MiniOktafChatServiceResult> {
  const apiKey = String(input.apiKey || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      status: 503,
      json: {
        ok: false,
        code: 'AI_NOT_CONFIGURED',
        error:
          'Fitur ngobrol AI Mini Oktaf belum aktif karena GEMINI_API_KEY belum diatur di server.',
      },
    };
  }

  const body = input.body || {};
  const rawMessages = Array.isArray(body.messages)
    ? (body.messages as MiniOktafChatMessage[])
    : [];
  const history = trimChatHistory(rawMessages);
  const lastTurn = history[history.length - 1];

  if (!lastTurn || lastTurn.role !== 'user') {
    return {
      status: 400,
      json: {
        ok: false,
        code: 'INVALID_PROMPT',
        error: 'Kirim pesan teks terlebih dahulu untuk mengobrol dengan Mini Oktaf.',
      },
    };
  }

  const promptCheck = validateUserChatPrompt(lastTurn.text);
  if (!promptCheck.ok) {
    return {
      status: 400,
      json: {
        ok: false,
        code: 'INVALID_PROMPT',
        error: promptCheck.error,
      },
    };
  }

  const currentChapter = String(body.currentChapter || 'hub').slice(0, 40);
  const flowerCount = Math.max(0, Math.min(7, Number(body.collectedFlowerCount || 0) || 0));
  const collectedFlowerIds = Array.isArray(body.collectedFlowerIds)
    ? body.collectedFlowerIds
        .filter((x: unknown): x is string => typeof x === 'string')
        .slice(0, 7)
    : [];
  const quest2Step = Math.max(0, Math.min(3, Number(body.quest2Step || 0) || 0));
  const quest2Completed = Boolean(body.quest2Completed) || quest2Step >= 3;
  const collectedPolaroidIds = Array.isArray(body.collectedPolaroidIds)
    ? body.collectedPolaroidIds
        .filter((x: unknown): x is string => typeof x === 'string')
        .slice(0, 5)
    : [];
  const collectedPolaroidCount = Math.max(
    collectedPolaroidIds.length,
    Math.min(5, Number(body.collectedPolaroidCount || 0) || 0)
  );

  const systemInstruction = buildMiniOktafSystemInstruction(
    {
      currentChapter,
      collectedFlowerCount: flowerCount,
      collectedFlowerIds,
      quest2Step,
      quest2Completed,
      collectedPolaroidCount,
      collectedPolaroidIds,
    },
    history
  );

  const attemptTimeoutMs = Math.max(1000, input.attemptTimeoutMs ?? ATTEMPT_TIMEOUT_MS);

  const ai: MiniOktafGenAiLike = input.aiClientFactory
    ? input.aiClientFactory(apiKey)
    : new GoogleGenAI({
        apiKey,
        httpOptions: {
          timeout: attemptTimeoutMs,
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

  const contents = history.map((turn) => ({
    role: turn.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: turn.text }],
  }));

  const structuredConfig = {
    systemInstruction,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        reply: {
          type: Type.STRING,
          description: 'Balasan hangat Mini Oktaf dalam bahasa Indonesia yang natural.',
        },
        pose: {
          type: Type.STRING,
          enum: Array.from(VALID_OKTAF_POSES),
        },
        expression: {
          type: Type.STRING,
          enum: Array.from(VALID_OKTAF_EXPRESSIONS),
        },
      },
      required: ['reply', 'pose', 'expression'],
    },
  };

  const modelsToTry = [PRIMARY_GEMINI_MODEL, ...MODEL_NOT_FOUND_FALLBACKS];
  let lastError: unknown = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const abortSignal =
      typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(attemptTimeoutMs)
        : undefined;
    try {
      let response: { text?: string };
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            ...structuredConfig,
            ...(abortSignal ? { abortSignal } : {}),
          },
        });
      } catch (innerErr) {
        if (isStructuredSchemaUnsupportedError(innerErr)) {
          const fallbackSignal =
            typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
              ? AbortSignal.timeout(attemptTimeoutMs)
              : undefined;
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: `${systemInstruction}\nBalas langsung dalam teks bahasa Indonesia yang hangat dan singkat (tanpa format JSON).`,
              ...(fallbackSignal ? { abortSignal: fallbackSignal } : {}),
            },
          });
        } else {
          throw innerErr;
        }
      }

      const rawText = (response.text || '').trim();
      const parsed = parseMiniOktafApiResult(rawText);
      const cleanReply = (parsed.reply || '').trim();
      if (!cleanReply) {
        return {
          status: 502,
          json: {
            ok: false,
            code: 'AI_EMPTY_REPLY',
            error: 'Mini Oktaf sempat terdiam dan belum mengirim balasan. Coba kirim ulang ya.',
          },
        };
      }

      return {
        status: 200,
        json: {
          ok: true,
          reply: cleanReply,
          pose: sanitizePose(parsed.pose, 'waving'),
          expression: sanitizeExpression(parsed.expression, 'happy'),
        },
      };
    } catch (err) {
      lastError = err;
      // Fall back to alternate non-deprecated Flash model on 404 or transient upstream stall/5xx
      if (isRetryableModelFailure(err) && i < modelsToTry.length - 1) {
        continue;
      }
      break;
    }
  }

  const info = getUpstreamErrorInfo(lastError);
  console.error('Mini Oktaf Gemini error:', info.status || 'unknown', info.message);

  if (info.status === 429) {
    return {
      status: 429,
      json: {
        ok: false,
        code: 'AI_RATE_LIMITED',
        error: 'Mini Oktaf lagi banyak diajak ngobrol nih. Tunggu beberapa detik lalu coba lagi ya.',
      },
    };
  }

  if (info.isApiKeyError) {
    return {
      status: 502,
      json: {
        ok: false,
        code: 'AI_PERMISSION_DENIED',
        error:
          'Layanan AI Mini Oktaf menolak otorisasi server saat ini. Pastikan GEMINI_API_KEY di environment aktif dan memiliki akses Gemini API.',
      },
    };
  }

  return {
    status: 502,
    json: {
      ok: false,
      code: 'AI_REQUEST_FAILED',
      error:
        'Mini Oktaf lagi agak lemot koneksinya sebentar. Coba kirim lagi dalam beberapa detik ya.',
    },
  };
}
