export type JarPaperStyle =
  | 'ivory-linen'
  | 'blush-petal'
  | 'sage-leaf'
  | 'champagne-gold'
  | 'burgundy-tint';

export type JarThoughtStatus = 'pending' | 'approved' | 'rejected';

export type JarThoughtSource = 'public' | 'admin';

export interface JarPaperStyleOption {
  id: JarPaperStyle;
  label: string;
  subtitle: string;
  paperBg: string;
  borderColor: string;
  inkColor: string;
  accentColor: string;
  foldShadow: string;
}

export const JAR_LIMITS = {
  SENDER_INITIAL_MIN: 1,
  SENDER_INITIAL_MAX: 12,
  MESSAGE_MIN: 1,
  MESSAGE_MAX: 500,
  DISPLAY_AUTHOR_MAX: 40,
  COOLDOWN_HOURS_DEFAULT: 24,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX_SUBMISSIONS: 5,
  DUPLICATE_WINDOW_MS: 5 * 60 * 1000,
} as const;

export const VALID_JAR_PAPER_STYLES: readonly JarPaperStyle[] = [
  'ivory-linen',
  'blush-petal',
  'sage-leaf',
  'champagne-gold',
  'burgundy-tint',
] as const;

export const JAR_PAPER_STYLES: readonly JarPaperStyleOption[] = [
  {
    id: 'ivory-linen',
    label: 'Ivory Linen',
    subtitle: 'Kertas gading klasik yang hangat',
    paperBg: '#FBF6EE',
    borderColor: 'rgba(56, 39, 31, 0.16)',
    inkColor: '#38271F',
    accentColor: '#A6533B',
    foldShadow: '#EAE0CF',
  },
  {
    id: 'blush-petal',
    label: 'Blush Petal',
    subtitle: 'Merah muda lembut seperti kelopak bunga',
    paperBg: '#FAF0F2',
    borderColor: 'rgba(116, 61, 74, 0.2)',
    inkColor: '#38271F',
    accentColor: '#743D4A',
    foldShadow: '#F2DCE0',
  },
  {
    id: 'sage-leaf',
    label: 'Sage Botanical',
    subtitle: 'Hijau daun tenang dari taman kecil',
    paperBg: '#F2F5F0',
    borderColor: 'rgba(69, 83, 66, 0.22)',
    inkColor: '#2E392C',
    accentColor: '#455342',
    foldShadow: '#E0E8DC',
  },
  {
    id: 'champagne-gold',
    label: 'Warm Gold',
    subtitle: 'Kertas krem keemasan penuh cahaya',
    paperBg: '#FBF4E4',
    borderColor: 'rgba(196, 165, 116, 0.35)',
    inkColor: '#38271F',
    accentColor: '#9C7A42',
    foldShadow: '#EFE2C4',
  },
  {
    id: 'burgundy-tint',
    label: 'Rosewood Note',
    subtitle: 'Nuansa marun lembut yang puitis',
    paperBg: '#F7EDEE',
    borderColor: 'rgba(116, 61, 74, 0.26)',
    inkColor: '#44242C',
    accentColor: '#743D4A',
    foldShadow: '#EBD6DA',
  },
] as const;

export const ANONYMOUS_AUTHOR_LABEL = 'Someone Special';

export interface JarThoughtSubmission {
  id: string;
  senderInitial: string;
  isAnonymous: boolean;
  message: string;
  paperStyle: JarPaperStyle;
  status: JarThoughtStatus;
  opened: boolean;
  openedAt?: string;
  source: JarThoughtSource;
  ownerUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JarPoolThought {
  id: string;
  displayAuthor: string;
  isAnonymous: boolean;
  message: string;
  paperStyle: JarPaperStyle;
  isApproved: true;
  opened: boolean;
  openedAt?: string;
  sortSeed: number;
  createdAt: string;
  updatedAt: string;
}

export interface JarCooldownState {
  stateId: 'cooldown';
  lastOpenedAt: string;
  lastOpenedAtMs: number;
  lastOpenedThoughtId: string;
  totalOpenedCount: number;
  updatedAt: string;
}

export interface JarFeatureSettings {
  enabled: boolean;
  publicRoute: string;
  wulanRoute: string;
  cooldownHours: number;
  introTitle: string;
  introSubtitle: string;
}

export const DEFAULT_JAR_SETTINGS: JarFeatureSettings = {
  enabled: true,
  publicRoute: '#/leave-a-thought',
  wulanRoute: '#/jar-of-thoughts',
  cooldownHours: JAR_LIMITS.COOLDOWN_HOURS_DEFAULT,
  introTitle: 'A Jar Full of Thoughts ♡',
  introSubtitle:
    'Sebuah toples kaca kecil tempat pesan-pesan baik menunggu giliran untuk dibuka, satu surat setiap 24 jam.',
};

export function getJarPaperStyleOption(style: string | undefined): JarPaperStyleOption {
  const found = JAR_PAPER_STYLES.find((item) => item.id === style);
  return found ?? JAR_PAPER_STYLES[0];
}
