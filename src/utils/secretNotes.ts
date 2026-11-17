import type { StorySecretNote } from '../data/hiddenMessages.ts';

export const SECRET_NOTE_ALLOWED_SEAL_COLORS = new Set([
  '#A6533B',
  '#455342',
  '#743D4A',
  '#C4A574',
]);

export interface SecretNoteValidationInput {
  id?: string;
  title: string;
  recipient: string;
  message: string;
  signature: string;
  pageNumber: number;
  enabled: boolean;
  hint?: string;
  stampText?: string;
  sealColor?: string;
}

export function normalizeSecretNoteId(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return cleaned || `note-${Date.now()}`;
}

export function normalizeSecretNote(raw: Partial<StorySecretNote> & { id: string }): StorySecretNote {
  const title = String(raw.title || raw.label || 'Catatan Rahasia').trim().slice(0, 120) || 'Catatan Rahasia';
  const recipient =
    String(raw.recipient || raw.greeting || 'Untuk Wulan,').trim().slice(0, 120) || 'Untuk Wulan,';
  const message = String(raw.message || '').trim().slice(0, 3000);
  const signature = String(raw.signature || 'Dengan hangat ♡').trim().slice(0, 160) || 'Dengan hangat ♡';
  const pageNumRaw = Number(raw.pageNumber);
  const pageNumber = Number.isInteger(pageNumRaw)
    ? Math.max(1, Math.min(17, pageNumRaw))
    : 1;
  const sealColor = SECRET_NOTE_ALLOWED_SEAL_COLORS.has(String(raw.sealColor || ''))
    ? String(raw.sealColor)
    : '#A6533B';
  const hint = String(raw.hint || 'Ketuk amplop kecil').trim().slice(0, 80) || 'Ketuk amplop kecil';
  const stampText = String(raw.stampText || 'SECRET NOTE').trim().slice(0, 40) || 'SECRET NOTE';

  return {
    id: normalizeSecretNoteId(raw.id),
    title,
    label: title,
    hint,
    recipient,
    greeting: recipient,
    message,
    signature,
    pageNumber,
    enabled: raw.enabled !== false,
    sealColor,
    stampText,
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || '',
  };
}

export function sortSecretNotes(notes: readonly StorySecretNote[]): StorySecretNote[] {
  return [...notes].sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) {
      return a.pageNumber - b.pageNumber;
    }
    return a.title.localeCompare(b.title);
  });
}

export function validateSecretNoteInput(
  input: SecretNoteValidationInput
): { ok: true; normalized: Omit<StorySecretNote, 'createdAt' | 'updatedAt'> } | { ok: false; error: string } {
  const title = String(input.title || '').trim();
  const recipient = String(input.recipient || '').trim();
  const message = String(input.message || '').trim();
  const signature = String(input.signature || '').trim();
  const hint = String(input.hint || 'Ketuk amplop kecil').trim();
  const stampText = String(input.stampText || 'SECRET NOTE').trim();
  const pageNumber = Number(input.pageNumber);

  if (!title) {
    return { ok: false, error: 'Judul Secret Note wajib diisi.' };
  }
  if (title.length > 120) {
    return { ok: false, error: 'Judul Secret Note maksimal 120 karakter.' };
  }
  if (!recipient) {
    return { ok: false, error: 'Nama penerima (Recipient) wajib diisi.' };
  }
  if (recipient.length > 120) {
    return { ok: false, error: 'Nama penerima maksimal 120 karakter.' };
  }
  if (!message) {
    return { ok: false, error: 'Isi pesan Secret Note tidak boleh kosong.' };
  }
  if (message.length > 3000) {
    return { ok: false, error: 'Isi pesan maksimal 3000 karakter.' };
  }
  if (!signature) {
    return { ok: false, error: 'Tanda tangan (Signature) wajib diisi.' };
  }
  if (signature.length > 160) {
    return { ok: false, error: 'Tanda tangan maksimal 160 karakter.' };
  }
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 17) {
    return { ok: false, error: 'Halaman Our Story harus berada antara halaman 1 hingga 17.' };
  }

  const sealColor = SECRET_NOTE_ALLOWED_SEAL_COLORS.has(String(input.sealColor || ''))
    ? String(input.sealColor)
    : '#A6533B';

  const id = normalizeSecretNoteId(input.id || `note-hal-${String(pageNumber).padStart(2, '0')}-${Date.now().toString(36)}`);

  return {
    ok: true,
    normalized: {
      id,
      title,
      label: title,
      hint: hint.slice(0, 80) || 'Ketuk amplop kecil',
      recipient,
      greeting: recipient,
      message,
      signature,
      pageNumber,
      enabled: Boolean(input.enabled),
      sealColor,
      stampText: stampText.slice(0, 40) || 'SECRET NOTE',
    },
  };
}

export function getEnabledSecretNotesForPage(
  notes: readonly StorySecretNote[],
  pageNumber: number
): StorySecretNote[] {
  return notes.filter((note) => note.enabled && note.pageNumber === pageNumber);
}

export function createDraftSecretNote(pageNumber = 1): StorySecretNote {
  const safePage = Number.isInteger(pageNumber) ? Math.max(1, Math.min(17, pageNumber)) : 1;
  const nowIso = new Date().toISOString();
  const title = `Catatan Rahasia · Hal. ${String(safePage).padStart(2, '0')}`;
  return {
    id: `note-hal-${String(safePage).padStart(2, '0')}-${Date.now().toString(36)}`,
    title,
    label: title,
    hint: 'Ketuk amplop kecil',
    recipient: 'Untuk Wulan,',
    greeting: 'Untuk Wulan,',
    message: '',
    signature: 'Dengan hangat ♡',
    pageNumber: safePage,
    enabled: true,
    sealColor: '#A6533B',
    stampText: 'SECRET NOTE',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
