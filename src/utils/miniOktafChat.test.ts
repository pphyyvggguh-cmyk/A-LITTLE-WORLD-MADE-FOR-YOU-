import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMiniOktafApiResult,
  requestMiniOktafChatReply,
  trimChatHistory,
  validateUserChatPrompt,
} from './miniOktafChat';

test('validateUserChatPrompt rejects blank or oversized input and trims valid prompts', () => {
  assert.equal(validateUserChatPrompt('   ').ok, false);
  assert.equal(validateUserChatPrompt('a'.repeat(650)).ok, false);
  const res = validateUserChatPrompt('   Hai   Mini Oktaf, ulang tahun Wulan kapan?  ');
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.text, 'Hai Mini Oktaf, ulang tahun Wulan kapan?');
  }
});

test('parseMiniOktafApiResult parses structured JSON and sanitizes unknown poses gracefully', () => {
  const valid = parseMiniOktafApiResult(
    JSON.stringify({
      reply: 'Ulang tahun Wulan tanggal 19 Februari ya ♡',
      pose: 'birthday_cake',
      expression: 'wink',
    })
  );
  assert.equal(valid.reply, 'Ulang tahun Wulan tanggal 19 Februari ya ♡');
  assert.equal(valid.pose, 'birthday_cake');
  assert.equal(valid.expression, 'wink');

  const unknownPose = parseMiniOktafApiResult(
    JSON.stringify({
      reply: 'Halo!',
      pose: 'flying_invalid',
      expression: 'unknown_expr',
    })
  );
  assert.equal(unknownPose.pose, 'waving');
  assert.equal(unknownPose.expression, 'happy');
});

test('trimChatHistory caps conversation length accurately', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({
    id: `m-${i}`,
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    text: `Pesan ke-${i}`,
    createdAt: new Date().toISOString(),
  }));
  const trimmed = trimChatHistory(many);
  assert.equal(trimmed.length, 14);
  assert.equal(trimmed[0].text, 'Pesan ke-6');
});

test('requestMiniOktafChatReply handles real API response and throws honest error when AI is unavailable', async () => {
  const okRes = await requestMiniOktafChatReply({
    messages: [
      { id: '1', role: 'user', text: 'Halo Mini Oktaf!', createdAt: '2026-01-01T00:00:00Z' },
    ],
    currentChapter: 'hub',
    collectedFlowerCount: 2,
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          ok: true,
          reply: 'Hai Wulan! Lagi lihat-lihat halaman awal ya?',
          pose: 'waving',
          expression: 'happy',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )) as typeof fetch,
  });
  assert.equal(okRes.reply, 'Hai Wulan! Lagi lihat-lihat halaman awal ya?');
  assert.equal(okRes.pose, 'waving');

  await assert.rejects(
    () =>
      requestMiniOktafChatReply({
        messages: [
          { id: '1', role: 'user', text: 'Tes', createdAt: '2026-01-01T00:00:00Z' },
        ],
        currentChapter: 'hub',
        collectedFlowerCount: 0,
        fetchImpl: (async () =>
          new Response(
            JSON.stringify({
              ok: false,
              code: 'AI_NOT_CONFIGURED',
              error: 'GEMINI_API_KEY belum tersedia di server.',
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )) as typeof fetch,
      }),
    /GEMINI_API_KEY/
  );
});
