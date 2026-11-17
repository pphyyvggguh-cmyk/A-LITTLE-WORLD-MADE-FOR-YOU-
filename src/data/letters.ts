export interface BirthdayLetter {
  id: string;
  title: string;
  recipient: string;
  sender: string;
  dateLabel: string;
  stampText: string;
  sealColor: string;
  preview: string;
  paragraphs: string[];
  closing: string;
}

/**
 * Editable collection of personal Birthday Letters.
 * Update these messages directly without touching UI components.
 */
export const LETTERS_DATA: BirthdayLetter[] = [
  {
    id: 'letter-01',
    title: 'Untuk Hari Ulang Tahunmu',
    recipient: 'Wulan',
    sender: 'Oktaf',
    dateLabel: '02 April 2026',
    stampText: 'WULAN · 02.04',
    sealColor: '#A6533B',
    preview: 'Selamat ulang tahun ya, Wulan. Semoga di usia barumu langkahmu terasa lebih ringan...',
    paragraphs: [
      'Selamat ulang tahun ya, Wulan.',
      'Di hari spesialmu ini, aku cuma pengen doain hal-hal baik: semoga kamu sehat terus, hatimu tenang, dan hal-hal yang lagi kamu usahain bisa dimudahkan jalannya.',
      'Website kecil ini aku bikin biar kapan pun kamu lagi capek atau pengen senyum sebentar, kamu bisa mampir ke sini dan ingat kalau selalu ada yang doain kebaikan buat kamu.',
      'Jangan lupa jaga kesehatan, jangan telat makan, dan tetap jadi Wulan yang aku kenal ya.',
    ],
    closing: 'Dengan doa paling tulus, ♡',
  },
  {
    id: 'letter-02',
    title: 'Tentang Hal-Hal Kecil',
    recipient: 'Wulan',
    sender: 'Catatan Tengah Malam',
    dateLabel: 'Surat Kedua',
    stampText: 'CATATAN · 02',
    sealColor: '#743D4A',
    preview: 'Terima kasih sudah sabar dan bikin hari-hari biasa terasa lebih berwarna...',
    paragraphs: [
      'Kadang yang paling bikin kangen bukan momen besarnya, tapi obrolan ringan yang bikin lupa waktu dan tawa kecil di sela hari yang sibuk.',
      'Terima kasih ya sudah hadir dengan caramu yang lembut, perhatianmu yang tulus, dan tenang yang sering kamu bawa tanpa sadar.',
    ],
    closing: 'Selalu bersyukur kenal kamu,',
  },
  {
    id: 'letter-03',
    title: 'Mimpi & Perjalanan Kita',
    recipient: 'Wulan',
    sender: 'Pos Udara',
    dateLabel: 'Surat Ketiga',
    stampText: 'AIR MAIL · 20',
    sealColor: '#455342',
    preview: 'Dua puluh titik di bola dunia itu bukan cuma pin di peta, tapi harapan kecil...',
    paragraphs: [
      'Kalau kamu sudah buka halaman Our World, di sana ada dua puluh kota yang pengen aku tandai bareng kamu.',
      'Semoga suatu saat nanti, satu per satu tempat di peta itu beneran bisa kita datangi—bukan cuma gambar Polaroid di layar, tapi jadi foto beneran di album kita.',
      'Pelan-pelan aja, yang penting kita terus melangkah dengan baik dan saling dukung.',
    ],
    closing: 'Sampai ketemu di perjalanan berikutnya,',
  },
  {
    id: 'letter-04',
    title: 'Kapan Pun Kamu Lelah',
    recipient: 'Wulan',
    sender: 'Simpanan Hati',
    dateLabel: 'Surat Keempat',
    stampText: 'KEEP · SAFE',
    sealColor: '#C4A574',
    preview: 'Kalau suatu hari rasanya berat, buka lagi surat ini dan istirahat sebentar ya...',
    paragraphs: [
      'Nggak semua hari harus berjalan mulus, dan nggak apa-apa kalau sesekali kamu merasa capek atau butuh jeda dari ramainya sekitar.',
      'Kamu nggak harus selalu sempurna untuk tetap berharga. Kamu udah berjuang sejauh ini dengan hebat kok.',
      'Tarik napas pelan, istirahat secukupnya, dan ingat: ruang kecil ini selalu terbuka kapan pun kamu mau mampir lagi.',
    ],
    closing: 'Peluk hangat dari jauh, ♡',
  },
];
