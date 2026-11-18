export type PolaroidSize = 'sm' | 'md' | 'lg';
export type BookPolaroidSize = 'xs' | 'sm' | 'md' | 'lg';
export type TapeVariant = 'pink' | 'gold' | 'sage';
export type PolaroidAspect = 'portrait' | 'landscape' | 'square';

export type PageLayoutType =
  | 'intro-polaroid-note'
  | 'floral-spotlight'
  | 'asymmetric-mini-cluster'
  | 'layered-collage-captions'
  | 'large-pressed-botanical'
  | 'stickers-and-secret-note'
  | 'travel-stamps-map'
  | 'ticket-stubs-arrangement'
  | 'portrait-gallery-frame'
  | 'landscape-storytelling'
  | 'woodland-botanical-sketch'
  | 'multi-photo-margin-notes'
  | 'central-heirloom-frame'
  | 'journal-letter-composition'
  | 'memory-constellation-grid'
  | 'reflective-keepsake-quote'
  | 'final-chapter-finale';

export type DecorationKind =
  | 'daisy'
  | 'rose'
  | 'wildflower'
  | 'leaf'
  | 'branch'
  | 'butterfly'
  | 'bird'
  | 'bee'
  | 'cat'
  | 'rabbit'
  | 'star'
  | 'heart'
  | 'cloud'
  | 'stamp'
  | 'paperclip'
  | 'ribbon'
  | 'mushroom'
  | 'petal';

export interface PageDecoration {
  kind: DecorationKind;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'mid-left' | 'mid-right';
  rotation?: number;
  animate?: 'float' | 'sway';
  label?: string;
}

export interface BookPolaroidItem {
  id: string;
  image: string;
  title: string;
  date: string;
  location: string;
  caption: string;
  story: string;
  aspect: PolaroidAspect;
  size: BookPolaroidSize;
  rotation: number;
  tape?: TapeVariant | null;
  pinColor?: string;
  sticker?: 'heart' | 'star' | 'flower' | 'clip';
  stamp?: string;
}

export interface MemoryBookPage {
  id: string;
  pageNumber: number; // Strictly 1..17
  spreadNumber: number; // 1..9
  spreadTheme: string;
  title: string;
  subtitle?: string;
  handwrittenNote?: string;
  bodyCopy?: string;
  layoutType: PageLayoutType;
  paperTint?: 'ivory' | 'warm-linen' | 'blush-tint' | 'sage-tint';
  polaroids: BookPolaroidItem[];
  decorations: PageDecoration[];
  envelopeId?: string;
  extraTags?: string[];
}

/**
 * Editable 17-Page Memory Book dataset across 9 two-page spreads.
 * Replace image paths inside `public/assets/photos/memories/` and customize titles, dates,
 * captions, or longer stories without altering UI components.
 */
export const MEMORY_BOOK_PAGES: MemoryBookPage[] = [
  // SPREAD 1 — THE BEGINNING
  {
    id: 'page-01',
    pageNumber: 1,
    spreadNumber: 1,
    spreadTheme: 'Spread 1 · The Beginning',
    title: 'Halaman Pertama',
    subtitle: 'Bab 01 · Titik Awal',
    handwrittenNote: 'Untuk Wulan—halaman pertama di buku kecil ini ♡',
    bodyCopy:
      'Semua cerita besar biasanya berawal dari satu hal kecil yang diam-diam ingin terus diingat.',
    layoutType: 'intro-polaroid-note',
    paperTint: 'ivory',
    polaroids: [
      {
        id: 'pol-01',
        image: '/assets/photos/memories/memory-01.svg',
        title: 'Halaman Pertama',
        date: 'Bab 01 · Awal Cerita',
        location: 'Sudut Favorit',
        caption: 'Tempat semuanya bermula',
        story:
          'Ada banyak hal yang tidak sempat tercatat saat itu, tapi rasanya masih jelas sampai sekarang.',
        aspect: 'landscape',
        size: 'lg',
        rotation: -2.5,
        tape: 'pink',
        stamp: 'CHAPTER 01',
      },
    ],
    decorations: [
      { kind: 'rose', position: 'top-right', rotation: 10, animate: 'sway' },
      { kind: 'heart', position: 'bottom-left', rotation: -8 },
      { kind: 'butterfly', position: 'mid-right', animate: 'float' },
    ],
  },
  {
    id: 'page-02',
    pageNumber: 2,
    spreadNumber: 1,
    spreadTheme: 'Spread 1 · The Beginning',
    title: 'Langkah Pertama',
    subtitle: 'Bab 02 · Percakapan Awal',
    handwrittenNote: 'Pelan-pelan saja, nggak perlu buru-buru',
    bodyCopy:
      'Beberapa hari pertama saling mengenal, waktu obrolan masih terasa baru dan ringan.',
    layoutType: 'floral-spotlight',
    paperTint: 'warm-linen',
    polaroids: [
      {
        id: 'pol-02',
        image: '/assets/photos/memories/memory-02.svg',
        title: 'Langkah Pertama',
        date: 'Bab 02 · Jalan Santai',
        location: 'Sepanjang Jalan',
        caption: 'Jalan tanpa perlu buru-buru',
        story:
          'Kadang yang paling diingat bukan tujuannya, tapi obrolan random di sepanjang jalan waktu nggak ke mana-mana.',
        aspect: 'portrait',
        size: 'md',
        rotation: 2.2,
        tape: 'gold',
        pinColor: '#455342',
        sticker: 'flower',
      },
    ],
    decorations: [
      { kind: 'branch', position: 'top-left', rotation: -6, animate: 'sway' },
      { kind: 'daisy', position: 'bottom-right', rotation: 14, animate: 'sway' },
      { kind: 'wildflower', position: 'bottom-left', rotation: -12 },
    ],
  },

  // SPREAD 2 — LITTLE MOMENTS
  {
    id: 'page-03',
    pageNumber: 3,
    spreadNumber: 2,
    spreadTheme: 'Spread 2 · Little Moments',
    title: 'Potongan Momen Kecil',
    subtitle: 'Bab 03 · Hal-Hal Sederhana',
    handwrittenNote: 'Tiga hal kecil yang sering bikin senyum sendiri',
    layoutType: 'asymmetric-mini-cluster',
    paperTint: 'ivory',
    polaroids: [
      {
        id: 'pol-03a',
        image: '/assets/photos/memories/memory-03.svg',
        title: 'Warna Langit Sore',
        date: 'Sore Itu',
        location: 'Di Luar Sana',
        caption: 'Langit menjelang malam',
        story:
          'Langit sore kadang punya caranya sendiri buat bikin waktu terasa sedikit lebih pelan.',
        aspect: 'square',
        size: 'sm',
        rotation: -4.2,
        tape: 'pink',
      },
      {
        id: 'pol-03b',
        image: '/assets/photos/memories/memory-04.svg',
        title: 'Waktu Hujan Turun',
        date: 'Sore Gerimis',
        location: 'Tempat Berteduh',
        caption: 'Menunggu reda sebentar',
        story:
          'Hujan mendadak sering jadi alasan paling pas buat berhenti sebentar dan ngobrol lebih lama.',
        aspect: 'landscape',
        size: 'sm',
        rotation: 3.4,
        tape: 'sage',
      },
      {
        id: 'pol-03c',
        image: '/assets/photos/memories/memory-05.svg',
        title: 'Kelopak Terselip',
        date: 'Sela Buku',
        location: 'Halaman Jurnal',
        caption: 'Bunga kecil di sela catatan',
        story:
          'Seperti bunga kering yang diselipkan di halaman buku, hal-hal kecil tetap terasa dekat tiap kali dibuka lagi.',
        aspect: 'square',
        size: 'xs',
        rotation: -2.1,
        pinColor: '#A6533B',
      },
    ],
    decorations: [
      { kind: 'bee', position: 'top-right', animate: 'float' },
      { kind: 'star', position: 'bottom-left', rotation: 12 },
    ],
  },
  {
    id: 'page-04',
    pageNumber: 4,
    spreadNumber: 2,
    spreadTheme: 'Spread 2 · Little Moments',
    title: 'Kolase Sore Hari',
    subtitle: 'Bab 04 · Catatan Pinggir',
    handwrittenNote: 'Nggak harus selalu rapi, yang penting terekam',
    bodyCopy:
      'Dua potongan foto dari hari yang biasa saja, tapi rasanya pengin disimpan.',
    layoutType: 'layered-collage-captions',
    paperTint: 'blush-tint',
    polaroids: [
      {
        id: 'pol-04a',
        image: '/assets/photos/memories/memory-06.svg',
        title: 'Lampu-Lampu Malam',
        date: 'Malam Hari',
        location: 'Sudut Kota',
        caption: 'Pendar lampu di ujung jalan',
        story:
          'Waktu lampu jalan mulai menyala satu per satu, suasana kota biasanya berubah jadi lebih tenang.',
        aspect: 'landscape',
        size: 'md',
        rotation: -2.8,
        tape: 'gold',
        sticker: 'clip',
      },
      {
        id: 'pol-04b',
        image: '/assets/photos/memories/memory-07.svg',
        title: 'Catatan Pagi',
        date: 'Awal Hari',
        location: 'Meja Tulis',
        caption: 'Pesan singkat sebelum mulai hari',
        story:
          'Sapaan kecil di pagi hari lumayan sering bikin hari yang panjang terasa lebih ringan.',
        aspect: 'portrait',
        size: 'sm',
        rotation: 4.1,
        tape: 'pink',
      },
    ],
    decorations: [
      { kind: 'paperclip', position: 'top-left', rotation: -12 },
      { kind: 'leaf', position: 'bottom-right', rotation: 18, animate: 'sway' },
    ],
  },

  // SPREAD 3 — SWEET MEMORIES
  {
    id: 'page-05',
    pageNumber: 5,
    spreadNumber: 3,
    spreadTheme: 'Spread 3 · Sweet Memories',
    title: 'Bunga yang Disimpan',
    subtitle: 'Bab 05 · Koleksi Botani',
    handwrittenNote: 'Disimpan rapat di antara lembar kertas',
    bodyCopy:
      'Ada hari-hari yang rasanya ingin dijaga pelan-pelan supaya tidak cepat memudar oleh waktu.',
    layoutType: 'large-pressed-botanical',
    paperTint: 'sage-tint',
    polaroids: [
      {
        id: 'pol-05',
        image: '/assets/photos/memories/memory-05.svg',
        title: 'Kenangan yang Dijaga',
        date: 'Bab 05 · Koleksi Manis',
        location: 'Taman Kenangan',
        caption: 'Bunga kering & catatan kecil',
        story:
          'Ada beberapa momen yang rasanya ingin disimpan baik-baik, persis seperti menyelipkan bunga kering di buku.',
        aspect: 'landscape',
        size: 'lg',
        rotation: 1.4,
        tape: 'sage',
        sticker: 'flower',
      },
    ],
    decorations: [
      { kind: 'daisy', position: 'top-left', rotation: -10, animate: 'sway' },
      { kind: 'rose', position: 'bottom-right', rotation: 8, animate: 'sway' },
      { kind: 'wildflower', position: 'bottom-left', rotation: 6 },
    ],
  },
  {
    id: 'page-06',
    pageNumber: 6,
    spreadNumber: 3,
    spreadTheme: 'Spread 3 · Sweet Memories',
    title: 'Catatan Rahasia & Stiker',
    subtitle: 'Bab 06 · Sudut Manis',
    handwrittenNote: 'Psst... ada amplop kecil terselip di halaman ini!',
    layoutType: 'stickers-and-secret-note',
    paperTint: 'ivory',
    envelopeId: 'env-page-06',
    polaroids: [
      {
        id: 'pol-06a',
        image: '/assets/photos/memories/memory-08.svg',
        title: 'Lagu Favorit',
        date: 'Nada Favorit',
        location: 'Earphone Sebelah',
        caption: 'Lagu yang diputar berulang',
        story:
          'Selalu ada lagu yang tiap kali diputar langsung membawa pikiran balik ke satu momen tertentu.',
        aspect: 'square',
        size: 'sm',
        rotation: -3.2,
        tape: 'pink',
        sticker: 'heart',
      },
      {
        id: 'pol-06b',
        image: '/assets/photos/memories/memory-09.svg',
        title: 'Bintang & Cerita Panjang',
        date: 'Tengah Malam',
        location: 'Langit Malam',
        caption: 'Obrolan yang tahu-tahu sudah larut',
        story:
          'Malam yang tenang sering jadi waktu di mana obrolan receh bisa nyambung sampai mimpi-mimpi besar.',
        aspect: 'square',
        size: 'sm',
        rotation: 2.8,
        tape: 'gold',
        sticker: 'star',
      },
    ],
    decorations: [
      { kind: 'heart', position: 'top-right', rotation: 10 },
      { kind: 'butterfly', position: 'mid-left', animate: 'float' },
    ],
  },

  // SPREAD 4 — OUR LITTLE WORLD
  {
    id: 'page-07',
    pageNumber: 7,
    spreadNumber: 4,
    spreadTheme: 'Spread 4 · Our Little World',
    title: 'Jurnal Perjalanan Kecil',
    subtitle: 'Bab 07 · Peta & Prangko',
    handwrittenNote: 'Ke mana pun nanti pergi, semoga ceritanya ikut pulang',
    bodyCopy:
      'Catatan kecil tentang tempat-tempat yang ingin dikunjungi suatu hari nanti.',
    layoutType: 'travel-stamps-map',
    paperTint: 'warm-linen',
    extraTags: ['POSTAGE PAID', 'LAT 6.9° S · LNG 107.6° E'],
    polaroids: [
      {
        id: 'pol-07',
        image: '/assets/photos/memories/memory-13.svg',
        title: 'Jendela Perjalanan',
        date: 'Bab 07 · Dalam Perjalanan',
        location: 'Balik Jendela',
        caption: 'Pemandangan yang lewat bergantian',
        story:
          'Perjalanan paling seru biasanya bukan cuma soal tempat tujuannya, tapi siapa yang diajak lihat pemandangan bareng.',
        aspect: 'landscape',
        size: 'md',
        rotation: -1.8,
        tape: 'gold',
        stamp: 'AIR MAIL',
      },
    ],
    decorations: [
      { kind: 'stamp', position: 'top-right', rotation: 6, label: 'AIRMAIL · 2026' },
      { kind: 'cloud', position: 'top-left', animate: 'float' },
      { kind: 'bird', position: 'bottom-right', animate: 'float' },
    ],
  },
  {
    id: 'page-08',
    pageNumber: 8,
    spreadNumber: 4,
    spreadTheme: 'Spread 4 · Our Little World',
    title: 'Tiket & Karcis Kenangan',
    subtitle: 'Bab 08 · Koleksi Perjalanan',
    handwrittenNote: 'Kertas kecil yang kadang sayang kalau dibuang',
    layoutType: 'ticket-stubs-arrangement',
    paperTint: 'ivory',
    envelopeId: 'env-page-08',
    extraTags: ['BOARDING PASS · NO. 1902', 'SEAT · ALWAYS WITH YOU'],
    polaroids: [
      {
        id: 'pol-08a',
        image: '/assets/photos/memories/memory-10.svg',
        title: 'Bangku Taman Teduh',
        date: 'Akhir Pekan',
        location: 'Taman Kota',
        caption: 'Angin sepoi & daun hijau',
        story:
          'Duduk santai di bawah pohon sambil lihat orang lalu-lalang lumayan ampuh buat melepas capek seminggu.',
        aspect: 'landscape',
        size: 'sm',
        rotation: 2.4,
        tape: 'sage',
      },
      {
        id: 'pol-08b',
        image: '/assets/photos/memories/memory-06.svg',
        title: 'Sudut Kota Malam',
        date: 'Perjalanan Singkat',
        location: 'Ujung Jalan',
        caption: 'Lampu jalan setelah perjalanan',
        story:
          'Suasana kota asing rasanya cepat jadi akrab kalau ada teman cerita yang pas.',
        aspect: 'landscape',
        size: 'sm',
        rotation: -2.9,
        pinColor: '#743D4A',
      },
    ],
    decorations: [
      { kind: 'ribbon', position: 'bottom-left', rotation: -4 },
      { kind: 'star', position: 'top-left' },
    ],
  },

  // SPREAD 5 — THE DAYS WE KEEP
  {
    id: 'page-09',
    pageNumber: 9,
    spreadNumber: 5,
    spreadTheme: 'Spread 5 · The Days We Keep',
    title: 'Potret yang Disimpan',
    subtitle: 'Bab 09 · Bingkai Vertikal',
    handwrittenNote: 'Satu foto yang rasanya pas disimpan sendiri',
    bodyCopy:
      'Kadang satu foto saja sudah cukup untuk mengingatkan suasana hari itu.',
    layoutType: 'portrait-gallery-frame',
    paperTint: 'blush-tint',
    polaroids: [
      {
        id: 'pol-09',
        image: '/assets/photos/memories/memory-01.svg',
        title: 'Potret Favorit',
        date: 'Bab 09 · Hari Tenang',
        location: 'Bingkai Khusus',
        caption: 'Senyum yang paling diingat',
        story:
          'Momen tenang yang nggak perlu banyak alasan kenapa pengin disimpan lama.',
        aspect: 'portrait',
        size: 'lg',
        rotation: -1.2,
        tape: 'pink',
        pinColor: '#A6533B',
      },
    ],
    decorations: [
      { kind: 'leaf', position: 'top-left', rotation: -15, animate: 'sway' },
      { kind: 'heart', position: 'bottom-right', rotation: 8 },
    ],
  },
  {
    id: 'page-10',
    pageNumber: 10,
    spreadNumber: 5,
    spreadTheme: 'Spread 5 · The Days We Keep',
    title: 'Cerita di Balik Pemandangan',
    subtitle: 'Bab 10 · Garis Horison',
    handwrittenNote: 'Kadang pemandangan luas bikin pikiran jadi lebih tenang',
    bodyCopy:
      'Waktu sore turun pelan, ada hari-hari yang rasanya sayang kalau cuma lewat begitu saja.',
    layoutType: 'landscape-storytelling',
    paperTint: 'ivory',
    polaroids: [
      {
        id: 'pol-10',
        image: '/assets/photos/memories/memory-03.svg',
        title: 'Pemandangan Sore',
        date: 'Bab 10 · Horison Tenang',
        location: 'Ujung Sore',
        caption: 'Langit luas & sore yang pelan',
        story:
          'Entah di laut, bukit, atau cuma langit sore di jalan pulang—pemandangan begini selalu enak diingat.',
        aspect: 'landscape',
        size: 'lg',
        rotation: 1.5,
        tape: 'gold',
        stamp: 'WIDE VIEW',
      },
    ],
    decorations: [
      { kind: 'cloud', position: 'top-right', animate: 'float' },
      { kind: 'bird', position: 'top-left', animate: 'float' },
    ],
  },

  // SPREAD 6 — TINY DETAILS
  {
    id: 'page-11',
    pageNumber: 11,
    spreadNumber: 6,
    spreadTheme: 'Spread 6 · Tiny Details',
    title: 'Hal-Hal Mungil yang Lucu',
    subtitle: 'Bab 11 · Taman Sketsa',
    handwrittenNote: 'Ada kelinci, kucing, lebah, dan kupu-kupu di sudut halaman',
    bodyCopy:
      'Justru detail-detail kecil yang kadang kelewat sering bikin hari biasa jadi terasa lebih hidup.',
    layoutType: 'woodland-botanical-sketch',
    paperTint: 'sage-tint',
    envelopeId: 'env-page-11',
    polaroids: [
      {
        id: 'pol-11',
        image: '/assets/photos/memories/memory-10.svg',
        title: 'Siang di Taman',
        date: 'Bab 11 · Detail Kecil',
        location: 'Bangku Teduh',
        caption: 'Bunga liar & siang yang teduh',
        story:
          'Hal-hal kecil yang lewat sebentar, tapi cukup buat bikin mood hari itu membaik.',
        aspect: 'square',
        size: 'md',
        rotation: -2.0,
        tape: 'sage',
        sticker: 'flower',
      },
    ],
    decorations: [
      { kind: 'rabbit', position: 'bottom-left', rotation: -3 },
      { kind: 'cat', position: 'bottom-right', rotation: 4 },
      { kind: 'butterfly', position: 'top-right', animate: 'float' },
      { kind: 'bee', position: 'top-left', animate: 'float' },
    ],
  },
  {
    id: 'page-12',
    pageNumber: 12,
    spreadNumber: 6,
    spreadTheme: 'Spread 6 · Tiny Details',
    title: 'Catatan Pinggir Halaman',
    subtitle: 'Bab 12 · Dua Potret',
    handwrittenNote: 'Catatan pendek di pinggir foto',
    layoutType: 'multi-photo-margin-notes',
    paperTint: 'warm-linen',
    polaroids: [
      {
        id: 'pol-12a',
        image: '/assets/photos/memories/memory-02.svg',
        title: 'Jalan Santai',
        date: 'Pagi Cerah',
        location: 'Sudut Jalan',
        caption: 'Langkah ringan di hari baik',
        story:
          'Hal-hal kecil di sepanjang jalan kadang punya cerita lucunya sendiri kalau diingat lagi.',
        aspect: 'square',
        size: 'sm',
        rotation: 2.5,
        tape: 'pink',
      },
      {
        id: 'pol-12b',
        image: '/assets/photos/memories/memory-04.svg',
        title: 'Gerimis Tipis',
        date: 'Sore Teduh',
        location: 'Beranda',
        caption: 'Teh & suara hujan',
        story:
          'Nggak perlu rencana besar—cukup ngobrol santai sambil nunggu hujan reda.',
        aspect: 'square',
        size: 'sm',
        rotation: -3.1,
        tape: 'gold',
      },
    ],
    decorations: [
      { kind: 'wildflower', position: 'top-right', animate: 'sway' },
      { kind: 'paperclip', position: 'mid-left', rotation: 8 },
    ],
  },

  // SPREAD 7 — MORE THAN MEMORIES
  {
    id: 'page-13',
    pageNumber: 13,
    spreadNumber: 7,
    spreadTheme: 'Spread 7 · More Than Memories',
    title: 'Momen Perayaan',
    subtitle: 'Bab 13 · Bingkai Utama',
    handwrittenNote: 'Bukan cuma foto, tapi rasa syukur yang pengin disimpan',
    bodyCopy:
      'Satu halaman khusus untuk merayakan hari baik dan doa-doa tulus buat kamu.',
    layoutType: 'central-heirloom-frame',
    paperTint: 'ivory',
    polaroids: [
      {
        id: 'pol-13',
        image: '/assets/photos/memories/memory-11.svg',
        title: 'Kue & Harapan Kecil',
        date: 'Bab 13 · Perayaan',
        location: 'Ruang Perayaan',
        caption: 'Lilin menyala & doa baik',
        story:
          'Setiap perayaan rasanya makin bermakna kalau diiringi doa baik untuk kesehatan dan ketenanganmu.',
        aspect: 'landscape',
        size: 'lg',
        rotation: 0.8,
        tape: 'gold',
        stamp: 'CELEBRATE',
      },
    ],
    decorations: [
      { kind: 'star', position: 'top-left', rotation: -10 },
      { kind: 'rose', position: 'top-right', rotation: 10, animate: 'sway' },
      { kind: 'heart', position: 'bottom-left' },
    ],
  },
  {
    id: 'page-14',
    pageNumber: 14,
    spreadNumber: 7,
    spreadTheme: 'Spread 7 · More Than Memories',
    title: 'Sepucuk Jurnal Pribadi',
    subtitle: 'Bab 14 · Surat & Potret',
    handwrittenNote: 'Untuk Wulan, di hari ulang tahunmu',
    bodyCopy:
      'Di sela foto-foto ini, ada beberapa baris kalimat yang ditulis pelan supaya bisa kamu baca lagi kapan saja.',
    layoutType: 'journal-letter-composition',
    paperTint: 'blush-tint',
    envelopeId: 'env-page-14',
    polaroids: [
      {
        id: 'pol-14',
        image: '/assets/photos/memories/memory-14.svg',
        title: 'Untuk Kamu',
        date: '19 Februari',
        location: 'Dunia Kecil Kita',
        caption: 'Selamat ulang tahun, Wulan ♡',
        story:
          'Terima kasih sudah hadir dan membawa begitu banyak warna di hari-hari kita. Semoga hal-hal baik terus mengiringimu ke depan.',
        aspect: 'portrait',
        size: 'sm',
        rotation: -2.6,
        tape: 'pink',
        sticker: 'heart',
      },
    ],
    decorations: [
      { kind: 'ribbon', position: 'top-left' },
      { kind: 'butterfly', position: 'bottom-right', animate: 'float' },
    ],
  },

  // SPREAD 8 — FOREVER GROWING
  {
    id: 'page-15',
    pageNumber: 15,
    spreadNumber: 8,
    spreadTheme: 'Spread 8 · Forever Growing',
    title: 'Yang Terus Bertumbuh',
    subtitle: 'Bab 15 · Rangkaian Cerita',
    handwrittenNote: 'Makin banyak hari dilewati, makin banyak ceritanya',
    layoutType: 'memory-constellation-grid',
    paperTint: 'sage-tint',
    polaroids: [
      {
        id: 'pol-15a',
        image: '/assets/photos/memories/memory-15.svg',
        title: 'Musim yang Berganti',
        date: 'Bab 15 · Bertumbuh',
        location: 'Sepanjang Waktu',
        caption: 'Tumbuh pelan seiring waktu',
        story:
          'Setiap waktu yang lewat bawa pelajarannya masing-masing, dan foto-foto ini jadi pengingat sejauh apa kita melangkah.',
        aspect: 'landscape',
        size: 'sm',
        rotation: -2.2,
        tape: 'sage',
      },
      {
        id: 'pol-15b',
        image: '/assets/photos/memories/memory-12.svg',
        title: 'Rencana Ke Depan',
        date: 'Menuju Esok',
        location: 'Halaman Baru',
        caption: 'Untuk hari-hari yang menunggu',
        story:
          'Masih banyak halaman kosong yang siap diisi sama cerita dan perjalanan baru nanti.',
        aspect: 'square',
        size: 'sm',
        rotation: 3.1,
        tape: 'gold',
        sticker: 'star',
      },
    ],
    decorations: [
      { kind: 'branch', position: 'top-right', animate: 'sway' },
      { kind: 'daisy', position: 'bottom-left', animate: 'sway' },
    ],
  },
  {
    id: 'page-16',
    pageNumber: 16,
    spreadNumber: 8,
    spreadTheme: 'Spread 8 · Forever Growing',
    title: 'Ruang Tenang & Refleksi',
    subtitle: 'Bab 16 · Pesan Hati',
    handwrittenNote: 'Terima kasih sudah jadi bagian penting dari cerita ini',
    bodyCopy:
      'Bukan cuma soal seberapa banyak foto yang terkumpul, tapi soal rasa nyaman untuk terus pulang ke cerita yang sama.',
    layoutType: 'reflective-keepsake-quote',
    paperTint: 'ivory',
    envelopeId: 'env-page-16',
    polaroids: [
      {
        id: 'pol-16',
        image: '/assets/photos/memories/memory-16.svg',
        title: 'Ruang Tenang',
        date: 'Bab 16 · Refleksi',
        location: 'Sudut Hati',
        caption: 'Nyaman tanpa perlu banyak kata',
        story:
          'Kadang kedekatan paling kerasa justru waktu diam bareng pun rasanya tetap tenang dan nggak canggung.',
        aspect: 'square',
        size: 'md',
        rotation: 1.8,
        tape: 'pink',
        pinColor: '#743D4A',
      },
    ],
    decorations: [
      { kind: 'cat', position: 'bottom-left', rotation: -2 },
      { kind: 'rose', position: 'top-left', animate: 'sway' },
    ],
  },

  // SPREAD 9 — TO BE CONTINUED (Page 17 + complementary decorative closing side)
  {
    id: 'page-17',
    pageNumber: 17,
    spreadNumber: 9,
    spreadTheme: 'Spread 9 · To Be Continued',
    title: 'Lembar Ketujuh Belas',
    subtitle: 'Bab 17 · Sampai Hari Berikutnya',
    handwrittenNote: 'Semua halaman ini cuma pembuka buat cerita kita ke depannya ♡',
    bodyCopy:
      'Makasih ya sudah membaca sampai halaman terakhir. Selamat ulang tahun, Wulan—semoga hal-hal baik terus dekat sama kamu.',
    layoutType: 'final-chapter-finale',
    paperTint: 'warm-linen',
    envelopeId: 'env-page-17',
    polaroids: [
      {
        id: 'pol-17',
        image: '/assets/photos/memories/memory-17.svg',
        title: 'Lembar Selanjutnya',
        date: '19 Februari · ∞',
        location: 'Masa Depan Kita',
        caption: 'Untuk cerita yang terus berlanjut',
        story:
          'Halaman ketujuh belas ini bukan penutup, tapi awal buat lebih banyak momen seru yang bakal kita tulis nanti.',
        aspect: 'landscape',
        size: 'md',
        rotation: -1.5,
        tape: 'gold',
        stamp: 'TO BE CONTINUED',
      },
    ],
    decorations: [
      { kind: 'butterfly', position: 'top-right', animate: 'float' },
      { kind: 'star', position: 'bottom-left' },
      { kind: 'heart', position: 'top-left' },
    ],
  },
];
