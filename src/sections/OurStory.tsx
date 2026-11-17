import { useState } from 'react';
import { motion } from 'motion/react';
import { MemoryBook } from '../components/story/MemoryBook';
import { StoryMusic } from '../components/story/StoryMusic';
import { BookCornerOrnamentSVG } from '../components/storybook/StorybookIllustrations';
import { EASE_OUT_EXPO } from '../utils/animation';

export function OurStory() {
  const [hasInteractedWithBook, setHasInteractedWithBook] = useState(false);

  return (
    <main className="book-desk-surface relative min-h-[calc(100dvh-3.5rem)] w-full pt-3 sm:pt-5 pb-40 sm:pb-20 overflow-x-hidden">
      {/* Editorial Section Header & Ambient Music Control */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
        className="relative max-w-6xl mx-auto px-4 sm:px-8 pb-3 sm:pb-3.5 border-b border-[#38271F]/12 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4"
      >
        <BookCornerOrnamentSVG className="pointer-events-none hidden lg:block absolute -top-1 left-2 w-5 h-5 opacity-45" />
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="editorial-kicker">01 · The Memory Book</span>
            <span aria-hidden="true" className="hidden sm:inline text-[#38271F]/35">
              ·
            </span>
            <span className="font-hand text-base text-[#455342]">
              17 halaman · 9 bentangan
            </span>
          </div>
          <h1 className="editorial-display">Our Story</h1>
          <p className="editorial-note max-w-xl">
            Buka bukunya, lalu balik halamannya dengan mengetuk sisi kertas, menggeser, atau menarik sudutnya.
          </p>
        </div>

        <div className="self-start sm:self-end shrink-0">
          <StoryMusic shouldAutoStartAfterInteraction={hasInteractedWithBook} />
        </div>
      </motion.header>

      {/* Centered Interactive Memory Book */}
      <div className="max-w-6xl mx-auto px-1.5 sm:px-6 pt-3.5 sm:pt-4">
        <MemoryBook onFirstBookInteraction={() => setHasInteractedWithBook(true)} />
      </div>
    </main>
  );
}

