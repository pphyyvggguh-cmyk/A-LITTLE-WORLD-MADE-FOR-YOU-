import {
  AccessConfig,
  CanonicalWishlistVisibility,
  PRIMARY_ADMIN_EMAIL,
  WishlistCategory,
  WishlistEntry,
  WishlistStatus,
  WishlistVisibility,
  normalizeWishlistVisibility,
} from '../data/wishlist.ts';

export function normalizeEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase();
}

export function isAuthorizedAdminEmail(
  email: string | null | undefined,
  emailVerified = true
): boolean {
  if (!emailVerified) return false;
  return normalizeEmail(email) === PRIMARY_ADMIN_EMAIL;
}

export function resolveCoupleRole(
  email: string | null | undefined,
  config: Pick<AccessConfig, 'oktafEmail' | 'wulanEmail' | 'wishlistPrivacyMode'>,
  emailVerified = true
): 'oktaf' | 'wulan' | null {
  if (!emailVerified) return null;
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (normalized === normalizeEmail(config.oktafEmail) || normalized === PRIMARY_ADMIN_EMAIL) {
    return 'oktaf';
  }

  if (
    config.wishlistPrivacyMode === 'couple-only' &&
    normalizeEmail(config.wulanEmail) &&
    normalized === normalizeEmail(config.wulanEmail)
  ) {
    return 'wulan';
  }

  return null;
}

export function buildAllowedEmailsList(
  config: Pick<AccessConfig, 'oktafEmail' | 'wulanEmail'>
): string[] {
  const list = new Set<string>([PRIMARY_ADMIN_EMAIL]);
  const oktaf = normalizeEmail(config.oktafEmail);
  const wulan = normalizeEmail(config.wulanEmail);
  if (oktaf) list.add(oktaf);
  if (wulan) list.add(wulan);
  return Array.from(list).slice(0, 4);
}

export function canViewWishlistEntry(
  entry: Pick<WishlistEntry, 'visibility' | 'allowedEmails'>,
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null
): boolean {
  const canonical = normalizeWishlistVisibility(entry.visibility);
  if (canonical === 'public') return true;
  if (!role) return false;
  if (role === 'oktaf') return true;
  const normalized = normalizeEmail(userEmail);
  return entry.allowedEmails.map((e) => normalizeEmail(e)).includes(normalized);
}

export function canEditWishlistEntry(
  entry: Pick<WishlistEntry, 'creatorEmail' | 'category' | 'status' | 'visibility'>,
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null
): boolean {
  if (!role) return false;
  if (role === 'oktaf') return true;
  const normalized = normalizeEmail(userEmail);
  const canonical = normalizeWishlistVisibility(entry.visibility);
  return (
    normalizeEmail(entry.creatorEmail) === normalized ||
    entry.category === 'our' ||
    canonical === 'shared'
  );
}

export function canDeleteWishlistEntry(
  entry: Pick<WishlistEntry, 'creatorEmail' | 'category' | 'visibility'>,
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null
): boolean {
  if (!role) return false;
  if (role === 'oktaf') return true;
  const normalized = normalizeEmail(userEmail);
  const canonical = normalizeWishlistVisibility(entry.visibility);
  return (
    normalizeEmail(entry.creatorEmail) === normalized ||
    entry.category === 'our' ||
    canonical === 'shared'
  );
}

export function filterWishlistEntries(
  entries: WishlistEntry[],
  category: WishlistCategory | 'all',
  status: WishlistStatus | 'all',
  options?: {
    visibility?: CanonicalWishlistVisibility | 'all';
    creatorRole?: 'oktaf' | 'wulan' | 'all';
  }
): WishlistEntry[] {
  const visFilter = options?.visibility ?? 'all';
  const creatorFilter = options?.creatorRole ?? 'all';

  return entries.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (status !== 'all' && item.status !== status) return false;
    if (visFilter !== 'all' && normalizeWishlistVisibility(item.visibility) !== visFilter) {
      return false;
    }
    if (creatorFilter !== 'all' && item.creatorRole !== creatorFilter) {
      return false;
    }
    return true;
  });
}

export function validateWishlistFormInput(input: {
  title: string;
  description: string;
  category: WishlistCategory;
  targetDate?: string;
  status: WishlistStatus;
  photos: string[];
  completionStory: string;
  visibility?: WishlistVisibility;
}): { ok: true } | { ok: false; error: string } {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: 'Judul impian wajib diisi.' };
  }
  if (title.length > 160) {
    return { ok: false, error: 'Judul impian maksimal 160 karakter.' };
  }
  if (input.description.trim().length > 2000) {
    return { ok: false, error: 'Deskripsi/catatan maksimal 2000 karakter.' };
  }
  if ((input.targetDate || '').trim().length > 40) {
    return { ok: false, error: 'Target tanggal maksimal 40 karakter.' };
  }
  if (!['your', 'her', 'our'].includes(input.category)) {
    return { ok: false, error: 'Kategori impian tidak valid.' };
  }
  if (!['dreaming', 'planned', 'in_progress', 'completed'].includes(input.status)) {
    return { ok: false, error: 'Status impian tidak valid.' };
  }
  if (
    input.visibility !== undefined &&
    !['public', 'private', 'shared', 'couple'].includes(input.visibility)
  ) {
    return { ok: false, error: 'Pengaturan visibilitas tidak valid.' };
  }
  if (input.photos.length > 6) {
    return { ok: false, error: 'Maksimal 6 foto kenangan per kartu impian.' };
  }
  if (input.completionStory.trim().length > 3000) {
    return { ok: false, error: 'Cerita pencapaian maksimal 3000 karakter.' };
  }
  return { ok: true };
}
