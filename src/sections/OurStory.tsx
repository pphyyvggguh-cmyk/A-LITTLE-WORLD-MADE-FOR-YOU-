import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { MemoryBook } from '../components/story/MemoryBook';
import { StoryMusic } from '../components/story/StoryMusic';
import { HiddenPolaroidSpot } from '../components/quests/HiddenPolaroidSpot';
import { BookCornerOrnamentSVG } from '../components/storybook/StorybookIllustrations';
import { useStore } from '../store/useStore';
import { MOTION_INTERFACE } from '../utils/animation';

export function OurStory() {
  const [hasInteractedWithBook, setHasInteractedWithBook] = useState(false);
  const navigateTo = useStore((s) => s.navigateTo);

  return (
    <main className="paper-canvas relative min-h-full w-full pt-3 sm:pt-4 pb-36 md:pb-16 overflow-x-hidden">
      {/* Editorial Section Header & Ambient Music Control */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOTION_INTERFACE}
        className="relative max-w-6xl mx-auto px-4 sm:px-8 pb-3 border-b border-[#30272A]/10 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4"
      >
        <BookCornerOrnamentSVG className="pointer-events-none hidden lg:block absolute -top-1 left-2 w-5 h-5 opacity-45" />
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigateTo('hub')}
            className="min-h-[34px] -ml-1 px-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#6E5F63] hover:text-[#552E3D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </button>

          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="editorial-kicker">01 · The Memory Book</span>
            <span aria-hidden="true" className="hidden sm:inline text-[#30272A]/30">
              ·
            </span>
            <span className="font-hand text-sm sm:text-base text-[#4E5D49]">
              17 halaman · 9 bentangan
            </span>
          </div>
          <h1 className="editorial-display">Our Story</h1>
          <p className="editorial-note text-xs sm:text-[13px] max-w-xl leading-snug">
            Buka bukunya, lalu balik halamannya dengan mengetuk sisi kertas, menggeser, atau menarik sudutnya.
          </p>
        </div>

        <div className="self-start sm:self-end shrink-0">
          <StoryMusic shouldAutoStartAfterInteraction={hasInteractedWithBook} />
        </div>
      </motion.header>

      {/* Centered Interactive Memory Book */}
      <div className="max-w-6xl mx-auto px-1.5 sm:px-6 pt-3 sm:pt-4">
        <MemoryBook onFirstBookInteraction={() => setHasInteractedWithBook(true)} />

        {/* Subtle desk center Polaroid collectible (Quest 3) */}
        <div className="mt-4 pb-10 sm:pb-4 px-2 flex items-center justify-center">
          <HiddenPolaroidSpot polaroidId="polaroid-story" />
        </div>
      </div>
    </main>
  );
}
