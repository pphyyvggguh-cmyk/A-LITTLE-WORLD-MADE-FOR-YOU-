import test from 'node:test';
import assert from 'node:assert/strict';
import { PostcardEnvelope } from '../data/postcards.ts';
import {
  canDeletePostcard,
  canEditPostcard,
  canOpenPostcard,
  canReadPostcardEnvelope,
  canReadPostcardSecret,
  classifyPostcardBucket,
  formatCountdownLabel,
  isPostcardUnlocked,
  normalizePostcardOrder,
  validatePostcardInput,
} from './postcards.ts';

const basePostcards: PostcardEnvelope[] = [
  {
    id: 'pc-future-wulan',
    title: 'Untuk Wulan di Ulang Tahun ke-27',
    senderUid: 'uid-oktaf',
    senderEmail: 'oktafmbul0@gmail.com',
    senderRole: 'oktaf',
    senderName: 'Oktaf',
    recipient: 'wulan',
    visibility: 'private',
    unlockAt: '2027-04-02T00:00:00Z',
    unlockDateLabel: '2 April 2027',
    createdDateLabel: '2 April 2026',
    location: 'Bandung',
    stampStyle: 'wax_heart',
    designTheme: 'rose_parchment',
    isOpened: false,
    order: 2,
    allowedEmails: ['oktafmbul0@gmail.com', 'wulan.lover@gmail.com'],
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-02T00:00:00Z',
  },
  {
    id: 'pc-ready-both',
    title: 'Surat Musim Semi Pertama Kita',
    senderUid: 'uid-oktaf',
    senderEmail: 'oktafmbul0@gmail.com',
    senderRole: 'oktaf',
    senderName: 'Oktaf',
    recipient: 'both',
    visibility: 'public',
    unlockAt: '2026-05-01T00:00:00Z',
    unlockDateLabel: '1 Mei 2026',
    createdDateLabel: '2 April 2026',
    location: 'Kyoto',
    stampStyle: 'cherry_blossom',
    designTheme: 'vintage_cream',
    isOpened: false,
    order: 1,
    allowedEmails: ['oktafmbul0@gmail.com', 'wulan.lover@gmail.com'],
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-02T00:00:00Z',
  },
  {
    id: 'pc-surprise-for-oktaf',
    title: 'Rahasia Wulan untuk Oktaf',
    senderUid: 'uid-wulan',
    senderEmail: 'wulan.lover@gmail.com',
    senderRole: 'wulan',
    senderName: 'Wulan',
    recipient: 'oktaf',
    visibility: 'private',
    unlockAt: '2027-08-17T00:00:00Z',
    unlockDateLabel: '17 Agustus 2027',
    createdDateLabel: '3 April 2026',
    location: 'Yogyakarta',
    stampStyle: 'future_mail',
    designTheme: 'botanical_sage',
    isOpened: false,
    order: 3,
    allowedEmails: ['oktafmbul0@gmail.com', 'wulan.lover@gmail.com'],
    createdAt: '2026-04-03T00:00:00Z',
    updatedAt: '2026-04-03T00:00:00Z',
  },
];

test('time-lock checks classify buckets accurately against trusted server time', () => {
  const beforeMay2026 = Date.parse('2026-04-15T12:00:00Z');
  const afterMay2026 = Date.parse('2026-06-01T12:00:00Z');
  const afterApril2027 = Date.parse('2027-04-05T00:00:00Z');

  assert.equal(isPostcardUnlocked(basePostcards[0].unlockAt, afterMay2026), false);
  assert.equal(isPostcardUnlocked(basePostcards[0].unlockAt, afterApril2027), true);

  assert.equal(classifyPostcardBucket(basePostcards[0], afterMay2026), 'waiting');
  assert.equal(classifyPostcardBucket(basePostcards[1], beforeMay2026), 'waiting');
  assert.equal(classifyPostcardBucket(basePostcards[1], afterMay2026), 'ready');
  assert.equal(
    classifyPostcardBucket({ ...basePostcards[1], isOpened: true }, afterMay2026),
    'opened'
  );
  assert.equal(formatCountdownLabel(basePostcards[1].unlockAt, afterMay2026), 'Siap dibuka sekarang ♡');
});

test('secret message access strictly blocks recipients before unlockAt — even when recipient is Admin', () => {
  const june2026 = Date.parse('2026-06-01T00:00:00Z');

  // Public visitor can read public envelope metadata always, but secret only after unlockAt
  assert.equal(canReadPostcardEnvelope(basePostcards[1], null, null), true);
  assert.equal(canReadPostcardEnvelope(basePostcards[0], null, null), false);
  assert.equal(
    canReadPostcardSecret(basePostcards[1], null, null, Date.parse('2026-04-15T00:00:00Z')),
    false
  );
  assert.equal(canReadPostcardSecret(basePostcards[1], null, null, june2026), true);

  // Wulan cannot read postcard addressed to her before unlockAt
  assert.equal(
    canReadPostcardSecret(basePostcards[0], 'wulan.lover@gmail.com', 'wulan', june2026),
    false
  );
  assert.equal(
    canOpenPostcard(basePostcards[0], 'wulan.lover@gmail.com', 'wulan', june2026),
    false
  );

  // Wulan CAN read & open after unlockAt arrives
  const april2027 = Date.parse('2027-04-03T00:00:00Z');
  assert.equal(
    canReadPostcardSecret(basePostcards[0], 'wulan.lover@gmail.com', 'wulan', april2027),
    true
  );
  assert.equal(
    canOpenPostcard(basePostcards[0], 'wulan.lover@gmail.com', 'wulan', april2027),
    true
  );

  // Even Oktaf (Admin) CANNOT peek at Wulan's locked surprise for him before unlockAt
  assert.equal(
    canReadPostcardSecret(basePostcards[2], 'oktafmbul0@gmail.com', 'oktaf', june2026),
    false
  );
  // Wulan (author) can inspect her own draft before unlockAt
  assert.equal(
    canReadPostcardSecret(basePostcards[2], 'wulan.lover@gmail.com', 'wulan', june2026),
    true
  );
});

test('edit/delete permissions, ordering normalization, and validation work as expected', () => {
  assert.equal(canEditPostcard(basePostcards[0], 'wulan.lover@gmail.com', 'wulan'), false);
  assert.equal(canEditPostcard(basePostcards[2], 'wulan.lover@gmail.com', 'wulan'), true);
  assert.equal(canDeletePostcard(basePostcards[0], 'oktafmbul0@gmail.com', 'oktaf'), true);

  const ordered = normalizePostcardOrder(basePostcards);
  assert.deepEqual(
    ordered.map((p) => [p.id, p.order]),
    [
      ['pc-ready-both', 1],
      ['pc-future-wulan', 2],
      ['pc-surprise-for-oktaf', 3],
    ]
  );

  assert.equal(
    validatePostcardInput({
      title: 'Hello Future',
      recipient: 'wulan',
      visibility: 'private',
      unlockAtIso: '2028-04-02T00:00:00Z',
      message: 'Keep smiling ♡',
      stampStyle: 'par_avion',
      designTheme: 'vintage_cream',
    }).ok,
    true
  );

  assert.equal(
    validatePostcardInput({
      title: 'Bad Date',
      recipient: 'wulan',
      visibility: 'private',
      unlockAtIso: 'not-a-date',
      message: 'Hello',
      stampStyle: 'par_avion',
      designTheme: 'vintage_cream',
    }).ok,
    false
  );
});
