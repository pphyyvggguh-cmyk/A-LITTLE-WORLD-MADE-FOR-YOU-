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

export interface VoiceOfLoveEntry {
  id: string;
  name: string;
  flowerType: VoiceFlowerType;
  audioUrl: string;
  audioFileName: string;
  photoUrl?: string;
  message?: string;
  order: number;
  permissionConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Editable Voices of Love dataset.
 * Real MP3 greetings recorded by Wulan's friends can be uploaded from Android via /admin
 * (stored under public/assets/audio/friends/ and linked here).
 */
export const DEFAULT_VOICES_OF_LOVE: VoiceOfLoveEntry[] = [];
