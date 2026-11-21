export type VoiceFlowerType =
  | 'sakura'
  | 'sunflower'
  | 'daisy'
  | 'lavender'
  | 'rose'
  | 'forgetmenot'
  | 'tulip'
  | 'lily'
  | 'peony'
  | 'orchid';

export interface VoiceFlowerOption {
  id: VoiceFlowerType;
  label: string;
  accentColor: string;
}

export const VOICE_FLOWER_OPTIONS: VoiceFlowerOption[] = [
  { id: 'sakura', label: 'Bunga Sakura', accentColor: '#E8BFC5' },
  { id: 'sunflower', label: 'Bunga Matahari', accentColor: '#D9A74A' },
  { id: 'daisy', label: 'Daisy Putih', accentColor: '#C4A574' },
  { id: 'lavender', label: 'Lavender', accentColor: '#8D7AA8' },
  { id: 'rose', label: 'Mawar Klasik', accentColor: '#743D4A' },
  { id: 'forgetmenot', label: 'Forget-Me-Not', accentColor: '#8FB3C9' },
  { id: 'tulip', label: 'Tulip Terakota', accentColor: '#A6533B' },
  { id: 'lily', label: 'Bakung Kebun', accentColor: '#E5B88B' },
  { id: 'peony', label: 'Peony Lembut', accentColor: '#D99BA5' },
  { id: 'orchid', label: 'Anggrek Senja', accentColor: '#9E6E8E' },
];

export const VOICE_FLOWER_QUANTITY_MIN = 1;
export const VOICE_FLOWER_QUANTITY_MAX = 5;

export const VOICE_SUBMISSION_LIMITS = {
  SENDER_NAME_MIN: 1,
  SENDER_NAME_MAX: 120,
  CAPTION_MAX: 300,
  AUDIO_MAX_BYTES: 15 * 1024 * 1024,
  AUDIO_STATIC_FALLBACK_MAX_BYTES: 650 * 1024,
  FLOWER_QUANTITY_MIN: VOICE_FLOWER_QUANTITY_MIN,
  FLOWER_QUANTITY_MAX: VOICE_FLOWER_QUANTITY_MAX,
} as const;

export interface VoiceOfLoveEntry {
  id: string;
  name: string;
  flowerType: VoiceFlowerType;
  flowerQuantity?: number;
  audioUrl: string;
  audioFileName: string;
  photoUrl?: string;
  message?: string;
  order: number;
  permissionConfirmed: boolean;
  submissionId?: string;
  source?: 'admin' | 'public';
  createdAt: string;
  updatedAt: string;
}

export type VoiceSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface VoiceSubmissionRecord {
  id: string;
  submissionId: string;
  senderName: string;
  flowerType: VoiceFlowerType;
  flowerQuantity: number;
  caption: string;
  audioUrl: string;
  audioStoragePath?: string;
  audioFileName: string;
  audioDurationSec?: number;
  status: VoiceSubmissionStatus;
  consentConfirmed: boolean;
  screeningStatus: 'clean' | 'flagged';
  screeningFlags: string[];
  publishedVoiceId?: string;
  source: 'public';
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedContributionBatch {
  id: string;
  submissionId: string;
  jarThoughtId: string;
  voiceSubmissionId: string;
  contributorLabel: string;
  consentConfirmed: boolean;
  screeningStatus: 'clean' | 'flagged';
  screeningFlags: string[];
  source: 'public';
  createdAt: string;
  updatedAt: string;
}

/**
 * Editable Voices of Love dataset.
 * Real MP3/OGG/WEBM/M4A greetings recorded by Wulan's friends can be approved from Control Room
 * or uploaded directly via /admin.
 */
export const DEFAULT_VOICES_OF_LOVE: VoiceOfLoveEntry[] = [];

