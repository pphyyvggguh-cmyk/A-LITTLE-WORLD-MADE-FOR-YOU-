import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SECRET_NOTES, HIDDEN_MESSAGES } from '../data/hiddenMessages.ts';
import {
  createDraftSecretNote,
  getEnabledSecretNotesForPage,
  normalizeSecretNote,
  sortSecretNotes,
  validateSecretNoteInput,
} from './secretNotes.ts';

test('migrated DEFAULT_SECRET_NOTES preserves all 6 original hidden envelopes', () => {
  assert.equal(DEFAULT_SECRET_NOTES.length, 6);
  assert.deepEqual(
    DEFAULT_SECRET_NOTES.map((n) => n.pageNumber),
    [6, 8, 11, 14, 16, 17]
  );
  assert.ok(HIDDEN_MESSAGES['env-page-06'].message.includes('hari-hari biasa'));
  assert.ok(HIDDEN_MESSAGES['env-page-17'].signature.includes('still being written'));
});

test('validateSecretNoteInput enforces required fields and 1..17 page bounds', () => {
  const valid = validateSecretNoteInput({
    id: 'note-hal-03',
    title: 'Catatan Halaman 3',
    recipient: 'Untuk Wulan,',
    message: 'Terima kasih sudah tersenyum hari ini.',
    signature: 'Oktaf ♡',
    pageNumber: 3,
    enabled: true,
    sealColor: '#455342',
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.normalized.pageNumber, 3);
    assert.equal(valid.normalized.greeting, 'Untuk Wulan,');
    assert.equal(valid.normalized.label, 'Catatan Halaman 3');
  }

  const badPage = validateSecretNoteInput({
    title: 'Test',
    recipient: 'Wulan',
    message: 'Hello',
    signature: 'Oktaf',
    pageNumber: 18,
    enabled: true,
  });
  assert.equal(badPage.ok, false);

  const emptyMessage = validateSecretNoteInput({
    title: 'Test',
    recipient: 'Wulan',
    message: '   ',
    signature: 'Oktaf',
    pageNumber: 5,
    enabled: true,
  });
  assert.equal(emptyMessage.ok, false);
});

test('getEnabledSecretNotesForPage returns only enabled notes for the target page', () => {
  const notes = [
    ...DEFAULT_SECRET_NOTES,
    normalizeSecretNote({
      id: 'disabled-page-06',
      title: 'Draft Rahasia',
      recipient: 'Wulan',
      message: 'Jangan tampilkan dulu',
      signature: 'Oktaf',
      pageNumber: 6,
      enabled: false,
    }),
    normalizeSecretNote({
      id: 'extra-page-06',
      title: 'Catatan Tambahan',
      recipient: 'Wulan',
      message: 'Bonus catatan aktif di halaman 6',
      signature: 'Oktaf',
      pageNumber: 6,
      enabled: true,
    }),
  ];

  const page6Notes = getEnabledSecretNotesForPage(notes, 6);
  assert.equal(page6Notes.length, 2);
  assert.equal(page6Notes.some((n) => n.id === 'disabled-page-06'), false);
  assert.equal(getEnabledSecretNotesForPage(notes, 1).length, 0);
});

test('sortSecretNotes orders by pageNumber ascending and createDraftSecretNote clamps pages', () => {
  const draftLow = createDraftSecretNote(0);
  const draftHigh = createDraftSecretNote(99);
  assert.equal(draftLow.pageNumber, 1);
  assert.equal(draftHigh.pageNumber, 17);

  const sorted = sortSecretNotes([draftHigh, draftLow]);
  assert.equal(sorted[0].pageNumber, 1);
  assert.equal(sorted[1].pageNumber, 17);
});
