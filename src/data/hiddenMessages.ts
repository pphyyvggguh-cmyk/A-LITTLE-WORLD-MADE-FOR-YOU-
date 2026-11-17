export interface HiddenEnvelopeMessage {
  id: string;
  title: string;
  label: string;
  hint: string;
  recipient: string;
  greeting: string;
  message: string;
  signature: string;
  pageNumber: number;
  enabled: boolean;
  sealColor: string;
  stampText: string;
  createdAt?: string;
  updatedAt: string;
}

export type StorySecretNote = HiddenEnvelopeMessage;

export const SECRET_NOTE_SEAL_COLORS = [
  { value: '#A6533B', label: 'Brick Red' },
  { value: '#455342', label: 'Forest Green' },
  { value: '#743D4A', label: 'Deep Burgundy' },
  { value: '#C4A574', label: 'Spice Gold' },
] as const;

/**
 * Migrated default Secret Notes (formerly hardcoded only in source).
 * These serve as the initial cloud migration seed and offline fallback.
 */
export const DEFAULT_SECRET_NOTES: StorySecretNote[] = [
  {
    id: 'env-page-06',
    title: 'Catatan Kecil · Hal. 06',
    label: 'Catatan Kecil · Hal. 06',
    hint: 'Ketuk amplop kecil',
    recipient: 'Untuk Wulan,',
    greeting: 'Untuk Wulan,',
    message:
      'Kadang momen yang paling diingat justru datang dari hal-hal sepele yang hampir kelewat. Makasih ya udah bikin hari-hari biasa terasa selalu layak disimpan.',
    signature: 'Dari Oktaf ♡',
    pageNumber: 6,
    enabled: true,
    sealColor: '#A6533B',
    stampText: 'SECRET NOTE',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
  },
  {
    id: 'env-page-08',
    title: 'Tiket Rahasia · Hal. 08',
    label: 'Tiket Rahasia · Hal. 08',
    hint: 'Buka lipatan surat',
    recipient: 'Hai, partner jalan-jalan,',
    greeting: 'Hai, partner jalan-jalan,',
    message:
      'Ke mana pun nanti kaki melangkah, semoga selalu ada cerita seru di perjalanan, lagu yang pas buat diputar, dan hal-hal lucu yang bisa kita ingat pas pulang.',
    signature: 'Sampai perjalanan berikutnya ♡',
    pageNumber: 8,
    enabled: true,
    sealColor: '#455342',
    stampText: 'FIRST CLASS',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
  },
  {
    id: 'env-page-11',
    title: 'Catatan Sela · Hal. 11',
    label: 'Catatan Sela · Hal. 11',
    hint: 'Ada surat terselip',
    recipient: 'Buat kamu yang teliti banget,',
    greeting: 'Buat kamu yang teliti banget,',
    message:
      'Di sela hari-hari yang padat, jangan lupa buat berhenti sebentar, tarik napas pelan, dan kasih waktu istirahat buat dirimu sendiri ya.',
    signature: 'Penjaga halaman kecil ini ♡',
    pageNumber: 11,
    enabled: true,
    sealColor: '#743D4A',
    stampText: 'PRESSED LEAF',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
  },
  {
    id: 'env-page-14',
    title: 'Doa Ulang Tahun · Hal. 14',
    label: 'Doa Ulang Tahun · Hal. 14',
    hint: 'Buka pesan ulang tahun',
    recipient: 'Selamat ulang tahun, Wulan ♡',
    greeting: 'Selamat ulang tahun, Wulan ♡',
    message:
      'Semoga di tahun baru ini langkahmu lebih tenang, badanmu sehat terus, senyummu nggak pernah hilang, dan makin banyak hal baik yang datang menghampiri.',
    signature: 'Selalu mendoakan yang terbaik',
    pageNumber: 14,
    enabled: true,
    sealColor: '#A6533B',
    stampText: '02 · APR · 26',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
  },
  {
    id: 'env-page-16',
    title: 'Refleksi Kecil · Hal. 16',
    label: 'Refleksi Kecil · Hal. 16',
    hint: 'Baca catatan pribadi',
    recipient: 'Catatan untuk diingat nanti,',
    greeting: 'Catatan untuk diingat nanti,',
    message:
      'Buku ini mungkin cuma nyimpan sebagian kecil dari semuanya, karena bagian paling serunya memang terjadi langsung waktu kita ngejalanin harinya bareng.',
    signature: 'Dengan sayang ♡',
    pageNumber: 16,
    enabled: true,
    sealColor: '#C4A574',
    stampText: 'KEEPSAKE',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
  },
  {
    id: 'env-page-17',
    title: 'Pesan Penutup · Hal. 17',
    label: 'Pesan Penutup · Hal. 17',
    hint: 'Buka surat terakhir',
    recipient: 'Untuk bab-bab selanjutnya,',
    greeting: 'Untuk bab-bab selanjutnya,',
    message:
      'Halaman 17 ini bukan penutup cerita kok—justru pengingat kalau masih ada banyak lembar kosong yang siap kita isi pelan-pelan.',
    signature: 'Our story is still being written ♡',
    pageNumber: 17,
    enabled: true,
    sealColor: '#743D4A',
    stampText: 'TO BE CONTINUED',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
  },
];

export const HIDDEN_MESSAGES: Record<string, HiddenEnvelopeMessage> = Object.fromEntries(
  DEFAULT_SECRET_NOTES.map((note) => [note.id, note])
);
