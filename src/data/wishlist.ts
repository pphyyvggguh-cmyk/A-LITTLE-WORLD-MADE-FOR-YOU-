export type WishlistCategory = 'your' | 'her' | 'our';
export type WishlistStatus = 'dreaming' | 'planned' | 'in_progress' | 'completed';
export type WishlistVisibility = 'public' | 'private' | 'shared' | 'couple';
export type CanonicalWishlistVisibility = 'public' | 'private' | 'shared';

export interface WishlistEntry {
  id: string;
  title: string;
  description: string;
  category: WishlistCategory;
  creatorUid: string;
  creatorEmail: string;
  creatorRole: 'oktaf' | 'wulan';
  creatorName: string;
  targetDate?: string;
  status: WishlistStatus;
  photos: string[];
  completionStory: string;
  completedAt?: string;
  allowedEmails: string[];
  visibility: WishlistVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface AccessConfig {
  configId: 'access';
  adminEmail: string;
  oktafEmail: string;
  wulanEmail: string;
  wishlistPrivacyMode: 'couple-only' | 'admin-only';
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const PRIMARY_ADMIN_EMAIL = 'oktafmbul0@gmail.com';
export const PRIMARY_WULAN_EMAIL = 'wulanainindya92@gmail.com';

export const DEFAULT_ACCESS_CONFIG: AccessConfig = {
  configId: 'access',
  adminEmail: PRIMARY_ADMIN_EMAIL,
  oktafEmail: PRIMARY_ADMIN_EMAIL,
  wulanEmail: PRIMARY_WULAN_EMAIL,
  wishlistPrivacyMode: 'couple-only',
};

export function normalizeWishlistVisibility(
  value: unknown
): CanonicalWishlistVisibility {
  if (value === 'public') return 'public';
  if (value === 'shared') return 'shared';
  // Preserve legacy 'couple' entries as private (visible to Oktaf & Wulan)
  return 'private';
}

export const WISHLIST_VISIBILITY_META: Record<
  CanonicalWishlistVisibility,
  { label: string; shortLabel: string; description: string; accent: string }
> = {
  public: {
    label: 'Public (Terbuka)',
    shortLabel: 'Public',
    description: 'Bisa dibaca siapa saja yang membuka halaman ini.',
    accent: '#455342',
  },
  private: {
    label: 'Private (Oktaf & Wulan)',
    shortLabel: 'Private',
    description: 'Hanya dapat dilihat setelah masuk dengan akun Oktaf atau Wulan.',
    accent: '#743D4A',
  },
  shared: {
    label: 'Shared Couple (Kolaborasi Berdua)',
    shortLabel: 'Shared',
    description: 'Terlihat & dapat disunting bersama oleh akun Oktaf dan Wulan.',
    accent: '#A6533B',
  },
};

export const WISHLIST_CATEGORY_META: Record<
  WishlistCategory,
  { label: string; badge: string; description: string; accent: string }
> = {
  your: {
    label: 'Your Wishes',
    badge: 'Impian Oktaf',
    description: 'Hal-hal yang ingin Oktaf wujudkan untuk kita dan diri sendiri.',
    accent: '#455342',
  },
  her: {
    label: 'Her Wishes',
    badge: 'Impian Wulan',
    description: 'Mimpi kecil maupun besar yang ditulis khusus oleh Wulan.',
    accent: '#743D4A',
  },
  our: {
    label: 'Our Wishes',
    badge: 'Impian Bersama',
    description: 'Tempat, rencana, dan kenangan masa depan yang ingin kita capai berdua.',
    accent: '#A6533B',
  },
};

export const WISHLIST_STATUS_META: Record<
  WishlistStatus,
  { label: string; stamp: string; color: string; bg: string }
> = {
  dreaming: {
    label: 'Dreaming',
    stamp: 'DREAMING',
    color: '#743D4A',
    bg: 'rgba(232, 191, 197, 0.35)',
  },
  planned: {
    label: 'Planned',
    stamp: 'PLANNED',
    color: '#9A7844',
    bg: 'rgba(196, 165, 116, 0.2)',
  },
  in_progress: {
    label: 'In Progress',
    stamp: 'ON THE WAY',
    color: '#A6533B',
    bg: 'rgba(166, 83, 59, 0.14)',
  },
  completed: {
    label: 'Completed ♡',
    stamp: 'KEPT MEMORY ♡',
    color: '#455342',
    bg: 'rgba(69, 83, 66, 0.16)',
  },
};
