export type PostcardRecipient = 'oktaf' | 'wulan' | 'both';
export type PostcardVisibility = 'public' | 'private' | 'shared';
export type PostcardBucket = 'waiting' | 'ready' | 'opened';

export type PostcardDesignTheme =
  | 'vintage_cream'
  | 'botanical_sage'
  | 'rose_parchment'
  | 'airmail_classic';

export type PostcardStampStyle =
  | 'par_avion'
  | 'future_mail'
  | 'wax_heart'
  | 'cherry_blossom';

export interface PostcardEnvelope {
  id: string;
  title: string;
  senderUid: string;
  senderEmail: string;
  senderRole: 'oktaf' | 'wulan';
  senderName: string;
  recipient: PostcardRecipient;
  visibility: PostcardVisibility;
  unlockAt: string; // ISO string from Firestore Timestamp
  unlockDateLabel: string;
  createdDateLabel: string;
  location: string;
  stampStyle: PostcardStampStyle;
  designTheme: PostcardDesignTheme;
  isOpened: boolean;
  openedAt?: string;
  openedByUid?: string;
  order: number;
  allowedEmails: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PostcardSecret {
  postcardId: string;
  message: string;
  photoUrl: string;
  ownerUid: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostcardWithSecret extends PostcardEnvelope {
  message: string;
  photoUrl: string;
}

export const POSTCARD_RECIPIENT_META: Record<
  PostcardRecipient,
  { label: string; shortLabel: string; accent: string }
> = {
  wulan: {
    label: 'Untuk Wulan',
    shortLabel: 'Wulan',
    accent: '#743D4A',
  },
  oktaf: {
    label: 'Untuk Oktaf',
    shortLabel: 'Oktaf',
    accent: '#455342',
  },
  both: {
    label: 'Untuk Kita Berdua',
    shortLabel: 'Oktaf & Wulan',
    accent: '#A6533B',
  },
};

export const POSTCARD_VISIBILITY_META: Record<
  PostcardVisibility,
  { label: string; shortLabel: string; description: string }
> = {
  public: {
    label: 'Public (Terbuka)',
    shortLabel: 'Public',
    description:
      'Judul & jadwal buka terlihat oleh pengunjung; isi surat & foto baru terbuka setelah tanggal buka tiba.',
  },
  private: {
    label: 'Private (Oktaf & Wulan)',
    shortLabel: 'Private',
    description:
      'Kartu pos pribadi yang hanya dapat dilihat & dibuka oleh penerima yang dituju setelah tanggal buka.',
  },
  shared: {
    label: 'Shared Couple (Berdua)',
    shortLabel: 'Shared',
    description:
      'Kartu pos bersama Oktaf & Wulan yang dapat dikelola berdua dan dibuka saat waktunya tiba.',
  },
};

export const POSTCARD_DESIGN_META: Record<
  PostcardDesignTheme,
  {
    label: string;
    paperBg: string;
    borderColor: string;
    accentColor: string;
    flapTint: string;
    tapeClass: string;
  }
> = {
  vintage_cream: {
    label: 'Kertas Krem Klasik',
    paperBg: '#FBF6EE',
    borderColor: 'rgba(56, 39, 31, 0.18)',
    accentColor: '#A6533B',
    flapTint: '#F2E5D2',
    tapeClass: 'washi-tape-gold',
  },
  botanical_sage: {
    label: 'Botani Hijau Sage',
    paperBg: '#F4F3EA',
    borderColor: 'rgba(69, 83, 66, 0.28)',
    accentColor: '#455342',
    flapTint: '#E5E7DA',
    tapeClass: 'washi-tape-sage',
  },
  rose_parchment: {
    label: 'Kelopak Mawar Hangat',
    paperBg: '#FCF4F4',
    borderColor: 'rgba(116, 61, 74, 0.24)',
    accentColor: '#743D4A',
    flapTint: '#F4E2E4',
    tapeClass: 'washi-tape',
  },
  airmail_classic: {
    label: 'Pos Udara Vintage',
    paperBg: '#F9F3E9',
    borderColor: 'rgba(166, 83, 59, 0.28)',
    accentColor: '#A6533B',
    flapTint: '#EFE3D3',
    tapeClass: 'washi-tape-gold',
  },
};

export const POSTCARD_STAMP_META: Record<
  PostcardStampStyle,
  { label: string; stampText: string; flowerKind: 'daisy' | 'rose' | 'wildflower' | 'leaf' }
> = {
  par_avion: {
    label: 'Par Avion',
    stampText: 'PAR AVION',
    flowerKind: 'leaf',
  },
  future_mail: {
    label: 'Future Mail',
    stampText: 'FUTURE POST',
    flowerKind: 'wildflower',
  },
  wax_heart: {
    label: 'Segel Hati',
    stampText: 'SEALED ♡',
    flowerKind: 'rose',
  },
  cherry_blossom: {
    label: 'Sakura Musim',
    stampText: 'SAKURA MAIL',
    flowerKind: 'daisy',
  },
};
