import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMiniOktafSystemInstruction,
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

test('buildMiniOktafSystemInstruction provides chapter awareness, progressive clues, and completion celebration', () => {
  const firstHintPrompt = buildMiniOktafSystemInstruction(
    {
      currentChapter: 'story',
      collectedFlowerCount: 2,
      quest2Step: 0,
      quest2Completed: false,
      collectedPolaroidCount: 1,
      collectedPolaroidIds: ['polaroid-story'],
    },
    [{ role: 'user', text: 'Mini Oktaf, kasih petunjuk polaroid dong' }]
  );
  assert.match(firstHintPrompt, /Bab 01: Our Story/);
  assert.match(firstHintPrompt, /1\/5 Polaroid/);
  assert.match(firstHintPrompt, /JANGAN pernah membocorkan semua lokasi 5 Polaroid sekaligus/);
  assert.match(firstHintPrompt, /Bab 03 \(Birthday Letters\)/);
  assert.match(firstHintPrompt, /Jangan langsung menuliskan jawaban lengkap "02-05-2026"/);

  const followUpPrompt = buildMiniOktafSystemInstruction(
    {
      currentChapter: 'postcards',
      collectedFlowerCount: 7,
      quest2Step: 3,
      quest2Completed: true,
      collectedPolaroidCount: 5,
      collectedPolaroidIds: [
        'polaroid-story',
        'polaroid-letters',
        'polaroid-voices',
        'polaroid-wishlist',
        'polaroid-postcards',
      ],
    },
    [
      { role: 'user', text: 'Kasih hint quest dong' },
      { role: 'assistant', text: 'Coba cek perlahan ya' },
      { role: 'user', text: 'Masih bingung, kasih clue lagi' },
    ]
  );
  assert.match(followUpPrompt, /Sudah lengkap 7\/7/);
  assert.match(followUpPrompt, /Quest 2 \(Three Little Questions\): SUDAH SELESAI \(3\/3\)/);
  assert.match(followUpPrompt, /Quest 3 \(Find the Polaroids\): SUDAH SELESAI \(5\/5\)/);
});

test('requestMiniOktafChatReply handles timeouts, HTML 404 responses, and empty replies safely', async () => {
  await assert.rejects(
    () =>
      requestMiniOktafChatReply({
        messages: [{ id: '1', role: 'user', text: 'Halo', createdAt: '2026-01-01T00:00:00Z' }],
        currentChapter: 'hub',
        collectedFlowerCount: 0,
        fetchImpl: (async () => {
          const abortErr = new Error('The operation was aborted');
          abortErr.name = 'AbortError';
          throw abortErr;
        }) as typeof fetch,
      }),
    /kehabisan waktu/
  );

  await assert.rejects(
    () =>
      requestMiniOktafChatReply({
        messages: [{ id: '1', role: 'user', text: 'Halo', createdAt: '2026-01-01T00:00:00Z' }],
        currentChapter: 'hub',
        collectedFlowerCount: 0,
        fetchImpl: (async () =>
          new Response('<!doctype html><html><body>404</body></html>', {
            status: 404,
            headers: { 'Content-Type': 'text/html' },
          })) as typeof fetch,
      }),
    /HTTP 404/
  );

  await assert.rejects(
    () =>
      requestMiniOktafChatReply({
        messages: [{ id: '1', role: 'user', text: 'Halo', createdAt: '2026-01-01T00:00:00Z' }],
        currentChapter: 'hub',
        collectedFlowerCount: 0,
        fetchImpl: (async () =>
          new Response(
            JSON.stringify({ ok: true, reply: '   ', pose: 'waving', expression: 'happy' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )) as typeof fetch,
      }),
    /belum mengirim balasan/
  );
});
