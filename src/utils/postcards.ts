import {
  PostcardBucket,
  PostcardDesignTheme,
  PostcardEnvelope,
  PostcardRecipient,
  PostcardStampStyle,
  PostcardVisibility,
} from '../data/postcards.ts';
import { normalizeEmail } from './wishlist.ts';

export function parseUnlockAtMs(unlockAtIso: string | undefined | null): number {
  if (!unlockAtIso) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(unlockAtIso);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function isPostcardUnlocked(
  unlockAtIso: string | undefined | null,
  trustedNowMs: number
): boolean {
  const unlockMs = parseUnlockAtMs(unlockAtIso);
  if (!Number.isFinite(unlockMs)) return false;
  return trustedNowMs >= unlockMs;
}

export function classifyPostcardBucket(
  postcard: Pick<PostcardEnvelope, 'unlockAt' | 'isOpened'>,
  trustedNowMs: number
): PostcardBucket {
  const unlocked = isPostcardUnlocked(postcard.unlockAt, trustedNowMs);
  if (!unlocked) return 'waiting';
  if (postcard.isOpened) return 'opened';
  return 'ready';
}

export function recipientMatchesRole(
  recipient: PostcardRecipient,
  role: 'oktaf' | 'wulan' | null
): boolean {
  if (!role) return false;
  if (recipient === 'both') return true;
  return recipient === role;
}

export function canReadPostcardEnvelope(
  postcard: Pick<PostcardEnvelope, 'visibility' | 'allowedEmails' | 'senderEmail'>,
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null
): boolean {
  if (postcard.visibility === 'public') return true;
  if (!role) return false;
  if (role === 'oktaf') return true;
  const normalized = normalizeEmail(userEmail);
  return (
    normalizeEmail(postcard.senderEmail) === normalized ||
    postcard.allowedEmails.map((e) => normalizeEmail(e)).includes(normalized)
  );
}

/**
 * Pure mirror of the Firestore security invariant on `/postcards/{id}/secret/content`:
 * - Locked postcards (`trustedNowMs < unlockAt`) NEVER expose content to recipients or visitors.
 * - Even if Oktaf is Admin, if Wulan wrote a locked surprise for `recipient: 'oktaf'`,
 *   Oktaf cannot read her secret content before `unlockAt`.
 * - Authors may inspect/edit their own draft before unlock.
 */
export function canReadPostcardSecret(
  postcard: Pick<
    PostcardEnvelope,
    'visibility' | 'recipient' | 'unlockAt' | 'allowedEmails' | 'senderEmail'
  >,
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null,
  trustedNowMs: number
): boolean {
  const unlocked = isPostcardUnlocked(postcard.unlockAt, trustedNowMs);
  const normalized = normalizeEmail(userEmail);
  const isSender = Boolean(normalized && normalizeEmail(postcard.senderEmail) === normalized);

  if (!unlocked) {
    if (isSender) return true;
    if (role === 'oktaf' && postcard.recipient !== 'oktaf') {
      // Oktaf (admin) may preview postcards authored or managed when not a surprise locked for him
      return true;
    }
    return false;
  }

  if (postcard.visibility === 'public') return true;
  if (!role) return false;
  if (isSender || role === 'oktaf') return true;
  return postcard.allowedEmails.map((e) => normalizeEmail(e)).includes(normalized);
}

export function canOpenPostcard(
  postcard: Pick<
    PostcardEnvelope,
    'visibility' | 'recipient' | 'unlockAt' | 'allowedEmails' | 'senderEmail'
  >,
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null,
  trustedNowMs: number
): boolean {
  if (!isPostcardUnlocked(postcard.unlockAt, trustedNowMs)) return false;
  if (postcard.visibility === 'public') return true;
  if (!role) return false;
  const normalized = normalizeEmail(userEmail);
  if (!postcard.allowedEmails.map((e) => normalizeEmail(e)).includes(normalized) && role !== 'oktaf') {
    return false;
  }
  return recipientMatchesRole(postcard.recipient, role) || role === 'oktaf';
}

export function canEditPostcard(
  postcard: Pick<PostcardEnvelope, 'senderEmail' | 'visibility'>,
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null
): boolean {
  if (!role) return false;
  if (role === 'oktaf') return true;
  const normalized = normalizeEmail(userEmail);
  return normalizeEmail(postcard.senderEmail) === normalized || postcard.visibility === 'shared';
}

export function canDeletePostcard(
  postcard: Pick<PostcardEnvelope, 'senderEmail' | 'visibility'>,
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null
): boolean {
  if (!role) return false;
  if (role === 'oktaf') return true;
  const normalized = normalizeEmail(userEmail);
  return normalizeEmail(postcard.senderEmail) === normalized || postcard.visibility === 'shared';
}

export function normalizePostcardOrder(
  entries: PostcardEnvelope[]
): PostcardEnvelope[] {
  return [...entries]
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return parseUnlockAtMs(a.unlockAt) - parseUnlockAtMs(b.unlockAt);
    })
    .map((entry, idx) => ({
      ...entry,
      order: idx + 1,
    }));
}

export function formatCountdownLabel(unlockAtIso: string, trustedNowMs: number): string {
  const unlockMs = parseUnlockAtMs(unlockAtIso);
  if (!Number.isFinite(unlockMs)) return 'Tanggal buka belum ditentukan';
  const diff = unlockMs - trustedNowMs;
  if (diff <= 0) return 'Siap dibuka sekarang ♡';

  const totalMinutes = Math.ceil(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;

  if (days > 0) {
    return `Terbuka dalam ${days} hari ${hours} jam`;
  }
  if (hours > 0) {
    return `Terbuka dalam ${hours} jam ${mins} menit`;
  }
  return `Terbuka dalam ${Math.max(1, mins)} menit`;
}

export function formatUnlockDateIndonesian(unlockAtIso: string): string {
  const ms = parseUnlockAtMs(unlockAtIso);
  if (!Number.isFinite(ms)) return unlockAtIso || '';
  return new Date(ms).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function validatePostcardInput(input: {
  title: string;
  recipient: PostcardRecipient;
  visibility: PostcardVisibility;
  unlockAtIso: string;
  message: string;
  photoUrl?: string;
  location?: string;
  stampStyle: PostcardStampStyle;
  designTheme: PostcardDesignTheme;
}): { ok: true } | { ok: false; error: string } {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: 'Judul kartu pos wajib diisi.' };
  }
  if (title.length > 160) {
    return { ok: false, error: 'Judul kartu pos maksimal 160 karakter.' };
  }
  if (!['oktaf', 'wulan', 'both'].includes(input.recipient)) {
    return { ok: false, error: 'Penerima kartu pos tidak valid.' };
  }
  if (!['public', 'private', 'shared'].includes(input.visibility)) {
    return { ok: false, error: 'Visibilitas kartu pos tidak valid.' };
  }
  const unlockMs = parseUnlockAtMs(input.unlockAtIso);
  if (!Number.isFinite(unlockMs)) {
    return { ok: false, error: 'Tanggal & waktu buka kartu pos wajib valid.' };
  }
  const message = input.message.trim();
  if (!message) {
    return { ok: false, error: 'Pesan tulisan tangan pada kartu pos wajib diisi.' };
  }
  if (message.length > 4000) {
    return { ok: false, error: 'Pesan kartu pos maksimal 4000 karakter.' };
  }
  if ((input.photoUrl || '').trim().length > 1000) {
    return { ok: false, error: 'URL foto terlalu panjang.' };
  }
  if ((input.location || '').trim().length > 120) {
    return { ok: false, error: 'Lokasi maksimal 120 karakter.' };
  }
  if (!['par_avion', 'future_mail', 'wax_heart', 'cherry_blossom'].includes(input.stampStyle)) {
    return { ok: false, error: 'Gaya perangko tidak valid.' };
  }
  if (
    !['vintage_cream', 'botanical_sage', 'rose_parchment', 'airmail_classic'].includes(
      input.designTheme
    )
  ) {
    return { ok: false, error: 'Tema desain kartu pos tidak valid.' };
  }
  return { ok: true };
}
