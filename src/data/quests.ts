export type HeartGalleryTheme =
  | 'flowers'
  | 'butterflies'
  | 'stars'
  | 'notes'
  | 'stamps'
  | 'scrapbook';

export interface HeartGalleryThemeMeta {
  id: HeartGalleryTheme;
  label: string;
  accent: string;
  bgTint: string;
  description: string;
}

export const HEART_GALLERY_THEMES: HeartGalleryThemeMeta[] = [
  {
    id: 'flowers',
    label: 'Bunga Kering',
    accent: '#743D4A',
    bgTint: '#F9ECEE',
    description: 'Bunga kecil dan kelopak manis di tepi bingkai',
  },
  {
    id: 'butterflies',
    label: 'Kupu-kupu',
    accent: '#455342',
    bgTint: '#EEF4EC',
    description: 'Kupu-kupu kecil yang hinggap di sudut foto',
  },
  {
    id: 'stars',
    label: 'Bintang Kecil',
    accent: '#A6533B',
    bgTint: '#FDF5E6',
    description: 'Kerlap bintang emas dan titik cahaya hangat',
  },
  {
    id: 'notes',
    label: 'Catatan Kecil',
    accent: '#38271F',
    bgTint: '#F7EFE1',
    description: 'Klip kertas dan potongan catatan manis',
  },
  {
    id: 'stamps',
    label: 'Perangko Klasik',
    accent: '#743D4A',
    bgTint: '#F5EAE4',
    description: 'Cap pos kenangan dan stempel perayaan',
  },
  {
    id: 'scrapbook',
    label: 'Washi & Pita',
    accent: '#A6533B',
    bgTint: '#FBF3EC',
    description: 'Selotip washi lembut bergaya jurnal',
  },
];

export interface HeartGalleryPhoto {
  id: string;
  imageUrl: string;
  storagePath?: string;
  caption: string;
  dateLabel?: string;
  theme: HeartGalleryTheme;
  order: number;
  isPublished: boolean;
  ownerUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Quest2Question {
  id: string;
  step: number;
  prompt: string;
  placeholder: string;
  helper: string;
}

export const QUEST2_QUESTIONS: Quest2Question[] = [
  {
    id: 'q2-step-1',
    step: 1,
    prompt: 'Kapan tanggal jadian kita?',
    placeholder: 'Contoh format: DD-MM-YYYY',
    helper: 'Tulis tanggalnya dengan format DD-MM-YYYY ya.',
  },
  {
    id: 'q2-step-2',
    step: 2,
    prompt: 'Apa ucapan yang Oktaf katakan saat pertama kali mengungkapkan perasaannya?',
    placeholder: 'Tulis kalimatnya di sini...',
    helper: 'Ingat-ingat lagi janji jalan-jalan waktu malam itu...',
  },
  {
    id: 'q2-step-3',
    step: 3,
    prompt: 'Apa modus yang Oktaf lakukan saat pertama kali dekat?',
    placeholder: 'Dua kata yang paling sering diingat...',
    helper: 'Momen klasik waktu pertama kali cari alasan buat dekat.',
  },
];

export const QUEST2_LETTER_TITLE = 'A Letter for Wulan';

export const QUEST2_LETTER_TEXT = `Haloo, maniss!

Cieee, cieee! Selamat yaahh, udah berhasil menyelesaikan quest rahasia iniii! Hehehe. Maniss kuu ini hebat sekali yaahhh. Awww, jadi makin sayang dehhh!

Ini adalah sebuah surat untuk uu tercintah yang ii tulis menggunakan bahasa sehari-hari kitaa. Hehehe.

Di dalam surat ini, ii mau mengucapkan selamat ulang tahun. Semoga semua yang kita lalui bersama bisa bertahan selama-lamanya.

Mungkin hadiah yang cowok uu ini berikan belum terlalu sempurna dan masih banyak kurangnya. Namun, hadiah terbaik yang ii berikan adalah diri ii sendiri.

Ii bakalan selalu hadir, selalu ada, dan selalu bisa berada di samping uu di saat dunia sedang tidak berpihak kepada uu. Ii bakalan support uu dan melindungi uu, baik di saat sekarang maupun di masa yang akan datang.

Uu tidak akan berjalan sendirian lagi. Uu bakalan berjalan bersama ii, dan kita bakalan mengejar cita-cita kita masing-masing selama perjalanan yang panjang ini.

Mungkin ke depannya tidak akan selalu mulus dan baik-baik saja. Tetapi, ii percaya bahwa kita bakalan berjalan bersama dan bergandengan tangan, sejauh dan sesulit apa pun jalan yang akan kita lewati nanti.

Semoga kita tidak menyerah dan terus bersama hingga akhirnya diberikan kebahagiaan. :)

Love uu, sayanggg!

— Botakk`;

export interface HiddenPolaroidCollectible {
  id: string;
  title: string;
  chapterId: 'story' | 'letters' | 'voices' | 'wishlist' | 'postcards';
  chapterLabel: string;
  clueHint: string;
  notePreview: string;
  theme: HeartGalleryTheme;
  imageUrl: string;
}

export const POLAROIDS_QUEST_DATA: HiddenPolaroidCollectible[] = [
  {
    id: 'polaroid-story',
    title: 'Polaroid Halaman Cerita',
    chapterId: 'story',
    chapterLabel: 'Bab 01 · Our Story',
    clueHint: 'Terselip di meja bagian bawah buku Our Story.',
    notePreview: 'Langkah awal dari tujuh belas halaman kenangan.',
    theme: 'scrapbook',
    imageUrl: '/assets/photos/memories/memory-01.svg',
  },
  {
    id: 'polaroid-letters',
    title: 'Polaroid Sudut Surat',
    chapterId: 'letters',
    chapterLabel: 'Bab 03 · Birthday Letters',
    clueHint: 'Intip sudut bawah meja amplop Birthday Letters.',
    notePreview: 'Tersimpan tenang bersama surat-surat ulang tahun.',
    theme: 'stamps',
    imageUrl: '/assets/photos/memories/memory-05.svg',
  },
  {
    id: 'polaroid-voices',
    title: 'Polaroid Taman Suara',
    chapterId: 'voices',
    chapterLabel: 'Bab 05 · Voices of Love',
    clueHint: 'Ada di antara bunga-bunga Voices of Love.',
    notePreview: 'Menyimpan gema tawa dan doa sahabat-sahabatmu.',
    theme: 'flowers',
    imageUrl: '/assets/photos/memories/memory-09.svg',
  },
  {
    id: 'polaroid-wishlist',
    title: 'Polaroid Papan Impian',
    chapterId: 'wishlist',
    chapterLabel: 'Bab 06 · Our Future Wishlist',
    clueHint: 'Menunggu di bagian bawah catatan Our Future Wishlist.',
    notePreview: 'Pengingat lembut untuk semua mimpi yang mau dicapai.',
    theme: 'stars',
    imageUrl: '/assets/photos/memories/memory-12.svg',
  },
  {
    id: 'polaroid-postcards',
    title: 'Polaroid Meja Kartu Pos',
    chapterId: 'postcards',
    chapterLabel: 'Bab 07 · Postcards From The Future',
    clueHint: 'Terjepit manis di meja kartu pos Postcards From The Future.',
    notePreview: 'Satu foto kecil yang ikut menunggu hari-hari spesial nanti.',
    theme: 'butterflies',
    imageUrl: '/assets/photos/memories/memory-16.svg',
  },
];

export const VALID_POLAROID_IDS = new Set(POLAROIDS_QUEST_DATA.map((p) => p.id));

const DEFAULT_THEMES_CYCLE: HeartGalleryTheme[] = [
  'flowers',
  'butterflies',
  'stars',
  'notes',
  'stamps',
  'scrapbook',
];

const DEFAULT_CAPTIONS = [
  'Hari ketika semuanya mulai terasa dekat',
  'Langkah pertama yang nggak sengaja berkesan',
  'Tawa paling ringan di sore hari',
  'Cerita panjang di sela jalan berdua',
  'Sudut kota kecil yang selalu hangat',
  'Obrolan larut tentang banyak mimpi',
  'Foto sederhana tanpa rencana apa-apa',
  'Satu senyuman yang selalu diingat',
  'Waktu rasanya berjalan lebih pelan',
  'Jejak manis di halaman kenangan',
  'Janji kecil buat keliling dunia nanti',
  'Langit senja yang ikut jadi saksi',
  'Momen random yang bikin ketawa terus',
  'Satu frame penuh rasa syukur',
  'Hari biasa yang jadi luar biasa',
  'Catatan kecil untuk dibaca lagi nanti',
  'Doa terbaik di setiap ulang tahunmu',
  'Bandung yang selalu punya cerita',
  'Senja di Yogyakarta yang hangat',
  'Satu mimpi jauh menuju Swiss berdua ♡',
];

export const DEFAULT_HEART_GALLERY_PHOTOS: HeartGalleryPhoto[] = Array.from(
  { length: 20 },
  (_, idx) => {
    const num = idx + 1;
    const isDest = num > 17;
    const fileIndex = isDest ? num - 17 : num;
    const padded = String(fileIndex).padStart(2, '0');
    const imageUrl = isDest
      ? `/assets/photos/destinations/dest-${padded}.svg`
      : `/assets/photos/memories/memory-${padded}.svg`;
    return {
      id: `heart-photo-${String(num).padStart(2, '0')}`,
      imageUrl,
      caption: DEFAULT_CAPTIONS[idx] ?? `Kenangan kecil #${num}`,
      dateLabel: num <= 17 ? `Halaman ${num}` : 'Mimpi Masa Depan',
      theme: DEFAULT_THEMES_CYCLE[idx % DEFAULT_THEMES_CYCLE.length],
      order: num,
      isPublished: true,
    };
  }
);
