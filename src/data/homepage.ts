import type { AppSection } from '../store/useStore';

const heroKeepsakeImg = '/assets/images/hero_scrapbook_keepsake_1795173831172.jpg';
const featuredPicnicImg = '/assets/images/featured_golden_picnic_1795173832261.jpg';
const featuredLanternsImg = '/assets/images/featured_twilight_lanterns_1795173831660.jpg';

export type HomepageChapterTarget = Exclude<
  AppSection,
  'password' | 'welcome' | 'hub' | 'reward'
>;

export interface HomepageHeroFrame {
  id: string;
  role: 'hero-main' | 'decorative-polaroid';
  slotLabel: string;
  image: string;
  alt: string;
  caption: string;
  badgeLabel: string;
  order: number;
}

export interface HomepageFeaturedMemory {
  id: string;
  target: HomepageChapterTarget;
  image: string;
  alt: string;
  kicker: string;
  title: string;
  caption: string;
  tiltClass: '-rotate-1' | 'rotate-1' | 'rotate-0';
  order: number;
}

export interface HomepageConfig {
  heroFrames: HomepageHeroFrame[];
  featuredMemories: HomepageFeaturedMemory[];
}

export const HOMEPAGE_TARGET_OPTIONS: {
  id: HomepageChapterTarget;
  label: string;
}[] = [
  { id: 'story', label: '01 · Our Story' },
  { id: 'world', label: '02 · Our World' },
  { id: 'letters', label: '03 · Birthday Letters' },
  { id: 'video', label: '04 · Birthday Video' },
  { id: 'voices', label: '05 · Voices of Love' },
  { id: 'wishlist', label: '06 · Our Future Wishlist' },
  { id: 'postcards', label: '07 · Postcards From The Future' },
  { id: 'jar-of-thoughts', label: '08 · A Jar Full of Thoughts' },
];

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  heroFrames: [
    {
      id: 'hero-main',
      role: 'hero-main',
      slotLabel: 'Foto Utama Hero',
      image: heroKeepsakeImg,
      alt: 'Jurnal scrapbook kenangan Wulan dan Oktaf dengan bunga kering dan amplop surat',
      caption: 'Our little keepsakes ♡',
      badgeLabel: 'Vol. 01',
      order: 1,
    },
    {
      id: 'polaroid-top',
      role: 'decorative-polaroid',
      slotLabel: 'Polaroid Dekoratif Atas',
      image: featuredPicnicImg,
      alt: 'Vas bunga keemasan dan kamera film vintage',
      caption: 'Golden afternoon',
      badgeLabel: '',
      order: 2,
    },
    {
      id: 'polaroid-bottom',
      role: 'decorative-polaroid',
      slotLabel: 'Polaroid Dekoratif Bawah',
      image: featuredLanternsImg,
      alt: 'Meja kafe senja bersama globe kecil dan kotak hadiah',
      caption: 'Cities we dream of',
      badgeLabel: '',
      order: 3,
    },
  ],
  featuredMemories: [
    {
      id: 'featured-story',
      target: 'story',
      image: heroKeepsakeImg,
      alt: 'Jurnal scrapbook terbuka dengan bunga peoni kering dan amplop kenangan di bawah cahaya pagi',
      kicker: 'Halaman Kenangan',
      title: 'Every quiet chapter in our scrapbook',
      caption:
        'Catatan tulisan tangan, foto Polaroid, dan momen kecil yang selalu ingin disimpan.',
      tiltClass: '-rotate-1',
      order: 1,
    },
    {
      id: 'featured-world',
      target: 'world',
      image: featuredLanternsImg,
      alt: 'Meja kafe senja menghadap lampu kota dengan globe miniatur dan kotak hadiah berpitakan marun',
      kicker: 'Peta Impian Kita',
      title: 'Twenty cities waiting on our little globe',
      caption:
        'Dari Bandung sampai sudut kota yang ingin kita datangi pelan-pelan berdua.',
      tiltClass: 'rotate-1',
      order: 2,
    },
    {
      id: 'featured-letters',
      target: 'letters',
      image: featuredPicnicImg,
      alt: 'Vas kaca kuning keemasan berisi bunga liar bersama surat berikat pita krem dan kamera film vintage',
      kicker: 'Surat & Ucapan',
      title: 'Letters sealed with warmth and wishes',
      caption:
        'Kata-kata yang sengaja dirangkai untuk dibaca ulang di hari baik maupun lelah.',
      tiltClass: '-rotate-1',
      order: 3,
    },
  ],
};
