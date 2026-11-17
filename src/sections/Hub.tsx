import { motion } from 'motion/react';
import {
  ArrowRight,
  BookHeart,
  CalendarDays,
  CalendarHeart,
  Film,
  Flower2,
  Globe2,
  Lock,
  Mail,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  BotanicalDivider,
  EditorialHeader,
  EditorialSectionShell,
} from '../components/editorial/StorybookPrimitives';
import { HiddenFlowerSpot } from '../components/Flower';
import { HUB_CARD_REACTIONS } from '../data/miniOktaf';
import { FLOWERS_DATA } from '../data/flowers';
import { useContentStore } from '../store/useContentStore';
import { AppSection, useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';

export type HubChapterId = Exclude<AppSection, 'password' | 'welcome' | 'hub' | 'reward'>;

interface HubChapterSpec {
  id: HubChapterId;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  handNote: string;
  accent: string;
  tapeClass: string;
  icon: typeof BookHeart;
  illustration:
    | 'polaroids'
    | 'globe'
    | 'envelope'
    | 'cinema'
    | 'voices'
    | 'wishlist'
    | 'postcards'
    | 'calendar';
}

const HUB_CHAPTERS: Record<HubChapterId, HubChapterSpec> = {
  story: {
    id: 'story',
    number: '01',
    title: 'Our Story',
    subtitle: '17 Halaman Scrapbook Kenangan',
    description:
      'Kumpulan Polaroid, catatan kecil di tepi kertas, dan potongan momen yang pengin terus disimpan rapi.',
    handNote: 'Buka pelan-pelan dari halaman pertama sampai ketujuh belas ♡',
    accent: '#A6533B',
    tapeClass: 'washi-tape',
    icon: BookHeart,
    illustration: 'polaroids',
  },
  world: {
    id: 'world',
    number: '02',
    title: 'Our World',
    subtitle: 'Bola Dunia 3D & 20 Kota',
    description:
      'Putar bola dunia kecil ini, lihat 20 kota tujuan, dan terbangkan pesawat mungil lintas benua.',
    handNote: 'Setiap kota punya catatan kecilnya sendiri.',
    accent: '#455342',
    tapeClass: 'washi-tape-sage',
    icon: Globe2,
    illustration: 'globe',
  },
  letters: {
    id: 'letters',
    number: '03',
    title: 'Birthday Letters',
    subtitle: 'Surat & Doa Pribadi',
    description:
      'Beberapa amplop bersegel lilin berisi surat panjang dan doa ulang tahun khusus buat kamu.',
    handNote: 'Buka satu per satu pas lagi santai ya.',
    accent: '#743D4A',
    tapeClass: 'washi-tape-gold',
    icon: Mail,
    illustration: 'envelope',
  },
  video: {
    id: 'video',
    number: '04',
    title: 'Birthday Video',
    subtitle: 'Ruang Putar Khusus',
    description:
      'Ruang putar kecil buat menonton pesan video spesial yang disiapkan langsung untuk harimu.',
    handNote: 'Tiket pemutaran pribadi · 02.04.26',
    accent: '#C4A574',
    tapeClass: 'washi-tape',
    icon: Film,
    illustration: 'cinema',
  },
  voices: {
    id: 'voices',
    number: '05',
    title: 'Voices of Love ♡',
    subtitle: 'Taman Suara Sahabat',
    description:
      'Pesan suara dan doa dari orang-orang terdekat yang ikut merayakan ulang tahunmu.',
    handNote: 'Ketuk tiap bunga buat dengar suara mereka.',
    accent: '#743D4A',
    tapeClass: 'washi-tape-gold',
    icon: Flower2,
    illustration: 'voices',
  },
  wishlist: {
    id: 'wishlist',
    number: '06',
    title: 'Our Future Wishlist ♡',
    subtitle: 'Jurnal Impian Masa Depan',
    description:
      'Tempat mencatat keinginan kecil, rencana liburan, dan hal-hal yang pengin dicapai bareng.',
    handNote: 'Dari angan kecil sampai pelan-pelan jadi nyata.',
    accent: '#455342',
    tapeClass: 'washi-tape-sage',
    icon: CalendarHeart,
    illustration: 'wishlist',
  },
  postcards: {
    id: 'postcards',
    number: '07',
    title: 'Postcards From The Future ♡',
    subtitle: 'Surat Tersegel Waktu',
    description:
      'Kartu pos dengan tanggal buka khusus—disimpan dulu sampai hari yang ditunggu tiba.',
    handNote: 'Ada yang baru bisa dibuka nanti.',
    accent: '#A6533B',
    tapeClass: 'washi-tape-gold',
    icon: Send,
    illustration: 'postcards',
  },
  calendar: {
    id: 'calendar',
    number: '08',
    title: 'Our Living Calendar ♡',
    subtitle: 'Almanak Momen & Hari Spesial',
    description:
      'Catatan tanggal ulang tahun, hari-hari berkesan, rencana impian, dan jadwal terbukanya kartu pos.',
    handNote: 'Biar nggak ada tanggal penting yang kelewat.',
    accent: '#455342',
    tapeClass: 'washi-tape',
    icon: CalendarDays,
    illustration: 'calendar',
  },
};

function ChapterVignette({
  type,
  tall = false,
}: {
  type: HubChapterSpec['illustration'];
  tall?: boolean;
}) {
  const viewClass = `w-full ${tall ? 'h-44 sm:h-full sm:min-h-[210px]' : 'h-32 sm:h-36'}`;
  switch (type) {
    case 'polaroids':
      return (
        <svg viewBox="0 0 260 150" preserveAspectRatio="xMidYMid slice" className={viewClass} aria-hidden="true">
          <rect width="260" height="150" fill="#EFE2D0" />
          <g transform="translate(34 18) rotate(-7)">
            <rect width="78" height="96" rx="3" fill="#FBF8F2" stroke="#38271F" strokeOpacity="0.16" />
            <rect x="8" y="8" width="62" height="58" fill="#E8BFC5" opacity="0.72" />
            <circle cx="39" cy="37" r="12" fill="#A6533B" opacity="0.45" />
          </g>
          <g transform="translate(136 22) rotate(6)">
            <rect width="78" height="96" rx="3" fill="#FBF8F2" stroke="#38271F" strokeOpacity="0.16" />
            <rect x="8" y="8" width="62" height="58" fill="#C4A574" opacity="0.58" />
            <path d="M16 56 Q39 30 62 56" fill="none" stroke="#455342" strokeWidth="2.2" />
          </g>
          <path d="M74 26 Q130 50 174 24" fill="none" stroke="#A6533B" strokeWidth="1.6" strokeDasharray="3 3" />
          <circle cx="74" cy="26" r="3.5" fill="#A6533B" />
          <circle cx="174" cy="24" r="3.5" fill="#455342" />
        </svg>
      );
    case 'globe':
      return (
        <svg viewBox="0 0 220 110" preserveAspectRatio="xMidYMid slice" className={viewClass} aria-hidden="true">
          <rect width="220" height="110" fill="#182636" />
          <circle cx="42" cy="24" r="1.3" fill="#F4EBDD" opacity="0.7" />
          <circle cx="184" cy="28" r="1.5" fill="#C4A574" opacity="0.8" />
          <circle cx="164" cy="84" r="1.2" fill="#F4EBDD" opacity="0.55" />
          <circle cx="110" cy="56" r="36" fill="#2A4D69" stroke="#8FB3C9" strokeOpacity="0.4" strokeWidth="1.5" />
          <path d="M88 42 Q102 32 118 44 Q124 56 108 66 Q94 62 88 42 Z" fill="#6F8C67" opacity="0.85" />
          <path d="M125 54 Q138 50 142 66 Q130 78 122 68 Z" fill="#8BA882" opacity="0.8" />
          <path d="M72 48 Q110 14 152 48" fill="none" stroke="#E8BFC5" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="154,48 145,43 147,52" fill="#F4EBDD" />
        </svg>
      );
    case 'envelope':
      return (
        <svg viewBox="0 0 220 110" preserveAspectRatio="xMidYMid slice" className={viewClass} aria-hidden="true">
          <rect width="220" height="110" fill="#EFE2D0" />
          <rect x="46" y="22" width="128" height="70" rx="4" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.18" />
          <path d="M46 22 L110 64 L174 22" fill="none" stroke="#743D4A" strokeOpacity="0.45" strokeWidth="1.5" />
          <circle cx="110" cy="61" r="10" fill="#A6533B" />
          <path d="M110 66 C110 66 104 62 104 59 a3 3 0 0 1 6 -1 a3 3 0 0 1 6 1 C116 62 110 66 110 66 Z" fill="#F4EBDD" />
          <rect x="144" y="29" width="20" height="15" fill="none" stroke="#C4A574" strokeDasharray="2 2" />
        </svg>
      );
    case 'cinema':
      return (
        <svg viewBox="0 0 220 110" preserveAspectRatio="xMidYMid slice" className={viewClass} aria-hidden="true">
          <rect width="220" height="110" fill="#2A1F1A" />
          <rect x="38" y="16" width="144" height="78" rx="4" fill="#FBF6EE" />
          <rect x="46" y="24" width="128" height="62" rx="2" fill="#38271F" />
          <circle cx="110" cy="55" r="16" fill="#A6533B" opacity="0.92" />
          <polygon points="105,47 120,55 105,63" fill="#F4EBDD" />
        </svg>
      );
    case 'voices':
      return (
        <svg viewBox="0 0 220 110" preserveAspectRatio="xMidYMid slice" className={viewClass} aria-hidden="true">
          <rect width="220" height="110" fill="#F5E9EA" />
          <circle cx="70" cy="54" r="24" fill="#E8BFC5" opacity="0.6" />
          <circle cx="145" cy="56" r="22" fill="#C4A574" opacity="0.35" />
          <path d="M70 84 L70 54" stroke="#455342" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="70" cy="48" r="9" fill="#E8BFC5" stroke="#743D4A" strokeWidth="1.2" />
          <circle cx="70" cy="48" r="3.5" fill="#743D4A" />
          <path d="M145 84 L145 58" stroke="#455342" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="145" cy="51" r="8" fill="#D9A74A" stroke="#38271F" strokeWidth="1" />
          <circle cx="145" cy="51" r="3.2" fill="#38271F" />
          <path d="M96 55 Q102 42 108 55 Q114 68 120 55" fill="none" stroke="#A6533B" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'wishlist':
      return (
        <svg viewBox="0 0 220 110" preserveAspectRatio="xMidYMid slice" className={viewClass} aria-hidden="true">
          <rect width="220" height="110" fill="#EAE5D9" />
          <rect x="44" y="16" width="132" height="78" rx="6" fill="#FBF6EE" stroke="#455342" strokeOpacity="0.28" />
          <line x1="62" y1="36" x2="158" y2="36" stroke="#C4A574" strokeOpacity="0.4" strokeWidth="1.5" />
          <line x1="62" y1="54" x2="158" y2="54" stroke="#C4A574" strokeOpacity="0.4" strokeWidth="1.5" />
          <line x1="62" y1="72" x2="136" y2="72" stroke="#C4A574" strokeOpacity="0.4" strokeWidth="1.5" />
          <circle cx="66" cy="36" r="4" fill="#455342" />
          <circle cx="66" cy="54" r="4" fill="#A6533B" />
          <circle cx="66" cy="72" r="4" fill="#E8BFC5" stroke="#743D4A" strokeWidth="1" />
          <path d="M158 64 C158 64 150 58 150 54 a4 4 0 0 1 8 -1.5 a4 4 0 0 1 8 1.5 C166 58 158 64 158 64 Z" fill="#A6533B" />
        </svg>
      );
    case 'postcards':
      return (
        <svg viewBox="0 0 220 110" preserveAspectRatio="xMidYMid slice" className={viewClass} aria-hidden="true">
          <rect width="220" height="110" fill="#F2E6D6" />
          <g transform="rotate(-2 110 55)">
            <rect x="38" y="20" width="144" height="72" rx="4" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.2" />
            <line x1="112" y1="30" x2="112" y2="82" stroke="#38271F" strokeOpacity="0.16" strokeWidth="1.2" />
            <rect x="148" y="27" width="24" height="20" fill="#F4EBDD" stroke="#A6533B" strokeDasharray="2 2" />
            <circle cx="160" cy="37" r="5" fill="#E8BFC5" stroke="#743D4A" strokeWidth="1" />
            <line x1="50" y1="42" x2="98" y2="42" stroke="#743D4A" strokeOpacity="0.45" strokeWidth="1.5" />
            <line x1="50" y1="54" x2="94" y2="54" stroke="#743D4A" strokeOpacity="0.35" strokeWidth="1.5" />
            <line x1="50" y1="66" x2="88" y2="66" stroke="#743D4A" strokeOpacity="0.35" strokeWidth="1.5" />
            <circle cx="145" cy="68" r="10" fill="#743D4A" />
            <path d="M145 73 C145 73 140 69 140 66 a2.6 2.6 0 0 1 5 -1 a2.6 2.6 0 0 1 5 1 C150 69 145 73 145 73 Z" fill="#FBF6EE" />
          </g>
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 220 110" preserveAspectRatio="xMidYMid slice" className={viewClass} aria-hidden="true">
          <rect width="220" height="110" fill="#EDE4D5" />
          <rect x="48" y="16" width="124" height="78" rx="4" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.18" />
          <rect x="48" y="16" width="124" height="20" rx="4" fill="#455342" />
          <text x="110" y="30" textAnchor="middle" fontSize="9" fill="#F4EBDD" fontFamily="serif">APRIL · 2026</text>
          <circle cx="88" cy="58" r="9" fill="#E8BFC5" />
          <text x="88" y="61" textAnchor="middle" fontSize="9" fill="#743D4A" fontWeight="bold">02</text>
          <circle cx="122" cy="58" r="2.2" fill="#C4A574" />
          <circle cx="142" cy="58" r="2.2" fill="#38271F" opacity="0.25" />
          <circle cx="88" cy="76" r="2.2" fill="#38271F" opacity="0.25" />
          <circle cx="122" cy="76" r="2.2" fill="#A6533B" opacity="0.7" />
        </svg>
      );
  }
}

export function Hub() {
  const navigateTo = useStore((s) => s.navigateTo);
  const setOktafDialogue = useStore((s) => s.setOktafDialogue);
  const collectedFlowers = useStore((s) => s.collectedFlowers);
  const questDiscovered = useStore((s) => s.questDiscovered);
  const visitedSections = useStore((s) => s.visitedSections);
  const setQuestModalOpen = useStore((s) => s.setQuestModalOpen);
  const hubCardReactions = useContentStore((s) => s.miniOktaf.hubCardReactions);

  const handleCardHover = (id: HubChapterId) => {
    const reaction = hubCardReactions[id] ?? HUB_CARD_REACTIONS[id];
    if (reaction) {
      setOktafDialogue(reaction.pose, reaction.expression, reaction.message);
    }
  };

  const leadStory = HUB_CHAPTERS.story;
  const featureChapters: HubChapterSpec[] = [HUB_CHAPTERS.world, HUB_CHAPTERS.letters];
  const atmosphereChapters: HubChapterSpec[] = [HUB_CHAPTERS.video, HUB_CHAPTERS.voices];
  const livingChapters: HubChapterSpec[] = [
    HUB_CHAPTERS.wishlist,
    HUB_CHAPTERS.postcards,
    HUB_CHAPTERS.calendar,
  ];

  return (
    <EditorialSectionShell>
      <EditorialHeader
        kicker="Beranda Jurnal · Untuk Wulan"
        metaRight={`${visitedSections.length} bab dibuka · 02 April 2026`}
        title="A Little World Made For You ♡"
        subtitle="Buka bagian mana saja sesuka hatimu—dari cerita, surat, suara sahabat, sampai rencana-rencana kita ke depan."
        ornament={<HiddenFlowerSpot flowerId="flower-sakura" />}
      />

      {/* Chapter 01 Lead Storybook Volume (Asymmetric Feature Folio) */}
      <motion.section
        aria-label="Bab pembuka buku cerita"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        className="mt-6 sm:mt-8"
      >
        <button
          type="button"
          onClick={() => navigateTo(leadStory.id)}
          onMouseEnter={() => handleCardHover(leadStory.id)}
          className="group relative w-full text-left paper-sheet p-5 sm:p-7 hover:shadow-polaroid-lifted transition-shadow cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A6533B]"
        >
          <span
            aria-hidden="true"
            className="washi-tape absolute -top-2.5 left-10 w-20 h-4 -rotate-2"
          />
          <span className="postage-stamp hidden sm:inline-block absolute top-5 right-5 px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase text-[#743D4A] rotate-2">
            BAB PEMBUKA · 17 HALAMAN
          </span>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 rounded-lg overflow-hidden border border-[#38271F]/14 bg-[#EAE0CF]">
              <ChapterVignette type="polaroids" tall />
            </div>

            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#743D4A]">
                <BookHeart className="w-4 h-4 text-[#A6533B]" />
                <span className="tabular-nums">{leadStory.number}</span>
                <span aria-hidden="true">·</span>
                <span>{leadStory.subtitle}</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#38271F] group-hover:text-[#A6533B] transition-colors">
                {leadStory.title}
              </h2>

              <p className="editorial-prose">{leadStory.description}</p>

              <p className="font-hand text-xl text-[#743D4A]">{leadStory.handNote}</p>

              <div className="pt-2 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#38271F] border-b border-[#38271F]/30 pb-0.5 group-hover:text-[#A6533B] group-hover:border-[#A6533B] transition-colors">
                <span>Buka Memory Book</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </button>
      </motion.section>

      {/* Band 2: Places & Personal Letters (Asymmetric 7/5 Spread) */}
      <section
        aria-label="Dunia dan Surat Pribadi"
        className="mt-7 grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {featureChapters.map((card, idx) => {
          const Icon = card.icon;
          const colSpan = idx === 0 ? 'md:col-span-7' : 'md:col-span-5';
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => navigateTo(card.id)}
              onMouseEnter={() => handleCardHover(card.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.08 + idx * 0.06, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.99 }}
              className={`${colSpan} group relative text-left paper-sheet p-5 hover:shadow-polaroid-lifted transition-shadow cursor-pointer flex flex-col justify-between gap-4`}
            >
              <span
                aria-hidden="true"
                className={`${card.tapeClass} absolute -top-2.5 left-7 w-16 h-4 -rotate-1`}
              />

              <div className="space-y-3.5">
                <div className="rounded-lg overflow-hidden border border-[#38271F]/12">
                  <ChapterVignette type={card.illustration} />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#743D4A] tabular-nums">
                      {card.number} · {card.subtitle}
                    </span>
                    <Icon className="w-4 h-4 shrink-0" style={{ color: card.accent }} />
                  </div>
                  <h2 className="mt-1 font-serif text-xl sm:text-2xl font-semibold text-[#38271F] group-hover:text-[#A6533B] transition-colors">
                    {card.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#38271F]/74 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#38271F]/10 flex items-center justify-between text-xs font-semibold text-[#38271F]">
                <span className="font-hand text-base font-normal text-[#455342]">
                  {card.handNote}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>
          );
        })}
      </section>

      {/* Band 3: Cinema & Garden Voices (5/7 Complementary Spread) */}
      <section
        aria-label="Video dan Taman Suara"
        className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6"
      >
        {atmosphereChapters.map((card, idx) => {
          const Icon = card.icon;
          const colSpan = idx === 0 ? 'md:col-span-5' : 'md:col-span-7';
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => navigateTo(card.id)}
              onMouseEnter={() => handleCardHover(card.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.16 + idx * 0.06, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.99 }}
              className={`${colSpan} group relative text-left paper-sheet p-5 hover:shadow-polaroid-lifted transition-shadow cursor-pointer flex flex-col justify-between gap-4`}
            >
              <span
                aria-hidden="true"
                className={`${card.tapeClass} absolute -top-2.5 right-8 w-16 h-4 rotate-2`}
              />

              <div className="space-y-3.5">
                <div className="rounded-lg overflow-hidden border border-[#38271F]/12">
                  <ChapterVignette type={card.illustration} />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#743D4A] tabular-nums">
                      {card.number} · {card.subtitle}
                    </span>
                    <Icon className="w-4 h-4 shrink-0" style={{ color: card.accent }} />
                  </div>
                  <h2 className="mt-1 font-serif text-xl sm:text-2xl font-semibold text-[#38271F] group-hover:text-[#A6533B] transition-colors">
                    {card.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#38271F]/74 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#38271F]/10 flex items-center justify-between text-xs font-semibold text-[#38271F]">
                <span className="font-hand text-base font-normal text-[#743D4A]">
                  {card.handNote}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>
          );
        })}
      </section>

      {/* Band 4: Future Ledger & Living Calendar Trio */}
      <section
        aria-label="Impian, Kartu Pos, dan Almanak Hidup"
        className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {livingChapters.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              type="button"
              onClick={() => navigateTo(card.id)}
              onMouseEnter={() => handleCardHover(card.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.24 + idx * 0.05, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.99 }}
              className="group relative text-left paper-sheet p-5 hover:shadow-polaroid-lifted transition-shadow cursor-pointer flex flex-col justify-between gap-4"
            >
              <span
                aria-hidden="true"
                className={`${card.tapeClass} absolute -top-2.5 left-6 w-14 h-3.5 -rotate-2`}
              />

              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden border border-[#38271F]/12">
                  <ChapterVignette type={card.illustration} />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-[#743D4A] tabular-nums">
                      {card.number} · {card.subtitle}
                    </span>
                    <Icon className="w-4 h-4 shrink-0" style={{ color: card.accent }} />
                  </div>
                  <h2 className="mt-1 font-serif text-xl font-semibold text-[#38271F] group-hover:text-[#A6533B] transition-colors">
                    {card.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#38271F]/74 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#38271F]/10 flex items-center justify-between text-xs font-semibold text-[#38271F]">
                <span>Buka Bab</span>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>
          );
        })}
      </section>

      <BotanicalDivider className="mt-9 mb-5" />

      {/* Secret Quest Progress / Whisper & Control Room Link */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {questDiscovered ? (
          <div className="flex flex-wrap items-center gap-3">
            <Sparkles className="w-4 h-4 text-[#A6533B] shrink-0" />
            <p className="text-sm text-[#38271F]/80">
              Misi Rahasia terbuka:{' '}
              <strong className="font-semibold text-[#38271F] tabular-nums">
                {collectedFlowers.length}/{FLOWERS_DATA.length} Bunga
              </strong>{' '}
              terkumpul.
            </p>
            <button
              type="button"
              onClick={() => setQuestModalOpen(true)}
              className="min-h-[36px] text-xs font-semibold text-[#A6533B] underline underline-offset-4 hover:text-[#743D4A] cursor-pointer whitespace-nowrap"
            >
              Lihat Daftar Misi
            </button>
          </div>
        ) : (
          <p className="font-hand text-lg text-[#38271F]/68">
            Bisikan jurnal: coba ketuk Mini Oktaf dua kali kalau kamu penasaran dengan rahasia kecil di dunia ini...
          </p>
        )}

        <a
          href="/admin"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, '', '/admin');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#38271F]/50 hover:text-[#743D4A] transition-colors shrink-0 min-h-[44px] px-2"
          aria-label="Masuk ke Control Room Admin"
        >
          <Lock className="w-3 h-3" />
          <span>Control Room</span>
        </a>
      </section>
    </EditorialSectionShell>
  );
}
