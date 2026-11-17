import { motion } from 'motion/react';
import { ArrowRight, Heart } from 'lucide-react';
import { BotanicalDivider } from '../components/editorial/StorybookPrimitives';
import { BotanicalFlowerSVG } from '../components/Flower';
import { MiniOktafCharacter } from '../components/MiniOktafCharacter';
import { useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';

export function BirthdayWelcome() {
  const enterFromWelcome = useStore((s) => s.enterFromWelcome);

  return (
    <main className="paper-canvas relative min-h-[100dvh] w-full flex flex-col items-center justify-center px-5 py-12 overflow-hidden">
      {/* Subtle pressed-flower botanical corner accents */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, rotate: -14 }}
        animate={{ opacity: 0.48, rotate: -6 }}
        transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
        className="pointer-events-none absolute top-6 left-4 sm:top-12 sm:left-12"
      >
        <BotanicalFlowerSVG species="sakura" className="w-16 h-16 sm:w-20 sm:h-20" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, rotate: 16 }}
        animate={{ opacity: 0.45, rotate: 8 }}
        transition={{ duration: 1.2, delay: 0.15, ease: EASE_OUT_EXPO }}
        className="pointer-events-none absolute bottom-6 right-4 sm:bottom-12 sm:right-14"
      >
        <BotanicalFlowerSVG species="lavender" className="w-16 h-16 sm:w-20 sm:h-20" />
      </motion.div>

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
          className="inline-flex items-center gap-2 editorial-kicker"
        >
          <Heart className="w-3.5 h-3.5 fill-[#E8BFC5] text-[#743D4A]" />
          <span>02 April 2026</span>
          <Heart className="w-3.5 h-3.5 fill-[#E8BFC5] text-[#743D4A]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.18, ease: EASE_OUT_EXPO }}
          className="mt-4 font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-[#38271F] tracking-tight leading-[1.12] text-balance"
        >
          Happy Birthday, Wulan ♡
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.36, ease: EASE_OUT_EXPO }}
          className="mt-4 max-w-lg font-serif italic text-base sm:text-lg text-[#38271F]/80 leading-relaxed"
        >
          &ldquo;A little world, filled with memories, dreams, and everything I wish to share with you.&rdquo;
        </motion.p>

        <BotanicalDivider className="max-w-xs my-5" />

        {/* Mini Oktaf welcoming Wulan */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.52, ease: EASE_OUT_EXPO }}
          className="mt-2"
        >
          <MiniOktafCharacter mode="inline" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.72, ease: EASE_OUT_EXPO }}
          className="mt-7"
        >
          <button
            type="button"
            onClick={enterFromWelcome}
            className="min-h-[50px] px-7 py-3 rounded-lg bg-[#A6533B] text-[#F4EBDD] font-medium text-sm sm:text-base tracking-wide hover:bg-[#8e442f] active:scale-[0.98] transition-all shadow-[0_10px_24px_-6px_rgba(166,83,59,0.45)] inline-flex items-center gap-2.5 cursor-pointer"
          >
            <span>Enter Our Little World</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </main>
  );
}
