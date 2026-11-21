import test from 'node:test';
import assert from 'node:assert/strict';
import { processMiniOktafChatRequest } from './miniOktafService.ts';

test('processMiniOktafChatRequest rejects missing or placeholder API keys with 503', async () => {
  const missing = await processMiniOktafChatRequest({
    apiKey: undefined,
    body: { messages: [{ role: 'user', text: 'Halo' }] },
  });
  assert.equal(missing.status, 503);
  assert.equal(missing.json.ok, false);
  if (!missing.json.ok) assert.equal(missing.json.code, 'AI_NOT_CONFIGURED');

  const placeholder = await processMiniOktafChatRequest({
    apiKey: 'MY_GEMINI_API_KEY',
    body: { messages: [{ role: 'user', text: 'Halo' }] },
  });
  assert.equal(placeholder.status, 503);
});

test('processMiniOktafChatRequest calls gemini-4-hydrogen first and falls back on 404 model-not-found', async () => {
  const triedModels: string[] = [];

  const okPrimary = await processMiniOktafChatRequest({
    apiKey: 'test-key',
    body: {
      messages: [{ role: 'user', text: 'Kasih petunjuk Secret Quest 2' }],
      currentChapter: 'story',
      quest2Step: 1,
    },
    aiClientFactory: () => ({
      models: {
        async generateContent(params) {
          triedModels.push(String(params.model));
          return {
            text: JSON.stringify({
              reply: 'Coba ingat kalimat janji jalan jauh berkeliling tempat ya ♡',
              pose: 'curious',
              expression: 'wink',
            }),
          };
        },
      },
    }),
  });

  assert.equal(okPrimary.status, 200);
  assert.deepEqual(triedModels, ['gemini-4-hydrogen']);
  if (okPrimary.json.ok) {
    assert.equal(okPrimary.json.pose, 'curious');
    assert.equal(okPrimary.json.expression, 'wink');
  }

  const fallbackModels: string[] = [];
  const okFallback = await processMiniOktafChatRequest({
    apiKey: 'test-key',
    body: { messages: [{ role: 'user', text: 'Halo!' }] },
    aiClientFactory: () => ({
      models: {
        async generateContent(params) {
          const model = String(params.model);
          fallbackModels.push(model);
          if (model === 'gemini-4-hydrogen') {
            throw Object.assign(new Error('models/gemini-4-hydrogen is not found'), { status: 404 });
          }
          return {
            text: JSON.stringify({
              reply: 'Hai Wulan! Ada yang bisa aku bantu?',
              pose: 'waving',
              expression: 'happy',
            }),
          };
        },
      },
    }),
  });

  assert.equal(okFallback.status, 200);
  assert.deepEqual(fallbackModels, ['gemini-4-hydrogen', 'gemini-3.1-flash-lite']);
});

test('processMiniOktafChatRequest handles schema fallback, empty replies, 429 rate limits, and 403 errors honestly', async () => {
  let plainTextAttempted = false;
  const schemaFallback = await processMiniOktafChatRequest({
    apiKey: 'test-key',
    body: { messages: [{ role: 'user', text: 'Hai' }] },
    aiClientFactory: () => ({
      models: {
        async generateContent(params) {
          const cfg = params.config as { responseMimeType?: string } | undefined;
          if (cfg?.responseMimeType === 'application/json') {
            throw Object.assign(new Error('INVALID_ARGUMENT: response_mime_type unsupported'), {
              status: 400,
            });
          }
          plainTextAttempted = true;
          return { text: 'Hai Wulan, semangat terus ya ♡' };
        },
      },
    }),
  });
  assert.equal(plainTextAttempted, true);
  assert.equal(schemaFallback.status, 200);

  const emptyRes = await processMiniOktafChatRequest({
    apiKey: 'test-key',
    body: { messages: [{ role: 'user', text: 'Hai' }] },
    aiClientFactory: () => ({
      models: {
        async generateContent() {
          return { text: JSON.stringify({ reply: '   ', pose: 'waving', expression: 'happy' }) };
        },
      },
    }),
  });
  assert.equal(emptyRes.status, 502);
  if (!emptyRes.json.ok) assert.equal(emptyRes.json.code, 'AI_EMPTY_REPLY');

  const rateLimited = await processMiniOktafChatRequest({
    apiKey: 'test-key',
    body: { messages: [{ role: 'user', text: 'Hai' }] },
    aiClientFactory: () => ({
      models: {
        async generateContent() {
          throw Object.assign(new Error('RESOURCE_EXHAUSTED: quota exceeded'), { status: 429 });
        },
      },
    }),
  });
  assert.equal(rateLimited.status, 429);
  if (!rateLimited.json.ok) assert.equal(rateLimited.json.code, 'AI_RATE_LIMITED');

  const forbidden = await processMiniOktafChatRequest({
    apiKey: 'test-key',
    body: { messages: [{ role: 'user', text: 'Hai' }] },
    aiClientFactory: () => ({
      models: {
        async generateContent() {
          throw Object.assign(new Error('PERMISSION_DENIED'), { status: 403 });
        },
      },
    }),
  });
  assert.equal(forbidden.status, 502);
  if (!forbidden.json.ok) assert.equal(forbidden.json.code, 'AI_PERMISSION_DENIED');

  const invalidKey400 = await processMiniOktafChatRequest({
    apiKey: 'bad-key',
    body: { messages: [{ role: 'user', text: 'Hai' }] },
    aiClientFactory: () => ({
      models: {
        async generateContent() {
          throw Object.assign(
            new Error('{"error":{"code":400,"message":"API key not valid.","status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}'),
            { status: 400 }
          );
        },
      },
    }),
  });
  assert.equal(invalidKey400.status, 502);
  if (!invalidKey400.json.ok) assert.equal(invalidKey400.json.code, 'AI_PERMISSION_DENIED');

  const transientFallbackModels: string[] = [];
  const transientRecovered = await processMiniOktafChatRequest({
    apiKey: 'test-key',
    body: { messages: [{ role: 'user', text: 'Kasih petunjuk Secret Quest 2 ya' }] },
    aiClientFactory: () => ({
      models: {
        async generateContent(params) {
          const model = String(params.model);
          transientFallbackModels.push(model);
          if (model === 'gemini-4-hydrogen') {
            const timeoutErr = new Error('The operation timed out');
            timeoutErr.name = 'TimeoutError';
            throw timeoutErr;
          }
          return {
            text: JSON.stringify({
              reply: 'Ingat bulan Mei 2026 ya Wulan ♡',
              pose: 'curious',
              expression: 'wink',
            }),
          };
        },
      },
    }),
  });
  assert.equal(transientRecovered.status, 200);
  assert.deepEqual(transientFallbackModels, ['gemini-4-hydrogen', 'gemini-3.1-flash-lite']);
});
