export type OktafPose =
  | 'standing'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'sitting'
  | 'sleeping'
  | 'waving'
  | 'pointing'
  | 'gift'
  | 'cake'
  | 'peeking'
  | 'cheering'
  | 'birthday_cake'
  | 'globe'
  | 'heart'
  | 'curious'
  | 'celebrating'
  | 'relaxing';

export type OktafExpression =
  | 'normal'
  | 'happy'
  | 'laughing'
  | 'surprised'
  | 'pouty'
  | 'shy'
  | 'sleepy'
  | 'wink';

export interface OktafDialogueEntry {
  pose: OktafPose;
  expression: OktafExpression;
  message: string;
}

export const OKTAF_POSE_PATHS: Record<OktafPose, string> = {
  standing: '/assets/characters/poses/standing.png',
  walking: '/assets/characters/poses/walking.png',
  running: '/assets/characters/poses/running.png',
  jumping: '/assets/characters/poses/jumping.png',
  sitting: '/assets/characters/poses/sitting.png',
  sleeping: '/assets/characters/poses/sleeping.png',
  waving: '/assets/characters/poses/waving.png',
  pointing: '/assets/characters/poses/pointing.png',
  gift: '/assets/characters/poses/gift.png',
  cake: '/assets/characters/poses/cake.png',
  peeking: '/assets/characters/poses/peeking.png',
  cheering: '/assets/characters/poses/cheering.png',
  birthday_cake: '/assets/characters/poses/birthday_cake.png',
  globe: '/assets/characters/poses/globe.png',
  heart: '/assets/characters/poses/heart.png',
  curious: '/assets/characters/poses/curious.png',
  celebrating: '/assets/characters/poses/celebrating.png',
  relaxing: '/assets/characters/poses/relaxing.png',
};

export const OKTAF_EXPRESSION_PATHS: Record<OktafExpression, string> = {
  normal: '/assets/characters/expressions/normal.png',
  happy: '/assets/characters/expressions/happy.png',
  laughing: '/assets/characters/expressions/laughing.png',
  surprised: '/assets/characters/expressions/surprised.png',
  pouty: '/assets/characters/expressions/pouty.png',
  shy: '/assets/characters/expressions/shy.png',
  sleepy: '/assets/characters/expressions/sleepy.png',
  wink: '/assets/characters/expressions/wink.png',
};

export const SECTION_DIALOGUES: Record<string, OktafDialogueEntry> = {
  welcome: {
    pose: 'waving',
    expression: 'happy',
    message: 'Haii Wulan! Akhirnya datang juga. Selamat ulang tahun ya ♡',
  },
  hub: {
    pose: 'pointing',
    expression: 'happy',
    message: 'Selamat datang di sini, Wulan. Mau buka bagian yang mana dulu nih?',
  },
  story: {
    pose: 'heart',
    expression: 'happy',
    message: 'Di buku ini ada banyak potongan foto dan catatan kecil. Pelan-pelan aja bukanya ya.',
  },
  world: {
    pose: 'globe',
    expression: 'wink',
    message: 'Ini daftar kota yang suatu hari nanti seru banget kalau kita datangi beneran!',
  },
  letters: {
    pose: 'gift',
    expression: 'shy',
    message: 'Ada beberapa surat yang aku simpan di amplop sini buat kamu baca...',
  },
  video: {
    pose: 'birthday_cake',
    expression: 'happy',
    message: 'Duduk santai dulu ya, ada satu video ucapan yang aku siapin buat kamu.',
  },
  videoEnded: {
    pose: 'heart',
    expression: 'wink',
    message: 'Gimana videonya? Mau putar ulang atau lanjut lihat bagian lain? ♡',
  },
  voices: {
    pose: 'cheering',
    expression: 'happy',
    message: 'Di sini ada suara teman-temanmu yang ikut nitip ucapan ulang tahun ♡',
  },
  wishlist: {
    pose: 'heart',
    expression: 'happy',
    message: 'Tempat kita nyatet hal-hal kecil dan rencana seru yang pengen dicoba bareng ♡',
  },
  postcards: {
    pose: 'gift',
    expression: 'shy',
    message: 'Kartu pos yang masih tersegel ini baru bisa dibuka pas harinya nanti ya ♡',
  },
  reward: {
    pose: 'celebrating',
    expression: 'laughing',
    message: 'Yeay, ketujuh bunganya ketemu semua! Makasih udah keliling sampai sini ya ♡',
  },
};

export const HUB_CARD_REACTIONS: Record<string, OktafDialogueEntry> = {
  story: {
    pose: 'heart',
    expression: 'happy',
    message: 'Yuk lihat halaman demi halaman di Memory Book!',
  },
  world: {
    pose: 'globe',
    expression: 'wink',
    message: 'Mau terbang ke kota mana dulu hari ini?',
  },
  letters: {
    pose: 'gift',
    expression: 'shy',
    message: 'Setiap amplop di sini punya isi dan doa sendiri-sendiri.',
  },
  video: {
    pose: 'birthday_cake',
    expression: 'happy',
    message: 'Ada pesan video spesial yang nunggu buat diputar di sini.',
  },
  voices: {
    pose: 'cheering',
    expression: 'happy',
    message: 'Dengarin ucapan suara dari sahabat-sahabat terdekatmu di sini!',
  },
  wishlist: {
    pose: 'heart',
    expression: 'wink',
    message: 'Catatan mimpi dan hal-hal seru yang pengen kita jalanin berdua.',
  },
  postcards: {
    pose: 'gift',
    expression: 'happy',
    message: 'Surat-surat kecil yang disimpan khusus buat dibuka di tanggal tertentu.',
  },
};

export const CURIOUS_TAP_REACTIONS: OktafDialogueEntry[] = [
  {
    pose: 'curious',
    expression: 'surprised',
    message: 'Eh, kok dicolek? Coba ketuk dua kali deh, ada sesuatu yang tersembunyi...',
  },
  {
    pose: 'peeking',
    expression: 'wink',
    message: 'Psst, ketuk aku dua kali agak cepat kalau mau lihat misi rahasianya ♡',
  },
  {
    pose: 'cheering',
    expression: 'laughing',
    message: 'Hehe, santai aja Wulan, aku di sini nemenin kamu lihat-lihat kok.',
  },
  {
    pose: 'sitting',
    expression: 'shy',
    message: 'Kalau aku nutupin tulisan, pencet aja tanda panah kecil buat minggirin aku sebentar ya~',
  },
];

export const QUEST_DIALOGUES = {
  discovered: {
    pose: 'peeking',
    expression: 'surprised',
    message: 'Wah, ketemu juga nih pintu rahasianya!',
  } satisfies OktafDialogueEntry,
  flowerCollected: (count: number, total: number, flowerName: string): OktafDialogueEntry => ({
    pose: count >= total ? 'celebrating' : 'jumping',
    expression: count >= total ? 'laughing' : 'happy',
    message:
      count >= total
        ? 'Yeay, ketujuh bunganya lengkap semua! ♡'
        : `Asik, ketemu ${flowerName}! (${count}/${total}) Yuk cari sisa bunganya lagi!`,
  }),
};
