import type { AppSection } from '../store/useStore';

export type AmbientCreatureType =
  | 'bird'
  | 'butterfly'
  | 'rabbit'
  | 'cat'
  | 'mushroom'
  | 'star'
  | 'petals'
  | 'leaves'
  | 'fireflies';

export interface SectionAnimationProfile {
  section: AppSection;
  moodLabel: string;
  creatures: AmbientCreatureType[];
  petalTint: string;
  fireflyTint: string;
  accentTone: string;
}

export interface StorybookChapterItem {
  id: Exclude<AppSection, 'password' | 'welcome'>;
  chapterNumber: string;
  title: string;
  subtitle: string;
  requiresReward?: boolean;
}

export const STORYBOOK_CHAPTERS: StorybookChapterItem[] = [
  {
    id: 'hub',
    chapterNumber: '00',
    title: 'Beranda Jurnal',
    subtitle: 'Peta Utama Dunia Kecil',
  },
  {
    id: 'story',
    chapterNumber: '01',
    title: 'Our Story',
    subtitle: '17 Halaman Scrapbook Kenangan',
  },
  {
    id: 'world',
    chapterNumber: '02',
    title: 'Our World',
    subtitle: 'Bola Dunia 3D & 20 Kota',
  },
  {
    id: 'letters',
    chapterNumber: '03',
    title: 'Birthday Letters',
    subtitle: 'Amplop Surat & Doa Pribadi',
  },
  {
    id: 'video',
    chapterNumber: '04',
    title: 'Birthday Video',
    subtitle: 'Bingkai Bioskop Mini',
  },
  {
    id: 'voices',
    chapterNumber: '05',
    title: 'Voices of Love ♡',
    subtitle: 'Taman Suara Sahabat',
  },
  {
    id: 'wishlist',
    chapterNumber: '06',
    title: 'Our Future Wishlist ♡',
    subtitle: 'Jurnal Impian Masa Depan',
  },
  {
    id: 'postcards',
    chapterNumber: '07',
    title: 'Postcards From The Future ♡',
    subtitle: 'Surat Tersegel Waktu',
  },
  {
    id: 'reward',
    chapterNumber: '08',
    title: 'Secret Meadow',
    subtitle: 'Hadiah Taman 7 Bunga',
    requiresReward: true,
  },
];

export const SECTION_ANIMATION_PROFILES: Record<AppSection, SectionAnimationProfile> = {
  password: {
    section: 'password',
    moodLabel: 'Senja Undangan',
    creatures: ['fireflies', 'petals'],
    petalTint: '#E8BFC5',
    fireflyTint: '#C4A574',
    accentTone: '#743D4A',
  },
  welcome: {
    section: 'welcome',
    moodLabel: 'Pagi Sakura',
    creatures: ['bird', 'butterfly', 'petals', 'leaves'],
    petalTint: '#E8BFC5',
    fireflyTint: '#C4A574',
    accentTone: '#A6533B',
  },
  hub: {
    section: 'hub',
    moodLabel: 'Padang Cerita',
    creatures: ['butterfly', 'rabbit', 'mushroom', 'leaves', 'petals'],
    petalTint: '#E8BFC5',
    fireflyTint: '#C4A574',
    accentTone: '#455342',
  },
  story: {
    section: 'story',
    moodLabel: 'Meja Kenangan',
    creatures: ['cat', 'mushroom', 'leaves', 'petals', 'star'],
    petalTint: '#E8BFC5',
    fireflyTint: '#C4A574',
    accentTone: '#A6533B',
  },
  world: {
    section: 'world',
    moodLabel: 'Angkasa Kecil',
    creatures: ['bird', 'star', 'fireflies'],
    petalTint: '#F4EBDD',
    fireflyTint: '#E8BFC5',
    accentTone: '#C4A574',
  },
  letters: {
    section: 'letters',
    moodLabel: 'Meja Surat',
    creatures: ['cat', 'petals', 'leaves'],
    petalTint: '#E8BFC5',
    fireflyTint: '#C4A574',
    accentTone: '#743D4A',
  },
  video: {
    section: 'video',
    moodLabel: 'Lentera Hangat',
    creatures: ['star', 'fireflies'],
    petalTint: '#C4A574',
    fireflyTint: '#C4A574',
    accentTone: '#C4A574',
  },
  voices: {
    section: 'voices',
    moodLabel: 'Taman Suara',
    creatures: ['bird', 'butterfly', 'leaves', 'petals'],
    petalTint: '#E8BFC5',
    fireflyTint: '#E8BFC5',
    accentTone: '#455342',
  },
  wishlist: {
    section: 'wishlist',
    moodLabel: 'Jurnal Impian',
    creatures: ['rabbit', 'mushroom', 'leaves', 'petals'],
    petalTint: '#E8BFC5',
    fireflyTint: '#C4A574',
    accentTone: '#455342',
  },
  postcards: {
    section: 'postcards',
    moodLabel: 'Pos Udara',
    creatures: ['bird', 'star', 'leaves'],
    petalTint: '#C4A574',
    fireflyTint: '#C4A574',
    accentTone: '#A6533B',
  },
  reward: {
    section: 'reward',
    moodLabel: 'Taman Rahasia',
    creatures: ['rabbit', 'butterfly', 'mushroom', 'petals', 'star'],
    petalTint: '#E8BFC5',
    fireflyTint: '#C4A574',
    accentTone: '#743D4A',
  },
};
