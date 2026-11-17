import { motion, useReducedMotion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { DecorationSVG } from './ScrapbookDecorations';
import { EASE_OUT_EXPO } from '../../utils/animation';

interface BookCoverProps {
  onOpen?: () => void;
  hasSavedSessionSpread?: boolean;
  decorativeOnly?: boolean;
}

export function BookCover({
  onOpen,
  hasSavedSessionSpread = false,
  decorativeOnly = false,
}: BookCoverProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`flex flex-col items-center justify-center ${decorativeOnly ? '' : 'py-4 sm:py-6'}`}>
      <motion.button
        type="button"
        onClick={decorativeOnly ? undefined : onOpen}
        tabIndex={decorativeOnly ? -1 : undefined}
        aria-hidden={decorativeOnly || undefined}
        aria-label={decorativeOnly ? undefined : 'Open our little book'}
        initial={
          decorativeOnly || prefersReducedMotion
            ? { opacity: 1 }
            : { opacity: 0, y: 18, scale: 0.97 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={decorativeOnly || prefersReducedMotion ? undefined : { y: -5, rotate: -0.6 }}
        whileTap={decorativeOnly || prefersReducedMotion ? undefined : { scale: 0.985 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        className="group relative w-[285px] sm:w-[345px] md:w-[375px] aspect-[3/4] rounded-r-2xl rounded-l-md book-cover-linen border border-[#38271F]/22 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A6533B] select-none"
      >
        {/* Layered page thickness illusion along right edge */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 -right-2 w-2 rounded-r-md bg-gradient-to-r from-[#E6D7C2] via-[#FBF6EE] to-[#D8C5AA] border-y border-r border-[#38271F]/20 shadow-xs"
        />
        <span
          aria-hidden="true"
          className="hidden sm:block absolute top-3 bottom-3 -right-3 w-1 rounded-r-sm bg-[#EFE3D0] border-y border-r border-[#38271F]/16"
        />

        {/* Cloth Left Spine Binding */}
        <div
          aria-hidden="true"
          className="book-cover-spine absolute inset-y-0 left-0 w-7 sm:w-9 rounded-l-md flex flex-col justify-between py-6 items-center"
        >
          <span className="w-4 h-0.5 bg-[#C4A574]/60 rounded-full" />
          <span className="w-4 h-0.5 bg-[#C4A574]/60 rounded-full" />
          <span className="w-4 h-0.5 bg-[#C4A574]/60 rounded-full" />
        </div>

        {/* Gold Embossed Cover Frame */}
        <div className="relative h-full pl-11 sm:pl-14 pr-5 sm:pr-7 py-6 sm:py-8 flex flex-col justify-between">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-4 left-10 sm:left-12 right-3 sm:right-4 rounded-xl border border-[#C4A574]/55"
          />

          {/* Botanical Corner Accents */}
          <div aria-hidden="true" className="flex items-start justify-between">
            <DecorationSVG kind="branch" className="w-10 h-10 sm:w-12 sm:h-12 opacity-80 story-animate-sway" />
            <DecorationSVG kind="butterfly" className="w-8 h-8 sm:w-9 sm:h-9 opacity-85 story-animate-float" />
          </div>

          {/* Center Cream Label Plate */}
          <div className="relative z-10 bg-[#FBF8F2]/92 border border-[#C4A574]/50 rounded-xl px-4 py-6 sm:px-6 sm:py-7 text-center shadow-sm">
            <span
              aria-hidden="true"
              className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 -rotate-1"
            />
            <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-[#743D4A] font-medium">
              The Memory Book
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#38271F] tracking-tight">
              Our Story ♡
            </h2>
            <p className="mt-2 font-hand text-xl sm:text-2xl text-[#A6533B]">
              A little world made for you
            </p>
            <div className="mt-4 pt-3 border-t border-[#38271F]/10 flex items-center justify-center gap-2 text-[11px] text-[#38271F]/65">
              <span>17 Halaman Kenangan</span>
              <span aria-hidden="true">·</span>
              <span>Wulan</span>
            </div>
          </div>

          {/* Interactive Hint & Bottom Botanical */}
          <div className="relative z-10 flex items-end justify-between gap-2">
            <DecorationSVG kind="rose" className="w-8 h-8 sm:w-9 sm:h-9 opacity-80" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#38271F] text-[#F4EBDD] text-xs font-medium shadow-xs group-hover:bg-[#A6533B] transition-colors">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{hasSavedSessionSpread ? 'Open our little book' : 'Open our little book'}</span>
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
