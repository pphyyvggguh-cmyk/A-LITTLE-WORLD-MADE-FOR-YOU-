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
import { BookCornerOrnamentSVG } from '../components/storybook/StorybookIllustrations';
import { FLOWERS_DATA } from '../data/flowers';
import { HUB_CARD_REACTIONS } from '../data/miniOktaf';
import { useContentStore } from '../store/useContentStore';
import { AppSection, useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';

export type HubChapterId = Exclude<AppSection, 'password' | 'welcome' | 'hub' | 'reward'>;

interface HubChapterEntry {
  id: HubChapterId;
  number: string;
  title: string;
  subtitle: string;
  handNote: string;
  accent: string;
  icon: typeof BookHeart;
}

const BOOK_TOC_CHAPTERS: HubChapterEntry[] = [
  {
    id: 'story',
    number: '01',
    title: 'Our Story',
    subtitle: '17 Halaman Scrapbook Kenangan',
    handNote: 'Polaroid, selipan catatan, dan amplop kecil',
    accent: '#A6533B',
    icon: BookHeart,
  },
  {
    id: 'world',
    number: '02',
    title: 'Our World',
    subtitle: 'Bola Dunia 3D & 20 Kota',
    handNote: 'Putar globe dan terbangkan rute impian',
    accent: '#455342',
    icon: Globe2,
  },
  {
    id: 'letters',
    number: '03',
    title: 'Birthday Letters',
    subtitle: 'Surat & Doa Pribadi',
    handNote: 'Amplop bersegel lilin buat dibaca santai',
    accent: '#743D4A',
    icon: Mail,
  },
  {
    id: 'video',
    number: '04',
    title: 'Birthday Video',
    subtitle: 'Ruang Putar Khusus · Tiket 19.02',
    handNote: 'Video ucapan spesial untuk ulang tahunmu',
    accent: '#C4A574',
    icon: Film,
  },
  {
    id: 'voices',
    number: '05',
    title: 'Voices of Love ♡',
    subtitle: 'Taman Suara Sahabat',
    handNote: 'Dengarkan doa hangat dari teman terdekatmu',
    accent: '#743D4A',
    icon: Flower2,
  },
  {
    id: 'wishlist',
    number: '06',
    title: 'Our Future Wishlist ♡',
    subtitle: 'Jurnal Impian Masa Depan',
    handNote: 'Rencana kecil yang pengen dijalanin bareng',
    accent: '#455342',
    icon: CalendarHeart,
  },
  {
    id: 'postcards',
    number: '07',
    title: 'Postcards From The Future ♡',
    subtitle: 'Surat Tersegel Waktu',
    handNote: 'Kartu pos yang menunggu hari bukanya',
    accent: '#A6533B',
    icon: Send,
  },
];

export function Hub() {
  const navigateTo = useStore((s) => s.navigateTo);
  const setOktafDialogue = useStore((s) => s.setOktafDialogue);
  const collectedFlowers = useStore((s) => s.collectedFlowers);
  const questDiscovered = useStore((s) => s.questDiscovered);
  const rewardClaimed = useStore((s) => s.rewardClaimed);
  const visitedSections = useStore((s) => s.visitedSections);
  const setQuestModalOpen = useStore((s) => s.setQuestModalOpen);
  const replayBookIntro = useStore((s) => s.replayBookIntro);
  const hubCardReactions = useContentStore((s) => s.miniOktaf.hubCardReactions);

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
      className="book-desk-surface min-h-full w-full flex flex-col justify-center px-3 sm:px-6 lg:px-10 pt-4 sm:pt-6 pb-28 sm:pb-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
        className="w-full max-w-[1100px] mx-auto"
      >
        {/* Open Hardcover Book Folio Container */}
        <div className="book-open-binding relative rounded-2xl p-1.5 sm:p-3 md:p-4">
          {/* Silk Ribbon Bookmark */}
          <span
            aria-hidden="true"
            className="hidden sm:block pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-3 h-5 bg-gradient-to-b from-[#A6533B] to-[#743D4A] shadow-sm [clip-path:polygon(0_0,100%_0,100%_100%,50%_72%,0_100%)]"
          />

          {/* Stitched Side Paper Stack Edges */}
          <div
            aria-hidden="true"
            className="hidden sm:block pointer-events-none absolute top-3.5 bottom-3.5 left-1.5 w-2 rounded-l-md book-paper-stack-left border-l border-[#38271F]/25"
          />
          <div
            aria-hidden="true"
            className="hidden sm:block pointer-events-none absolute top-3.5 bottom-3.5 right-1.5 w-2 rounded-r-md book-paper-stack-right border-r border-[#38271F]/25"
          />

          {/* Two Facing Storybook Pages */}
          <div className="relative bg-[#EDE1CF] rounded-xl p-0.5 sm:p-1 shadow-inner overflow-hidden">
            <div className="relative grid grid-cols-1 lg:grid-cols-2">
              {/* Central Spine Shadow on Desktop */}
              <div
                aria-hidden="true"
                className="hidden lg:block book-spine-shadow pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 z-20"
              />

              {/* LEFT FOLIO — Title Page, Dedication, Birth & Anniversary Keepsakes, Primary CTA */}
              <section
                aria-label="Halaman Pembuka Buku"
                className="book-page-left relative bg-[#FBF6EE] rounded-t-lg lg:rounded-t-none lg:rounded-l-lg p-5 sm:p-7 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#38271F]/12 flex flex-col justify-between gap-5"
              >
                <BookCornerOrnamentSVG className="pointer-events-none absolute top-3 left-3 w-5 h-5 opacity-45" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="editorial-kicker">
                      Bab 00 · 19 Februari · Untuk Wulan
                    </span>
                    <HiddenFlowerSpot flowerId="flower-sakura" />
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#38271F] leading-[1.14]">
                      A Little World Made For You ♡
                    </h1>
                    <p className="text-sm sm:text-[15px] text-[#38271F]/78 leading-relaxed max-w-md">
                      Buku kecil ini disusun bab demi bab—berisi foto, catatan perjalanan, surat pribadi, suara sahabat, dan rencana kita ke depan. Buka pelan-pelan atau geser ke kanan untuk membalik bab.
                    </p>
                  </div>

                  {/* Distinct Birthday & Relationship Anniversary Keepsakes */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="rounded-lg border border-[#38271F]/12 bg-[#F4EBDD]/75 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A6533B]">
                        Ulang Tahunmu
                      </p>
                      <p className="mt-0.5 font-serif text-base font-semibold text-[#38271F]">
                        19 Februari
                      </p>
                      <p className="text-[11px] text-[#38271F]/62">
                        Hari spesialmu, Wulan ♡
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#38271F]/12 bg-[#F4EBDD]/75 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#455342]">
                        Hari Jadian Kita
                      </p>
                      <p className="mt-0.5 font-serif text-base font-semibold text-[#38271F]">
                        2 Mei 2026
                      </p>
                      <p className="text-[11px] text-[#38271F]/62">
                        Awal babak baru kita
                      </p>
                    </div>
                  </div>
                </div>

                {/* Left Folio Bottom: Primary Action + Secret Quest Whisper */}
                <div className="space-y-3 pt-2 border-t border-[#38271F]/10">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      data-testid="hub-start-story-btn"
                      onClick={() => navigateTo('story')}
                      onMouseEnter={() => handleCardHover('story')}
                      className="min-h-[46px] px-5 py-2.5 rounded-lg bg-[#38271F] text-[#F4EBDD] text-sm font-medium hover:bg-[#4e382d] active:scale-[0.99] transition-all inline-flex items-center gap-2 shadow-polaroid cursor-pointer"
                    >
                      <span>Buka Bab 01: Our Story</span>
                      <ArrowRight className="w-4 h-4 text-[#E8BFC5]" />
                    </button>

                    {questDiscovered && (
                      <button
                        type="button"
                        onClick={() => setQuestModalOpen(true)}
                        className="min-h-[42px] px-3 py-1.5 rounded-lg border border-[#455342]/25 bg-[#F4EBDD]/80 text-xs font-medium text-[#455342] hover:bg-[#EAE0CF] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#A6533B]" />
                        <span className="tabular-nums">
                          {collectedFlowers.length}/{FLOWERS_DATA.length} Bunga
                        </span>
                      </button>
                    )}
                  </div>

                  {!questDiscovered && (
                    <p className="font-hand text-base sm:text-lg text-[#743D4A]/85 leading-snug">
                      Bisikan jurnal: ketuk Mini Oktaf dua kali kalau penasaran sama 7 bunga tersembunyi...
                    </p>
                  )}
                </div>
              </section>

              {/* RIGHT FOLIO — Clean Interactive Table of Contents Index */}
              <section
                aria-label="Daftar Bab Buku Cerita"
                className="book-page-right relative bg-[#FBF6EE] rounded-b-lg lg:rounded-b-none lg:rounded-r-lg p-5 sm:p-7 lg:p-8 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2 pb-2.5 border-b border-[#38271F]/12">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#743D4A]">
                        Daftar Isi · Chapters
                      </p>
                      <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#38271F]">
                        Pilih Bab Cerita
                      </h2>
                    </div>
                    <span className="font-hand text-base text-[#455342] tabular-nums shrink-0">
                      {visitedSections.length}/{isRewardUnlocked ? 9 : 8} dibuka
                    </span>
                  </div>

                  <nav aria-label="Daftar Bab Dunia Kecil" className="divide-y divide-[#38271F]/8">
                    {BOOK_TOC_CHAPTERS.map((ch) => {
                      const Icon = ch.icon;
                      const isVisited = visitedSections.includes(ch.id);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => navigateTo(ch.id)}
                          onMouseEnter={() => handleCardHover(ch.id)}
                          className="group w-full py-2.5 px-2.5 -mx-2 rounded-lg flex items-center justify-between gap-3 text-left hover:bg-[#EAE0CF]/70 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-7 h-7 rounded-md bg-[#F4EBDD] border border-[#38271F]/12 flex items-center justify-center shrink-0"
                              style={{ color: ch.accent }}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-[11px] font-semibold tabular-nums text-[#743D4A]/80">
                                  {ch.number}
                                </span>
                                <span className="font-serif text-sm sm:text-base font-semibold text-[#38271F] group-hover:text-[#A6533B] transition-colors truncate">
                                  {ch.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#38271F]/62 truncate">
                                {ch.subtitle} — <span className="italic">{ch.handNote}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isVisited && (
                              <span
                                aria-label="Sudah dibuka"
                                className="w-1.5 h-1.5 rounded-full bg-[#455342]"
                              />
                            )}
                            <ArrowRight className="w-4 h-4 text-[#38271F]/40 group-hover:text-[#A6533B] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      );
                    })}

                    {isRewardUnlocked && (
                      <button
                        type="button"
                        onClick={() => navigateTo('reward')}
                        className="group w-full py-2.5 px-2.5 -mx-2 rounded-lg flex items-center justify-between gap-3 text-left bg-[#E8BFC5]/22 hover:bg-[#E8BFC5]/35 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-md bg-[#FBF6EE] border border-[#743D4A]/20 flex items-center justify-center shrink-0 text-[#743D4A]">
                            <Heart className="w-3.5 h-3.5 fill-[#E8BFC5]" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[11px] font-semibold tabular-nums text-[#743D4A]">
                                08
                              </span>
                              <span className="font-serif text-sm sm:text-base font-semibold text-[#38271F] truncate">
                                Secret Meadow
                              </span>
                            </div>
                            <p className="text-[11px] text-[#743D4A] truncate">
                              Hadiah Taman 7 Bunga sudah terbuka ♡
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#743D4A] group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </nav>
                </div>

                {/* Right Folio Bottom Margin */}
                <div className="pt-2.5 border-t border-[#38271F]/10 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-[#38271F]/58">
                    Geser kiri/kanan atau gunakan panah untuk membalik bab.
                  </p>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      data-testid="replay-book-intro-btn"
                      onClick={replayBookIntro}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#38271F]/55 hover:text-[#A6533B] transition-colors min-h-[36px] px-1.5 cursor-pointer"
                      aria-label="Putar ulang animasi pembukaan buku"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Putar Intro</span>
                    </button>
                    <span aria-hidden="true" className="text-[#38271F]/25 text-xs">
                      ·
                    </span>
                    <a
                      href="/admin"
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState(null, '', '/admin');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#38271F]/50 hover:text-[#743D4A] transition-colors shrink-0 min-h-[36px] px-1.5"
                      aria-label="Masuk ke Control Room Admin"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Control Room</span>
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
