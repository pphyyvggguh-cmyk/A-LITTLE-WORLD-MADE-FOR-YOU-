import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BookHeart, CalendarHeart, Film, Flower2, Globe2, Mail, Send, Sparkles } from 'lucide-react';
import {
  BookIntroPhase,
  computeIntroTimeline,
  DEFAULT_INTRO_LEAVES,
  INTRO_PHASE_WINDOWS,
} from '../../utils/bookIntro';
import { BookCornerOrnamentSVG } from './StorybookIllustrations';

interface CinematicBookIntroProps {
  onComplete: () => void;
}

const PAPER_TINT_HEX: Record<(typeof DEFAULT_INTRO_LEAVES)[number]['paperTint'], string> = {
  ivory: '#FBF7EF',
  'warm-linen': '#F7EFE1',
  'blush-tint': '#FAF1EE',
  'sage-tint': '#F3F3EB',
};

const FLOATING_MOTES = [
  { left: '14%', top: '20%', size: 7, delay: '0s', tint: '#E8BFC5' },
  { left: '84%', top: '18%', size: 6, delay: '0.6s', tint: '#C4A574' },
  { left: '20%', top: '76%', size: 8, delay: '1.1s', tint: '#C4A574' },
  { left: '80%', top: '72%', size: 6, delay: '0.4s', tint: '#E8BFC5' },
  { left: '34%', top: '12%', size: 5, delay: '1.5s', tint: '#A6533B' },
  { left: '68%', top: '84%', size: 6, delay: '0.9s', tint: '#C4A574' },
];

const PREVIEW_CHAPTERS = [
  { num: '01', title: 'Our Story', accent: '#A6533B', icon: BookHeart },
  { num: '02', title: 'Our World', accent: '#455342', icon: Globe2 },
  { num: '03', title: 'Birthday Letters', accent: '#743D4A', icon: Mail },
  { num: '04', title: 'Birthday Video', accent: '#C4A574', icon: Film },
  { num: '05', title: 'Voices of Love ♡', accent: '#743D4A', icon: Flower2 },
  { num: '06', title: 'Our Future Wishlist ♡', accent: '#455342', icon: CalendarHeart },
  { num: '07', title: 'Postcards From The Future ♡', accent: '#A6533B', icon: Send },
  { num: '08', title: 'A Jar Full of Thoughts ♡', accent: '#743D4A', icon: Sparkles },
];

export function CinematicBookIntro({ onComplete }: CinematicBookIntroProps) {
  const [phase, setPhase] = useState<BookIntroPhase>('closed');

  const rootRef = useRef<HTMLDivElement>(null);
  const deskShadowRef = useRef<HTMLDivElement>(null);
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const leftBindingRef = useRef<HTMLDivElement>(null);
  const leftFolioRef = useRef<HTMLDivElement>(null);
  const rightBindingRef = useRef<HTMLDivElement>(null);
  const spineCreaseRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  const leafRefs = useRef<Array<HTMLDivElement | null>>([]);
  const leafFrontRefs = useRef<Array<HTMLDivElement | null>>([]);
  const leafBackRefs = useRef<Array<HTMLDivElement | null>>([]);
  const leafShadowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const elapsedOffsetRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);
  const phaseRef = useRef<BookIntroPhase>('closed');

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    phaseRef.current = 'complete';
    setPhase('complete');
    onComplete();
  }, [onComplete]);

  // Fast-forward slightly if user taps the closed cover during Phase 1
  const handleBookTap = () => {
    if (phaseRef.current === 'closed' && startTimeRef.current !== null) {
      const elapsedNow = performance.now() - startTimeRef.current + elapsedOffsetRef.current;
      if (elapsedNow < INTRO_PHASE_WINDOWS.coverOpenStartMs) {
        elapsedOffsetRef.current += INTRO_PHASE_WINDOWS.coverOpenStartMs - elapsedNow;
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishIntro();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finishIntro]);

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;

    const applyFrame = (nowMs: number) => {
      if (completedRef.current) return;
      if (startTimeRef.current === null) {
        startTimeRef.current = nowMs;
      }

      const elapsed = nowMs - startTimeRef.current + elapsedOffsetRef.current;
      const frame = computeIntroTimeline(elapsed, DEFAULT_INTRO_LEAVES, reducedMotion);

      if (frame.phase !== phaseRef.current) {
        phaseRef.current = frame.phase;
        setPhase(frame.phase);
      }

      if (rootRef.current) {
        rootRef.current.style.opacity = String(frame.overlayOpacity);
      }

      if (deskShadowRef.current) {
        const closedShift = frame.spineShiftPercent;
        deskShadowRef.current.style.transform = `translate3d(${closedShift}%, 0, 0) scaleX(${frame.closedShadowScale})`;
      }

      if (bookContainerRef.current) {
        bookContainerRef.current.style.transform = `translate3d(${frame.spineShiftPercent}%, 0, 0) scale(${frame.bookScale}) rotateX(${frame.bookTiltXDeg}deg) rotateY(${frame.bookTiltYDeg}deg)`;
      }

      if (leftBindingRef.current) {
        leftBindingRef.current.style.opacity = String(frame.spreadRevealOpacity);
      }
      if (leftFolioRef.current) {
        leftFolioRef.current.style.opacity = '1';
      }
      if (rightBindingRef.current) {
        rightBindingRef.current.style.opacity = '1';
      }
      if (spineCreaseRef.current) {
        spineCreaseRef.current.style.opacity = String(frame.spreadRevealOpacity);
      }

      if (coverRef.current) {
        coverRef.current.style.transform = `translate3d(0, 0, 3px) rotateY(${frame.coverAngleDeg}deg)`;
        coverRef.current.style.visibility = frame.coverOpacity > 0 ? 'visible' : 'hidden';
        coverRef.current.style.zIndex = String(frame.coverZIndex);
      }

      if (hintRef.current) {
        const hintOp =
          frame.phase === 'closed'
            ? 0.85
            : Math.max(0, 1 - (frame.elapsedMs - INTRO_PHASE_WINDOWS.coverOpenStartMs) / 280);
        hintRef.current.style.opacity = String(hintOp);
      }

      for (let i = 0; i < frame.leaves.length; i++) {
        const leaf = frame.leaves[i];
        const el = leafRefs.current[i];
        if (!el) continue;

        if (!leaf.visible) {
          el.style.visibility = 'hidden';
          continue;
        }

        el.style.visibility = 'visible';
        el.style.zIndex = String(leaf.zIndex);
        const leafZOffset = (DEFAULT_INTRO_LEAVES.length - i) * 0.16;
        el.style.transform = `translate3d(0, 0, ${leafZOffset.toFixed(2)}px) rotateY(${leaf.angleDeg}deg)`;

        const blurCss = leaf.motionBlurPx > 0.14 ? `blur(${leaf.motionBlurPx}px)` : 'none';
        const frontEl = leafFrontRefs.current[i];
        const backEl = leafBackRefs.current[i];
        if (frontEl) frontEl.style.filter = blurCss;
        if (backEl) backEl.style.filter = blurCss;

        const shadowEl = leafShadowRefs.current[i];
        if (shadowEl) {
          shadowEl.style.opacity = String(leaf.shadowOpacity);
        }
      }

      if (frame.phase === 'complete') {
        finishIntro();
        return;
      }

      rafId = window.requestAnimationFrame(applyFrame);
    };

    rafId = window.requestAnimationFrame(applyFrame);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [finishIntro]);

  return (
    <div
      ref={rootRef}
      data-testid="cinematic-book-intro"
      data-intro-phase={phase}
      role="region"
      aria-label="Animasi pembukaan buku cerita A Little World Made For You"
      className="fixed inset-0 z-50 overflow-hidden select-none flex flex-col items-center justify-center book-desk-surface cinematic-intro-spotlight px-3"
    >
      {/* Calm floating decorative specks & warm petal dust */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLOATING_MOTES.map((mote, i) => (
          <span
            key={i}
            style={{
              left: mote.left,
              top: mote.top,
              width: mote.size,
              height: mote.size,
              backgroundColor: mote.tint,
              animationDelay: mote.delay,
            }}
            className="intro-dust-speck absolute rounded-full opacity-40"
          />
        ))}
      </div>

      {/* 3D Perspective Stage */}
      <div className="cinematic-intro-perspective relative w-full flex flex-col items-center justify-center">
        {/* Soft Desk Contact Shadow beneath book */}
        <div
          ref={deskShadowRef}
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-5 sm:-bottom-7 w-[min(780px,84vw)] h-10 sm:h-14 rounded-full bg-[#38271F]/24 blur-xl"
        />

        {/* Animated 3D Hardcover Book Assembly */}
        <div
          ref={bookContainerRef}
          onClick={handleBookTap}
          className="book-preserve-3d relative w-[min(1020px,92vw)] h-[min(540px,64vw)] sm:h-[min(550px,62dvh)] cursor-pointer"
          style={{
            transform: 'translate3d(-25%, 0, 0) scale(0.86) rotateX(13deg) rotateY(-10deg)',
          }}
        >
          {/* LEFT OPEN SHELL + FINAL LEFT HUB FOLIO (Reveals solidly once cover begins opening) */}
          <div
            ref={leftBindingRef}
            style={{ opacity: 0, zIndex: 2 }}
            className="absolute inset-y-0 left-0 right-1/2 rounded-l-xl sm:rounded-l-2xl bg-gradient-to-b from-[#5D4334] to-[#38271F] p-1 sm:p-2 shadow-xl pointer-events-none"
          >
            <div className="hidden sm:block absolute top-3 bottom-3 left-1 w-1.5 rounded-l book-paper-stack-left border-l border-[#38271F]/25" />
            <div
              ref={leftFolioRef}
              className="relative h-full w-full rounded-l-lg bg-[#FBF6EE] book-page-left border-r border-[#38271F]/12 p-3 sm:p-6 flex flex-col justify-between overflow-hidden"
            >
              <BookCornerOrnamentSVG className="hidden sm:block absolute top-2.5 left-2.5 w-4 h-4 opacity-45" />
              <div className="space-y-1.5 sm:space-y-3">
                <span className="block text-[7px] sm:text-[10px] tracking-[0.16em] uppercase text-[#743D4A] font-medium truncate">
                  Bab 00 · 19 Februari · Untuk Wulan
                </span>
                <h2 className="font-serif text-sm sm:text-2xl lg:text-3xl font-semibold text-[#38271F] leading-tight">
                  A Little World Made For You ♡
                </h2>
                <p className="hidden sm:block text-xs text-[#38271F]/72 leading-relaxed line-clamp-3">
                  Buku kecil ini disusun bab demi bab—berisi foto, catatan perjalanan, surat pribadi, suara sahabat, dan rencana kita ke depan.
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
                  <div className="rounded-md border border-[#38271F]/12 bg-[#F4EBDD]/80 px-2 py-1.5">
                    <p className="text-[7px] sm:text-[9px] font-semibold uppercase tracking-wider text-[#A6533B]">
                      Ulang Tahunmu
                    </p>
                    <p className="font-serif text-[10px] sm:text-sm font-semibold text-[#38271F]">
                      19 Februari
                    </p>
                  </div>
                  <div className="rounded-md border border-[#38271F]/12 bg-[#F4EBDD]/80 px-2 py-1.5">
                    <p className="text-[7px] sm:text-[9px] font-semibold uppercase tracking-wider text-[#455342]">
                      Hari Jadian Kita
                    </p>
                    <p className="font-serif text-[10px] sm:text-sm font-semibold text-[#38271F]">
                      2 Mei 2026
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#38271F]/10 flex items-center">
                <span className="px-2.5 sm:px-3.5 py-1.5 rounded-md bg-[#38271F] text-[#F4EBDD] text-[9px] sm:text-xs font-medium inline-flex items-center gap-1.5">
                  <span>Buka Bab 01: Our Story</span>
                  <ArrowRight className="w-3 h-3 text-[#E8BFC5]" />
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PAPER BLOCK BASE + FINAL RIGHT HUB FOLIO */}
          <div
            ref={rightBindingRef}
            style={{ zIndex: 2 }}
            className="absolute inset-y-0 left-1/2 right-0 rounded-r-xl sm:rounded-r-2xl bg-gradient-to-b from-[#5D4334] to-[#38271F] p-1 sm:p-2 shadow-2xl"
          >
            {/* Tactile stacked cream paper fore-edge slab visible on closed & open right side */}
            <div
              aria-hidden="true"
              className="absolute top-2 bottom-2 right-0.5 sm:right-1 w-2 sm:w-2.5 rounded-r book-paper-stack-right border-r border-[#38271F]/30"
            />
            <div className="relative h-full w-full rounded-r-lg bg-[#FBF6EE] book-page-right p-3 sm:p-6 flex flex-col justify-between overflow-hidden">
              <div className="space-y-1.5 sm:space-y-2.5">
                <div className="pb-1.5 border-b border-[#38271F]/12 flex items-baseline justify-between gap-2">
                  <div>
                    <p className="text-[7px] sm:text-[10px] font-semibold uppercase tracking-widest text-[#743D4A]">
                      Daftar Isi · Chapters
                    </p>
                    <p className="font-serif text-xs sm:text-xl font-semibold text-[#38271F]">
                      Pilih Bab Cerita
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[#38271F]/8">
                  {PREVIEW_CHAPTERS.map((ch) => {
                    const Icon = ch.icon;
                    return (
                      <div
                        key={ch.num}
                        className="py-1 sm:py-1.5 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                          <span
                            className="w-4 h-4 sm:w-6 sm:h-6 rounded bg-[#F4EBDD] border border-[#38271F]/12 flex items-center justify-center shrink-0"
                            style={{ color: ch.accent }}
                          >
                            <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </span>
                          <span className="text-[8px] sm:text-[10px] font-semibold tabular-nums text-[#743D4A]/80">
                            {ch.num}
                          </span>
                          <span className="font-serif text-[10px] sm:text-sm font-semibold text-[#38271F] truncate">
                            {ch.title}
                          </span>
                        </div>
                        <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#38271F]/35 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="hidden sm:block pt-1.5 border-t border-[#38271F]/10 text-[10px] text-[#38271F]/55">
                Geser kiri/kanan atau gunakan panah untuk membalik bab.
              </p>
            </div>
          </div>

          {/* Central Spine Crease Shadow */}
          <div
            ref={spineCreaseRef}
            aria-hidden="true"
            style={{ opacity: 0 }}
            className="pointer-events-none absolute inset-y-1.5 left-1/2 -translate-x-1/2 w-6 sm:w-8 z-30 book-spine-shadow"
          />

          {/* RAPID-TO-SLOW FLIPPING MEMORY LEAVES POOL */}
          {DEFAULT_INTRO_LEAVES.map((leaf, i) => {
            const bgHex = PAPER_TINT_HEX[leaf.paperTint];
            return (
              <div
                key={leaf.id}
                ref={(el) => {
                  leafRefs.current[i] = el;
                }}
                style={{
                  visibility: 'hidden',
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                }}
                className="pointer-events-none absolute top-[6px] bottom-[6px] sm:top-[10px] sm:bottom-[10px] left-1/2 right-[8px] sm:right-[10px]"
              >
                {/* Leaf Front Face (Right-side memory glimpse) */}
                <div
                  ref={(el) => {
                    leafFrontRefs.current[i] = el;
                  }}
                  style={{ backgroundColor: bgHex }}
                  className="book-face-front book-page-right absolute inset-0 rounded-r-lg border border-[#38271F]/12 p-4 sm:p-7 flex flex-col justify-between overflow-hidden shadow-md"
                >
                  <div className="flex items-center justify-between text-[8px] sm:text-[10px] tracking-widest uppercase text-[#743D4A]/75 font-semibold">
                    <span>{leaf.chapterLabel}</span>
                    <span>A Little World</span>
                  </div>
                  <div className="my-auto mx-auto w-[72%] aspect-[4/3] rounded bg-[#EFE4D1]/65 border border-[#C4A574]/40 p-2 sm:p-3 flex flex-col justify-between rotate-[-1.5deg]">
                    <div className="flex-1 rounded-sm bg-[#E4D5BE]/70 border border-[#38271F]/8" />
                    <p className="mt-1.5 font-hand text-xs sm:text-lg text-[#743D4A] text-center truncate">
                      {leaf.caption}
                    </p>
                  </div>
                  <div className="text-right font-serif text-[9px] sm:text-xs text-[#38271F]/45 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {/* Dynamic fold shadow during rapid turn */}
                  <div
                    ref={(el) => {
                      leafShadowRefs.current[i] = el;
                    }}
                    className="pointer-events-none absolute inset-0 bg-[#38271F]/35 opacity-0"
                  />
                </div>

                {/* Leaf Back Face (Visible past -90deg as it lands on the left stack) */}
                <div
                  ref={(el) => {
                    leafBackRefs.current[i] = el;
                  }}
                  style={{ backgroundColor: bgHex }}
                  className="book-face-back-next book-page-left absolute inset-0 rounded-l-lg border border-[#38271F]/12 p-4 sm:p-7 flex flex-col justify-between overflow-hidden shadow-md"
                >
                  <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-[#455342]/75 font-medium">
                    Kenangan Tersimpan
                  </span>
                  <div className="space-y-2 opacity-55">
                    <div className="h-2 w-3/4 rounded-full bg-[#38271F]/12" />
                    <div className="h-2 w-5/6 rounded-full bg-[#38271F]/10" />
                    <div className="h-2 w-2/3 rounded-full bg-[#38271F]/10" />
                  </div>
                  <p className="font-hand text-sm sm:text-xl text-[#A6533B]/80">
                    {leaf.caption}
                  </p>
                </div>
              </div>
            );
          })}

          {/* 3D HARDCOVER FRONT COVER (Closed Hero -> Smooth 3D Hinge Swing Open) */}
          <div
            ref={coverRef}
            style={{
              transform: 'translate3d(0, 0, 3px)',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              zIndex: 45,
            }}
            className="absolute inset-y-0 left-1/2 right-0"
          >
            {/* Outer Hardcover Front Face */}
            <div className="book-face-front book-cover-linen absolute inset-0 rounded-r-xl sm:rounded-r-2xl border border-[#38271F]/22 overflow-hidden flex">
              {/* Left Stitched Hardcover Spine Strip */}
              <div className="book-cover-spine w-4 sm:w-7 h-full shrink-0 border-r border-[#38271F]/25" />

              {/* Cover Emblem & Embossed Typography */}
              <div className="relative flex-1 p-3.5 sm:p-7 flex flex-col items-center justify-between text-center">
                {/* Warm diagonal sheen sweep */}
                <div
                  aria-hidden="true"
                  className="intro-cover-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />

                {/* Debossed Gold Hairline Cover Frame */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2.5 sm:inset-4 rounded-lg border border-[#C4A574]/55"
                />

                <BookCornerOrnamentSVG className="hidden sm:block absolute top-4 right-4 w-5 h-5 rotate-90 opacity-55" />
                <BookCornerOrnamentSVG className="hidden sm:block absolute bottom-4 left-4 w-5 h-5 -rotate-90 opacity-55" />

                <span className="relative z-10 text-[7px] sm:text-[10px] tracking-[0.22em] uppercase font-semibold text-[#743D4A]">
                  19 Februari · Untuk Wulan
                </span>

                <div className="relative z-10 space-y-1.5 sm:space-y-3 px-1">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto rounded-full bg-[#A6533B]/12 border border-[#A6533B]/35 flex items-center justify-center text-[#A6533B]">
                    <BookHeart className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h1 className="font-serif text-base sm:text-3xl font-semibold text-[#38271F] leading-tight text-balance">
                    A Little World Made For You ♡
                  </h1>
                  <p className="font-hand text-xs sm:text-xl text-[#743D4A]">
                    Kumpulan kenangan, doa &amp; perjalanan kita
                  </p>
                </div>

                <div className="relative z-10 w-full flex items-center justify-between text-[7px] sm:text-[10px] tracking-[0.18em] uppercase text-[#455342]/80 font-medium px-2">
                  <span>Edisi Khusus</span>
                  <span>Ketuk atau tunggu</span>
                </div>
              </div>

              {/* Crimson Silk Ribbon Bookmark Tail peeking from cover bottom */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-3 right-6 sm:right-10 w-2.5 sm:w-3.5 h-5 sm:h-7 bg-gradient-to-b from-[#A6533B] to-[#743D4A] shadow-md [clip-path:polygon(0_0,100%_0,100%_100%,50%_72%,0_100%)]"
              />
            </div>

            {/* Inner Front Cover Endpaper (Visible past -90deg as cover lands flat on the left) */}
            <div className="book-face-back-next absolute inset-0 rounded-l-xl sm:rounded-l-2xl bg-[#4B3529] p-1 sm:p-2 shadow-xl">
              <div className="w-full h-full rounded-l-lg bg-[#F0E3D1] border border-[#38271F]/18 p-4 sm:p-7 flex flex-col items-center justify-center text-center shadow-inner">
                <div className="w-full h-full rounded-lg border border-[#C4A574]/45 flex flex-col items-center justify-center p-4 space-y-2">
                  <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-[#743D4A]">
                    Ex Libris
                  </p>
                  <p className="font-hand text-sm sm:text-2xl text-[#38271F]">
                    Dibuat dengan tulus untuk Wulan ♡
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiet poetic caption beneath the closed book */}
        <p
          ref={hintRef}
          className="mt-8 sm:mt-10 font-hand text-base sm:text-xl text-[#743D4A]/85 text-center transition-opacity"
        >
          Membuka halaman demi halaman untukmu, Wulan ♡
        </p>
      </div>

      {/* Discreet Skip Intro Action */}
      <button
        type="button"
        data-testid="skip-book-intro-btn"
        onClick={finishIntro}
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-8 z-50 min-h-[44px] px-4 py-2 rounded-lg border border-[#38271F]/18 bg-[#FBF6EE]/88 backdrop-blur-xs text-xs font-medium text-[#38271F]/80 hover:text-[#38271F] hover:bg-[#FBF6EE] shadow-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <span>Lewati Intro</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#A6533B]" />
      </button>
    </div>
  );
}
