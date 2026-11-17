import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart, MailOpen } from 'lucide-react';
import {
  BotanicalDivider,
  EditorialHeader,
  EditorialSectionShell,
  StorybookButton,
  StorybookSurface,
} from '../components/editorial/StorybookPrimitives';
import { HiddenFlowerSpot } from '../components/Flower';
import { BirthdayLetter } from '../data/letters';
import { useContentStore } from '../store/useContentStore';
import { EASE_OUT_EXPO } from '../utils/animation';

export function BirthdayLetters() {
  const letters = useContentStore((s) => s.letters);
  const [openLetter, setOpenLetter] = useState<BirthdayLetter | null>(null);

  return (
    <EditorialSectionShell>
      <EditorialHeader
        kicker="03 · Koleksi Surat Pribadi"
        metaRight={`${letters.length} amplop`}
        title="Birthday Letters"
        subtitle="Beberapa amplop bersegel lilin berisi surat panjang dan doa ulang tahun. Buka satu per satu ya."
        ornament={
          <div className="flex items-center gap-3">
            <div className="postage-stamp px-3 py-1.5 text-[10px] tracking-widest uppercase text-[#743D4A] font-semibold">
              AIR MAIL · WULAN
            </div>
            <HiddenFlowerSpot flowerId="flower-rose" />
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {!openLetter ? (
          <motion.section
            key="envelope-grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
            className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {letters.map((letter, idx) => (
              <motion.button
                key={letter.id}
                type="button"
                onClick={() => setOpenLetter(letter)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.06, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.985 }}
                className="group paper-sheet relative text-left p-6 hover:shadow-polaroid-lifted transition-shadow overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A6533B]"
              >
                {/* Envelope flap geometry */}
                <svg
                  viewBox="0 0 400 70"
                  className="w-full h-12 -mt-3 mb-2 pointer-events-none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0 0 L200 58 L400 0"
                    fill="none"
                    stroke="#38271F"
                    strokeOpacity="0.14"
                    strokeWidth="1.4"
                  />
                </svg>

                {/* Vintage Postage Stamp */}
                <span className="postage-stamp absolute top-4 right-4 px-2 py-0.5 text-[9px] tracking-wider font-semibold text-[#743D4A] uppercase rotate-2">
                  {letter.stampText}
                </span>

                <div className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-[#F4EBDD] shadow-sm transition-transform group-hover:scale-105"
                    style={{ backgroundColor: letter.sealColor }}
                  >
                    <Heart className="w-4 h-4 fill-[#F4EBDD]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#743D4A]">
                      {letter.dateLabel} · Untuk {letter.recipient}
                    </p>
                    <h2 className="mt-1 font-serif text-xl font-semibold text-[#38271F] group-hover:text-[#A6533B] transition-colors">
                      {letter.title}
                    </h2>
                    <p className="mt-2 text-sm text-[#38271F]/74 line-clamp-2 leading-relaxed">
                      {letter.preview}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#38271F]">
                      <MailOpen className="w-3.5 h-3.5 text-[#A6533B]" />
                      <span>Buka Amplop</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.section>
        ) : (
          <motion.article
            key={openLetter.id}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.36, ease: EASE_OUT_EXPO }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <button
              type="button"
              onClick={() => setOpenLetter(null)}
              className="min-h-[44px] mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#38271F] hover:text-[#A6533B] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Semua Amplop</span>
            </button>

            <StorybookSurface
              tapeVariant="gold"
              cornerOrnament
              className="journal-lined px-6 sm:px-10 py-8 sm:py-10 shadow-polaroid-lifted"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#38271F]/12">
                <div>
                  <p className="text-xs font-medium text-[#743D4A]">
                    {openLetter.dateLabel} · {openLetter.sender}
                  </p>
                  <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#38271F]">
                    {openLetter.title}
                  </h2>
                </div>
                <div className="postage-stamp px-2.5 py-1 text-[10px] font-semibold text-[#743D4A] uppercase">
                  {openLetter.stampText}
                </div>
              </div>

              <div className="mt-6 space-y-4 text-[15px] sm:text-base text-[#38271F]/90 leading-[32px]">
                {openLetter.paragraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <BotanicalDivider className="mt-8 mb-5" />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-hand text-2xl text-[#743D4A]">{openLetter.closing}</p>
                <StorybookButton
                  type="button"
                  variant="primary"
                  onClick={() => setOpenLetter(null)}
                >
                  Tutup Surat
                </StorybookButton>
              </div>
            </StorybookSurface>
          </motion.article>
        )}
      </AnimatePresence>
    </EditorialSectionShell>
  );
}
