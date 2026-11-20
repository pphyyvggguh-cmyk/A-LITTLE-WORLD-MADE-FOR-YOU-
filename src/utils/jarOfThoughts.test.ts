import test from 'node:test';
import assert from 'node:assert/strict';
import { ANONYMOUS_AUTHOR_LABEL, JarPoolThought, JarThoughtSubmission } from '../data/jarOfThoughts';
import {
  buildSubmissionFingerprint,
  computeCooldownStatus,
  evaluateSubmissionRateLimit,
  formatCooldownCountdown,
  normalizeJarSettings,
  pickRandomUnopenedThought,
  resolveDisplayAuthor,
  sanitizeJarText,
  summarizeJarStats,
  validateJarSubmissionInput,
} from './jarOfThoughts';

test('validateJarSubmissionInput sanitizes text, enforces length bounds, and validates paperStyle', () => {
  const emptyInitial = validateJarSubmissionInput({
    senderInitial: '   ',
    message: 'Semoga hari ini menyenangkan!',
    paperStyle: 'ivory-linen',
    isAnonymous: false,
  });
  assert.equal(emptyInitial.ok, false);

  const tooLongInitial = validateJarSubmissionInput({
    senderInitial: 'ABCDEFGHIJKLM',
    message: 'Pesan singkat buat Wulan',
    paperStyle: 'ivory-linen',
    isAnonymous: false,
  });
  assert.equal(tooLongInitial.ok, false);

  const tooLongMsg = validateJarSubmissionInput({
    senderInitial: 'R.A',
    message: 'a'.repeat(501),
    paperStyle: 'blush-petal',
    isAnonymous: false,
  });
  assert.equal(tooLongMsg.ok, false);

  const invalidStyle = validateJarSubmissionInput({
    senderInitial: 'D.N',
    message: 'Happy birthday!',
    paperStyle: 'neon-cyber',
    isAnonymous: false,
  });
  assert.equal(invalidStyle.ok, false);

  const valid = validateJarSubmissionInput({
    senderInitial: ' <b>A.R</b> ',
    message: 'Selamat ulang tahun Wulan!<script>alert(1)</script>\n\n\nSemoga sehat selalu.',
    paperStyle: 'sage-leaf',
    isAnonymous: true,
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.senderInitial, 'A.R');
    assert.equal(valid.data.message.includes('<script>'), false);
    assert.equal(valid.data.message, 'Selamat ulang tahun Wulan!alert(1)\n\nSemoga sehat selalu.');
    assert.equal(valid.data.paperStyle, 'sage-leaf');
    assert.equal(valid.data.isAnonymous, true);
  }
});

test('resolveDisplayAuthor strictly masks senderInitial behind Someone Special when anonymous', () => {
  assert.equal(
    resolveDisplayAuthor({ senderInitial: 'R.F', isAnonymous: true }),
    ANONYMOUS_AUTHOR_LABEL
  );
  assert.equal(
    resolveDisplayAuthor({ senderInitial: 'R.F', displayAuthor: 'R.F', isAnonymous: true }),
    ANONYMOUS_AUTHOR_LABEL
  );
  assert.equal(
    resolveDisplayAuthor({ senderInitial: 'N.K', isAnonymous: false }),
    'N.K'
  );
});

test('pickRandomUnopenedThought selects only approved unopened thoughts and returns null when empty', () => {
  const samplePool: JarPoolThought[] = [
    {
      id: 't1',
      displayAuthor: 'M.A',
      isAnonymous: false,
      message: 'Sudah dibuka kemarin',
      paperStyle: 'ivory-linen',
      isApproved: true,
      opened: true,
      openedAt: '2026-05-01T10:00:00.000Z',
      sortSeed: 0.2,
      createdAt: '2026-05-01T08:00:00.000Z',
      updatedAt: '2026-05-01T10:00:00.000Z',
    },
    {
      id: 't2',
      displayAuthor: ANONYMOUS_AUTHOR_LABEL,
      isAnonymous: true,
      message: 'Terus bertumbuh pelan-pelan ya',
      paperStyle: 'blush-petal',
      isApproved: true,
      opened: false,
      sortSeed: 0.7,
      createdAt: '2026-05-01T09:00:00.000Z',
      updatedAt: '2026-05-01T09:00:00.000Z',
    },
    {
      id: 't3',
      displayAuthor: 'K.S',
      isAnonymous: false,
      message: 'Jangan lupa istirahat hari ini!',
      paperStyle: 'champagne-gold',
      isApproved: true,
      opened: false,
      sortSeed: 0.4,
      createdAt: '2026-05-01T09:30:00.000Z',
      updatedAt: '2026-05-01T09:30:00.000Z',
    },
  ];

  const pickedFirst = pickRandomUnopenedThought(samplePool, () => 0.1);
  assert.equal(pickedFirst?.id, 't2');

  const pickedSecond = pickRandomUnopenedThought(samplePool, () => 0.9);
  assert.equal(pickedSecond?.id, 't3');

  // Empty or all-opened pool returns null so cooldown is never consumed
  const emptyResult = pickRandomUnopenedThought(
    samplePool.map((item) => ({ ...item, opened: true })),
    () => 0.5
  );
  assert.equal(emptyResult, null);
});

test('computeCooldownStatus enforces exact 24-hour server-time boundary and formats HH:MM:SS', () => {
  const openedAt = Date.UTC(2026, 4, 10, 12, 0, 0);
  const after2Hours = openedAt + 2 * 3600 * 1000;
  const activeCooldown = computeCooldownStatus(openedAt, after2Hours, 24);
  assert.equal(activeCooldown.isCoolingDown, true);
  assert.equal(activeCooldown.hours, 22);
  assert.equal(activeCooldown.formattedCountdown, '22:00:00');

  const exact24Hours = openedAt + 24 * 3600 * 1000;
  const expired = computeCooldownStatus(openedAt, exact24Hours, 24);
  assert.equal(expired.isCoolingDown, false);
  assert.equal(expired.remainingMs, 0);
  assert.equal(expired.formattedCountdown, '00:00:00');

  // Never cooled down when null
  const neverOpened = computeCooldownStatus(null, exact24Hours, 24);
  assert.equal(neverOpened.isCoolingDown, false);

  assert.equal(formatCooldownCountdown(3661_000).formattedCountdown, '01:01:01');
});

test('evaluateSubmissionRateLimit blocks duplicate content and burst spam within sliding window', () => {
  const now = 1_780_000_000_000;
  const fp1 = buildSubmissionFingerprint('R.D', 'Selamat ulang tahun Wulan!', false);

  const r1 = evaluateSubmissionRateLimit(undefined, fp1, now);
  assert.equal(r1.ok, true);
  if (!r1.ok) return;

  // Immediate duplicate rejected
  const dup = evaluateSubmissionRateLimit(r1.nextRecord, fp1, now + 5_000);
  assert.equal(dup.ok, false);
  if (!dup.ok) assert.equal(dup.code, 'DUPLICATE');

  // Burst limit up to max 5 distinct messages
  let state = r1.nextRecord;
  for (let i = 2; i <= 5; i += 1) {
    const fp = buildSubmissionFingerprint(`P${i}`, `Pesan ke-${i} untuk Wulan`, false);
    const step = evaluateSubmissionRateLimit(state, fp, now + i * 1000);
    assert.equal(step.ok, true);
    if (step.ok) state = step.nextRecord;
  }

  const sixth = evaluateSubmissionRateLimit(
    state,
    buildSubmissionFingerprint('P6', 'Pesan ke-6', false),
    now + 6_000
  );
  assert.equal(sixth.ok, false);
  if (!sixth.ok) assert.equal(sixth.code, 'RATE_LIMITED');
});

test('summarizeJarStats and normalizeJarSettings calculate accurate counts and fallbacks', () => {
  const rows: JarThoughtSubmission[] = [
    {
      id: '1',
      senderInitial: 'A',
      isAnonymous: false,
      message: 'msg 1',
      paperStyle: 'ivory-linen',
      status: 'pending',
      opened: false,
      source: 'public',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      senderInitial: 'B',
      isAnonymous: true,
      message: 'msg 2',
      paperStyle: 'blush-petal',
      status: 'approved',
      opened: false,
      source: 'public',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '3',
      senderInitial: 'C',
      isAnonymous: false,
      message: 'msg 3',
      paperStyle: 'sage-leaf',
      status: 'approved',
      opened: true,
      openedAt: '2026-05-01T12:00:00.000Z',
      source: 'admin',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '4',
      senderInitial: 'D',
      isAnonymous: false,
      message: 'msg 4',
      paperStyle: 'burgundy-tint',
      status: 'rejected',
      opened: false,
      source: 'public',
      createdAt: '',
      updatedAt: '',
    },
  ];

  assert.deepEqual(summarizeJarStats(rows), {
    total: 4,
    pending: 1,
    approved: 2,
    rejected: 1,
    opened: 1,
    availableInPool: 1,
  });

  const cfg = normalizeJarSettings({ enabled: false, cooldownHours: 12 });
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.cooldownHours, 12);
  assert.equal(cfg.publicRoute, '#/leave-a-thought');
  assert.equal(sanitizeJarText('  halo\t\tdunia  ', false), 'halo dunia');
});
