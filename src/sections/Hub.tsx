import { motion } from 'motion/react';
import {
  ArrowRight,
  BookHeart,
  CalendarHeart,
  Film,
  Flower2,
  Globe2,
  Heart,
  Lock,
  Mail,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import { HiddenFlowerSpot } from '../components/Flower';
import { BotanicalDivider } from '../components/editorial/StorybookPrimitives';
import { BookCornerOrnamentSVG } from '../components/storybook/StorybookIllustrations';
import { FLOWERS_DATA } from '../data/flowers';
import { DEFAULT_HOMEPAGE_CONFIG } from '../data/homepage';
import { HUB_CARD_REACTIONS } from '../data/miniOktaf';
import { useFirebaseAuth } from '../lib/FirebaseProvider';
import { useContentStore } from '../store/useContentStore';
import { AppSection, useStore } from '../store/useStore';
import {
  EMOTIONAL_REVEAL,
  MOTION_EMOTIONAL,
  MOTION_INTERFACE,
  MOTION_MICRO,
} from '../utils/animation';
import { TOTAL_POLAROIDS, TOTAL_QUEST2_QUESTIONS } from '../utils/quests';

export type HubChapterId = Exclude<AppSection, 'password' | 'welcome' | 'hub' | 'reward'>;

interface HubChapterEntry {
  id: HubChapterId;
  number: string;
  title: string;
  subtitle: string;
  handNote: string;
  accent: string;
  icon: typeof BookHeart;
  featuredSpan?: boolean;
}

const EXPLORE_CHAPTERS: HubChapterEntry[] = [
  {
    id: 'story',
    number: '01',
    title: 'Our Story',
    subtitle: '17 halaman scrapbook kenangan yang bisa dibalik satu per satu.',
    handNote: 'Polaroid, selipan catatan, dan musik latar',
    accent: '#A95F70',
    icon: BookHeart,
    featuredSpan: true,
  },
  {
    id: 'world',
    number: '02',
    title: 'Our World',
    subtitle: 'Bola dunia 3D interaktif dengan 20 kota impian dan rute pesawat.',
    handNote: 'Putar globe dan lihat kartu destinasi',
    accent: '#4E5D49',
    icon: Globe2,
  },
  {
    id: 'letters',
    number: '03',
    title: 'Birthday Letters',
    subtitle: 'Amplop bersegel lilin berisi surat panjang dan doa pribadi.',
    handNote: 'Buka pelan-pelan kapan pun kamu mau',
    accent: '#552E3D',
    icon: Mail,
  },
  {
    id: 'video',
    number: '04',
    title: 'Birthday Video',
    subtitle: 'Ruang putar khusus dengan tiket kenangan untuk hari ulang tahunmu.',
    handNote: 'Video ucapan spesial buat Wulan',
    accent: '#C9A879',
    icon: Film,
  },
  {
    id: 'voices',
    number: '05',
    title: 'Voices of Love ♡',
    subtitle: 'Taman bunga suara berisi doa hangat dari sahabat-sahabatmu.',
    handNote: 'Sentuh tiap bunga untuk memutar suaranya',
    accent: '#A95F70',
    icon: Flower2,
  },
  {
    id: 'wishlist',
    number: '06',
    title: 'Our Future Wishlist ♡',
    subtitle: 'Jurnal impian kecil, tempat yang ingin dituju, dan rencana bareng.',
    handNote: 'Tulis dan rayakan satu per satu',
    accent: '#4E5D49',
    icon: CalendarHeart,
  },
  {
    id: 'postcards',
    number: '07',
    title: 'Postcards From The Future ♡',
    subtitle: 'Kartu pos tersegel waktu yang menunggu hari bukanya tiba.',
    handNote: 'Hadiah kecil untuk dirimu di masa depan',
    accent: '#A95F70',
    icon: Send,
  },
  {
    id: 'jar-of-thoughts',
    number: '08',
    title: 'A Jar Full of Thoughts ♡',
    subtitle: 'Toples kaca berisi titipan surat lembut—satu surat setiap 24 jam.',
    handNote: 'Teman harian penuh doa baik',
    accent: '#552E3D',
    icon: Sparkles,
  },
];

export function Hub() {
  const { isAdmin } = useFirebaseAuth();
  const navigateTo = useStore((s) => s.navigateTo);
  const setOktafDialogue = useStore((s) => s.setOktafDialogue);
  const collectedFlowers = useStore((s) => s.collectedFlowers);
  const collectedPolaroids = useStore((s) => s.collectedPolaroids);
  const questDiscovered = useStore((s) => s.questDiscovered);
  const quest2Step = useStore((s) => s.quest2Step);
  const quest2Completed = useStore((s) => s.quest2Completed);
  const rewardClaimed = useStore((s) => s.rewardClaimed);
  const visitedSections = useStore((s) => s.visitedSections);
  const setQuestModalOpen = useStore((s) => s.setQuestModalOpen);
  const replayBookIntro = useStore((s) => s.replayBookIntro);
  const lockExperience = useStore((s) => s.lockExperience);
  const hubCardReactions = useContentStore((s) => s.miniOktaf.hubCardReactions);
  const homepage = useContentStore((s) => s.homepage);

  const heroMain =
    homepage.heroFrames.find((f) => f.id === 'hero-main') ??
    DEFAULT_HOMEPAGE_CONFIG.heroFrames[0];
  const polaroidTop =
    homepage.heroFrames.find((f) => f.id === 'polaroid-top') ??
    DEFAULT_HOMEPAGE_CONFIG.heroFrames[1];
  const polaroidBottom =
    homepage.heroFrames.find((f) => f.id === 'polaroid-bottom') ??
    DEFAULT_HOMEPAGE_CONFIG.heroFrames[2];
  const featuredMemories =
    homepage.featuredMemories.length > 0
      ? [...homepage.featuredMemories].sort((a, b) => a.order - b.order)
      : DEFAULT_HOMEPAGE_CONFIG.featuredMemories;

  const isRewardUnlocked =
    rewardClaimed || collectedFlowers.length >= FLOWERS_DATA.length;

  const handleCardHover = (id: HubChapterId) => {
    const reaction = hubCardReactions[id] ?? HUB_CARD_REACTIONS[id];
    if (reaction) {
      setOktafDialogue(reaction.pose, reaction.expression, reaction.message);
    }
  };

  return (
    <main
      data-testid="hub-storybook-home"
      className="paper-canvas min-h-full w-full px-4 sm:px-8 pt-6 sm:pt-10 pb-36 md:pb-24 overflow-x-hidden"
    >
      <div className="max-w-6xl mx-auto space-y-14 sm:space-y-20">
        {/* SECTION 1: HYBRID EDITORIAL + SCRAPBOOK HERO */}
        <section
          aria-label="Pembukaan Dunia Kecil Wulan"
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center pt-1 sm:pt-4"
        >
          {/* Left Asymmetric Editorial Copy */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={MOTION_EMOTIONAL}
            className="lg:col-span-6 space-y-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="editorial-kicker">
                19 Februari · Untuk Wulan
              </span>
              <span aria-hidden="true" className="text-[#C9A879]">
                ·
              </span>
              <span className="font-hand text-xl text-[#4E5D49]">
                A Little World Made For You ♡
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="font-serif text-[clamp(2.35rem,5.2vw,4rem)] font-semibold tracking-tight text-[#30272A] leading-[1.06] text-balance">
                Little moments,{' '}
                <span className="italic font-normal text-[#552E3D]">
                  big memories.
                </span>
              </h1>
              <p className="editorial-prose text-base sm:text-lg text-[#6E5F63]">
                A tiny universe filled with stories, photographs, and surprises.
              </p>
            </div>

            {/* Dual Editorial Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                transition={MOTION_MICRO}
                onClick={() => navigateTo('world')}
                onMouseEnter={() => handleCardHover('world')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-sm font-medium hover:bg-[#3f202c] transition-colors inline-flex items-center gap-2 shadow-polaroid cursor-pointer"
              >
                <span>Explore Our World</span>
                <ArrowRight className="w-4 h-4 text-[#EBC9CB]" />
              </motion.button>

              <motion.button
                type="button"
                data-testid="hub-start-story-btn"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                transition={MOTION_MICRO}
                onClick={() => navigateTo('story')}
                onMouseEnter={() => handleCardHover('story')}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-[#FFFDFC] text-[#30272A] border border-[#30272A]/16 text-sm font-medium hover:bg-[#EFE5D8]/70 transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <BookHeart className="w-4 h-4 text-[#A95F70]" />
                <span>Read Our Story</span>
              </motion.button>
            </div>

            {/* Clean Keepsake Milestones Strip (Zero pills, subtle editorial rule) */}
            <div className="pt-4 border-t border-[#30272A]/10 grid grid-cols-2 gap-6 max-w-md">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#A95F70]">
                  Ulang Tahunmu
                </p>
                <p className="mt-0.5 font-serif text-lg font-semibold text-[#30272A]">
                  19 Februari
                </p>
                <p className="text-xs text-[#6E5F63]">Hari spesialmu, Wulan</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#4E5D49]">
                  Hari Jadian Kita
                </p>
                <p className="mt-0.5 font-serif text-lg font-semibold text-[#30272A]">
                  2 Mei 2026
                </p>
                <p className="text-xs text-[#6E5F63]">Awal babak baru kita</p>
              </div>
            </div>
          </motion.div>

          {/* Right Asymmetric 3-Photo Editorial Scrapbook Collage */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...MOTION_EMOTIONAL, delay: 0.12 }}
            className="lg:col-span-6 relative pb-6 sm:pb-8"
          >
            <div className="relative max-w-lg mx-auto">
              {/* Soft blush ambient backdrop glow behind collage */}
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#EBC9CB]/35 via-[#E8BBA5]/20 to-[#A8B29B]/20 pointer-events-none"
              />

              {/* Main Anchor Film Frame */}
              <figure className="relative z-10 w-[82%] sm:w-[78%] editorial-photo-frame -rotate-1 transition-transform duration-300 hover:rotate-0">
                <span
                  aria-hidden="true"
                  className="washi-tape absolute -top-3 left-8 w-20 h-5 -rotate-3 z-20"
                />
                <div className="aspect-[3/4] overflow-hidden rounded-[4px] bg-[#EFE5D8]">
                  <img
                    src={heroMain.image}
                    alt={heroMain.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="mt-2.5 flex items-center justify-between gap-2 px-1">
                  <span className="font-hand text-lg text-[#552E3D]">
                    {heroMain.caption}
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-[#6E5F63]">
                    {heroMain.badgeLabel || 'Vol. 01'}
                  </span>
                </figcaption>
              </figure>

              {/* Secondary Top-Right Polaroid Accent */}
              <figure className="hidden sm:block absolute -top-4 right-0 z-20 w-[44%] editorial-photo-frame rotate-3 shadow-polaroid-lifted transition-transform duration-300 hover:rotate-1">
                <span
                  aria-hidden="true"
                  className="washi-tape-gold absolute -top-2.5 right-6 w-14 h-4 rotate-3 z-20"
                />
                <div className="aspect-[4/3] overflow-hidden rounded-[4px] bg-[#EFE5D8]">
                  <img
                    src={polaroidTop.image}
                    alt={polaroidTop.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="mt-1.5 font-hand text-base text-[#30272A]/85 text-center">
                  {polaroidTop.caption}
                </figcaption>
              </figure>

              {/* Secondary Bottom-Right Polaroid Accent */}
              <figure className="absolute -bottom-3 right-0 sm:right-2 z-20 w-[48%] sm:w-[46%] editorial-photo-frame -rotate-2 shadow-polaroid-lifted transition-transform duration-300 hover:rotate-0">
                <span
                  aria-hidden="true"
                  className="washi-tape-sage absolute -top-2.5 left-6 w-14 h-4 -rotate-2 z-20"
                />
                <div className="aspect-[4/3] overflow-hidden rounded-[4px] bg-[#EFE5D8]">
                  <img
                    src={polaroidBottom.image}
                    alt={polaroidBottom.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="mt-1.5 font-hand text-base text-[#552E3D] text-center">
                  {polaroidBottom.caption}
                </figcaption>
              </figure>
            </div>
          </motion.div>
        </section>

        {/* SECTION 2: PERSONAL WELCOME MESSAGE + HIDDEN FLOWER #1 */}
        <motion.section
          {...EMOTIONAL_REVEAL}
          aria-label="Catatan Pembuka untuk Wulan"
          className="paper-sheet relative p-6 sm:p-10 overflow-hidden"
        >
          <span
            aria-hidden="true"
            className="washi-tape-gold absolute -top-2.5 left-10 w-20 h-4 -rotate-2"
          />
          <BookCornerOrnamentSVG className="pointer-events-none hidden sm:block absolute bottom-3 right-3 w-5 h-5 rotate-180 opacity-40" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="editorial-kicker">Catatan Hangat</span>
                <span aria-hidden="true" className="text-[#C9A879]">
                  ·
                </span>
                <span className="text-xs text-[#4E5D49] font-medium tabular-nums">
                  {visitedSections.length}/{isRewardUnlocked ? 10 : 9} ruang sudah dibuka
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#30272A] leading-snug">
                Selamat datang kembali di dunia kecil kita, Wulan ♡
              </h2>
              <p className="editorial-prose">
                Semua yang ada di sini disusun pelan-pelan buat kamu—dari lembar kenangan, bola dunia impian, surat pribadi, suara sahabat, sampai kejutan-kejutan kecil yang nunggu kamu temukan sendiri.
              </p>
            </div>

            <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-2 md:pt-0">
              <div className="flex items-center gap-3">
                <span className="font-hand text-lg text-[#552E3D]">
                  Ada bunga kecil terselip di sini:
                </span>
                <HiddenFlowerSpot flowerId="flower-sakura" />
              </div>

              {questDiscovered && (
                <button
                  type="button"
                  onClick={() => setQuestModalOpen(true)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#F8F1E8] border border-[#4E5D49]/25 text-xs font-medium text-[#4E5D49] hover:bg-[#EFE5D8] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#A95F70]" />
                  <span className="tabular-nums">
                    Misi Bunga: {collectedFlowers.length}/{FLOWERS_DATA.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.section>

        {/* SECTION 3: EXPLORE OUR LITTLE WORLD (CURATED CHAPTERS DIRECTORY) */}
        <section aria-label="Jelajahi Semua Bagian Dunia Kecil" className="space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#30272A]/10 pb-4">
            <div className="space-y-1">
              <p className="editorial-kicker">Explore Our Little World</p>
              <h2 className="editorial-subheading">
                Semua cerita & sudut kecil yang bisa kamu buka
              </h2>
            </div>
            <p className="font-hand text-xl text-[#552E3D]">
              Pilih mana saja yang mau kamu kunjungi dulu ♡
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXPLORE_CHAPTERS.map((ch, idx) => {
              const Icon = ch.icon;
              const isVisited = visitedSections.includes(ch.id);

              return (
                <motion.button
                  key={ch.id}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...MOTION_INTERFACE, delay: Math.min(idx * 0.04, 0.24) }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigateTo(ch.id)}
                  onMouseEnter={() => handleCardHover(ch.id)}
                  onFocus={() => handleCardHover(ch.id)}
                  className={`group paper-sheet text-left p-5 sm:p-6 flex flex-col justify-between gap-4 hover:shadow-polaroid-lifted transition-shadow cursor-pointer ${
                    ch.featuredSpan ? 'sm:col-span-2 lg:col-span-2 bg-[#FFFDFC]' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-9 h-9 rounded-xl bg-[#F8F1E8] border border-[#30272A]/10 flex items-center justify-center shrink-0"
                          style={{ color: ch.accent }}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-semibold tabular-nums tracking-widest text-[#552E3D]/80">
                          {ch.number}
                        </span>
                      </div>

                      {isVisited && (
                        <span className="text-[11px] font-medium text-[#4E5D49]">
                          Sudah dibuka
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="font-serif text-xl font-semibold text-[#30272A] group-hover:text-[#552E3D] transition-colors">
                        {ch.title}
                      </h3>
                      <p className="text-sm text-[#6E5F63] leading-relaxed">
                        {ch.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#30272A]/8 flex items-center justify-between gap-2">
                    <span className="font-hand text-base text-[#A95F70] truncate">
                      {ch.handNote}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#6E5F63] group-hover:text-[#552E3D] group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </motion.button>
              );
            })}

            {isRewardUnlocked && (
              <motion.button
                type="button"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.99 }}
                transition={MOTION_MICRO}
                onClick={() => navigateTo('reward')}
                className="group rounded-[1.125rem] border border-[#A95F70]/35 bg-[#EBC9CB]/28 text-left p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-polaroid hover:shadow-polaroid-lifted transition-shadow cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#FFFDFC] border border-[#A95F70]/25 flex items-center justify-center text-[#A95F70]">
                      <Heart className="w-4 h-4 fill-[#EBC9CB]" />
                    </span>
                    <span className="text-xs font-semibold tracking-widest text-[#552E3D]">
                      09 · TERBUKA
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-serif text-xl font-semibold text-[#552E3D]">
                      Secret Meadow ♡
                    </h3>
                    <p className="text-sm text-[#30272A]/80 leading-relaxed">
                      Buket lengkap 7 bunga rahasia dan surat perayaan khususmu sudah mekar.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#552E3D]/12 flex items-center justify-between">
                  <span className="font-hand text-base text-[#552E3D]">
                    Buka taman rahasiamu
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#552E3D] group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            )}
          </div>
        </section>

        {/* SECTION 4: FEATURED MEMORIES (CURATED EDITORIAL POLAROIDS) */}
        <section aria-label="Kenangan Pilihan" className="space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#30272A]/10 pb-4">
            <div className="space-y-1">
              <p className="editorial-kicker">Featured Memories</p>
              <h2 className="editorial-subheading">
                Potongan cerita yang selalu ingin diingat
              </h2>
            </div>
            <p className="text-xs text-[#6E5F63]">
              Ketuk kartu foto untuk langsung melompat ke babnya
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {featuredMemories.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.99 }}
                transition={MOTION_MICRO}
                onClick={() => navigateTo(item.target)}
                className="group text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A95F70] rounded-xl"
              >
                <figure
                  className={`editorial-photo-frame transition-transform duration-300 group-hover:rotate-0 ${item.tiltClass}`}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-[4px] bg-[#EFE5D8]">
                    <img
                      src={item.image}
                      alt={item.alt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <figcaption className="pt-3.5 px-1.5 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#A95F70]">
                      {item.kicker}
                    </p>
                    <h3 className="font-serif text-lg font-semibold text-[#30272A] group-hover:text-[#552E3D] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#6E5F63] leading-relaxed">
                      {item.caption}
                    </p>
                  </figcaption>
                </figure>
              </motion.button>
            ))}
          </div>
        </section>

        {/* SECTION 5: LITTLE SURPRISES / SECRET QUEST TEASER */}
        <motion.section
          {...EMOTIONAL_REVEAL}
          aria-label="Kejutan Kecil & Misi Rahasia"
          className="relative rounded-[1.25rem] border border-[#A95F70]/26 bg-gradient-to-br from-[#FFFDFC] via-[#FDF5F3] to-[#F4E6E4] p-6 sm:p-10 shadow-polaroid"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#552E3D]">
                <Sparkles className="w-4 h-4 text-[#A95F70]" />
                <span>Little Surprises · Secret Quests</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#30272A]">
                {questDiscovered
                  ? 'Petualangan rahasia kita sudah terbuka ♡'
                  : 'Ada tiga misi rahasia tersembunyi di balik cerita'}
              </h2>
              <p className="editorial-prose text-sm sm:text-base">
                {questDiscovered
                  ? 'Kumpulkan 7 bunga tersembunyi untuk merangkai buket spesial, jawab 3 pertanyaan tentang kita untuk membuka kotak kado surat, dan temukan 5 Polaroid rahasia untuk galeri hati.'
                  : 'Psst... coba ketuk karakter Mini Oktaf dua kali di pojok kanan bawah kapan pun kamu penasaran. Ada buket bunga, kado rahasia, dan galeri hati menunggumu!'}
              </p>

              {questDiscovered && (
                <div className="pt-1 flex flex-wrap items-center gap-4 text-xs font-medium text-[#552E3D] tabular-nums">
                  <span>
                    Bunga: {collectedFlowers.length}/{FLOWERS_DATA.length}
                  </span>
                  <span aria-hidden="true" className="text-[#C9A879]">
                    ·
                  </span>
                  <span>
                    Pertanyaan:{' '}
                    {quest2Completed
                      ? `${TOTAL_QUEST2_QUESTIONS}/${TOTAL_QUEST2_QUESTIONS}`
                      : `${quest2Step}/${TOTAL_QUEST2_QUESTIONS}`}
                  </span>
                  <span aria-hidden="true" className="text-[#C9A879]">
                    ·
                  </span>
                  <span>
                    Polaroid Hati: {collectedPolaroids.length}/{TOTAL_POLAROIDS}
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0">
              {questDiscovered ? (
                <button
                  type="button"
                  onClick={() => setQuestModalOpen(true)}
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-sm font-medium hover:bg-[#3f202c] transition-colors inline-flex items-center gap-2 shadow-polaroid cursor-pointer"
                >
                  <Flower2 className="w-4 h-4 text-[#EBC9CB]" />
                  <span>Buka Secret Quests</span>
                </button>
              ) : (
                <span className="font-hand text-xl text-[#552E3D] block">
                  Petunjuk: ketuk Mini Oktaf 2× ♡
                </span>
              )}
            </div>
          </div>
        </motion.section>

        {/* SECTION 6: CLOSING MESSAGE & CLEAN FOOTER */}
        <footer className="pt-4 space-y-6 text-center">
          <BotanicalDivider className="max-w-sm mx-auto" />

          <div className="max-w-xl mx-auto space-y-2">
            <p className="font-serif italic text-lg sm:text-xl text-[#30272A]">
              &ldquo;For every page we have written, and every quiet morning yet to come.&rdquo;
            </p>
            <p className="text-xs text-[#6E5F63]">
              A Little World Made For You ♡ · Untuk Wulan, dengan segala doa terbaik
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#6E5F63]">
            <button
              type="button"
              data-testid="replay-book-intro-btn"
              onClick={replayBookIntro}
              className="min-h-[40px] px-2.5 inline-flex items-center gap-1.5 hover:text-[#552E3D] transition-colors cursor-pointer"
              aria-label="Putar ulang animasi pembukaan buku"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Putar Intro</span>
            </button>

            <span aria-hidden="true" className="text-[#30272A]/25">
              ·
            </span>

            <button
              type="button"
              onClick={lockExperience}
              className="min-h-[40px] px-2.5 inline-flex items-center gap-1.5 hover:text-[#552E3D] transition-colors cursor-pointer"
              aria-label="Kunci kembali undangan"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci Buku</span>
            </button>

            {isAdmin && (
              <>
                <span aria-hidden="true" className="text-[#30272A]/25">
                  ·
                </span>
                <a
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, '', '/admin');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="min-h-[40px] px-2.5 inline-flex items-center gap-1.5 text-[#552E3D] hover:text-[#A95F70] font-medium transition-colors"
                  aria-label="Masuk ke Control Room Admin"
                >
                  <span>Control Room</span>
                </a>
              </>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}
