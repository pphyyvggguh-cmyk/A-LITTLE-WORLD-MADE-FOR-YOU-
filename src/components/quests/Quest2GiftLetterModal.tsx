import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Heart, Mail, Sparkles, X } from 'lucide-react';
import { StorybookButton } from '../editorial/StorybookPrimitives';
import { BookCornerOrnamentSVG } from '../storybook/StorybookIllustrations';
import { QUEST2_LETTER_TEXT, QUEST2_LETTER_TITLE } from '../../data/quests';
import { useStore } from '../../store/useStore';
import { EASE_OUT_EXPO } from '../../utils/animation';

type GiftStage = 'wrapped' | 'opening' | 'letter';

export function Quest2GiftLetterModal() {
  const open = useStore((s) => s.quest2GiftModalOpen);
  const setOpen = useStore((s) => s.setQuest2GiftModalOpen);
  const [stage, setStage] = useState<GiftStage>('wrapped');

  useEffect(() => {
    if (open) {
      setStage('wrapped');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (stage !== 'opening') return;
    const timer = window.setTimeout(() => setStage('letter'), 1450);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const handleOpenGift = () => {
    if (stage !== 'wrapped') return;
    setStage('opening');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="q2-gift-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-[#1E1410]/82 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={QUEST2_LETTER_TITLE}
            data-testid="quest-2-gift-modal"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl my-auto"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup hadiah surat"
              className="absolute -top-3 -right-2 sm:top-3 sm:right-3 z-30 min-w-[44px] min-h-[44px] rounded-full bg-[#FBF6EE] border border-[#38271F]/18 text-[#38271F] hover:bg-[#EAE0CF] flex items-center justify-center shadow-polaroid cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {stage !== 'letter' ? (
                <motion.div
                  key="gift-box-stage"
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.38, ease: EASE_OUT_EXPO }}
                  className="paper-sheet p-6 sm:p-10 text-center shadow-polaroid-lifted relative overflow-hidden"
                >
                  <p className="editorial-kicker flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#A6533B]" />
                    <span>Hadiah Quest 2 · 3/3 Benar</span>
                  </p>
                  <h2 className="mt-1.5 font-serif text-2xl sm:text-3xl font-semibold text-[#38271F]">
                    Sebuah Kado Untuk Wulan
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#38271F]/72">
                    {stage === 'wrapped'
                      ? 'Ketuk kotak kado untuk melepas pitanya dan membaca surat di dalamnya.'
                      : 'Pita mulai terbuka... ada sepucuk surat hangat di dalamnya...'}
                  </p>

                  {/* Gift Box + Opening lid + Floating glowing letter */}
                  <div className="relative mt-7 mb-5 mx-auto w-56 h-56 flex items-end justify-center">
                    {/* Glowing light beam when opening */}
                    <motion.div
                      aria-hidden="true"
                      animate={
                        stage === 'opening'
                          ? { opacity: [0.1, 0.95, 0.8], scale: [0.6, 1.3, 1.1] }
                          : { opacity: 0.15, scale: 0.85 }
                      }
                      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
                      className="pointer-events-none absolute bottom-14 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(255,244,214,0.95)_0%,rgba(232,191,197,0.55)_50%,rgba(251,246,238,0)_76%)]"
                    />

                    {/* Floating letter card rising out of gift */}
                    <motion.div
                      initial={{ y: 20, opacity: 0, scale: 0.7 }}
                      animate={
                        stage === 'opening'
                          ? { y: -88, opacity: 1, scale: 1.04 }
                          : { y: 12, opacity: 0, scale: 0.7 }
                      }
                      transition={{ duration: 0.95, delay: 0.25, ease: EASE_OUT_EXPO }}
                      className="absolute bottom-16 z-20 w-36 h-24 rounded-lg bg-[#FFFBF2] border border-[#C4A574] shadow-[0_0_28px_rgba(246,214,154,0.85)] flex flex-col items-center justify-center p-2 pointer-events-none"
                    >
                      <Mail className="w-6 h-6 text-[#A6533B]" />
                      <span className="mt-1 font-serif italic text-[10px] text-[#743D4A]">
                        A Letter for Wulan
                      </span>
                    </motion.div>

                    {/* Clickable Gift Box */}
                    <button
                      type="button"
                      onClick={handleOpenGift}
                      data-testid="quest-2-gift-box-btn"
                      aria-label="Buka kotak kado"
                      className="relative z-10 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A6533B]"
                    >
                      {/* Lid + Bow */}
                      <motion.div
                        animate={
                          stage === 'opening'
                            ? { y: -46, x: -24, rotate: -26, opacity: 0.85 }
                            : { y: [0, -2, 0] }
                        }
                        transition={
                          stage === 'opening'
                            ? { duration: 0.75, ease: EASE_OUT_EXPO }
                            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                        }
                        className="relative mx-auto w-44 h-9 rounded-lg bg-[#E8BFC5] border-2 border-[#38271F] shadow-sm flex items-center justify-center"
                      >
                        <div className="w-6 h-full bg-[#743D4A]" />
                        {/* Ribbon bow loops */}
                        <div className="absolute -top-5 flex items-center justify-center">
                          <span className="w-7 h-5 rounded-full border-2 border-[#38271F] bg-[#743D4A] -rotate-12 -mr-1" />
                          <span className="w-4 h-4 rounded-full border-2 border-[#38271F] bg-[#A6533B] z-10" />
                          <span className="w-7 h-5 rounded-full border-2 border-[#38271F] bg-[#743D4A] rotate-12 -ml-1" />
                        </div>
                      </motion.div>

                      {/* Box Base */}
                      <div className="relative mx-auto -mt-1 w-40 h-28 rounded-b-xl bg-[#F4EBDD] border-2 border-t-0 border-[#38271F] shadow-polaroid flex items-center justify-center">
                        <div className="w-6 h-full bg-[#743D4A]" />
                        <div className="absolute inset-x-0 h-5 bg-[#743D4A]/20" />
                      </div>
                    </button>
                  </div>

                  {stage === 'wrapped' && (
                    <StorybookButton
                      type="button"
                      variant="primary"
                      onClick={handleOpenGift}
                      className="!bg-[#743D4A] hover:!bg-[#5c2f3a] !border-[#743D4A]"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Buka Kado ♡</span>
                    </StorybookButton>
                  )}
                </motion.div>
              ) : (
                <motion.article
                  key="letter-paper-stage"
                  data-testid="quest-2-letter-paper"
                  initial={{ opacity: 0, scaleY: 0.65, y: 16 }}
                  animate={{ opacity: 1, scaleY: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                  style={{ transformOrigin: 'top center' }}
                  className="paper-sheet journal-lined px-6 sm:px-10 py-8 sm:py-10 shadow-polaroid-lifted relative max-h-[84dvh] overflow-y-auto storybook-chapter-scroll"
                >
                  <BookCornerOrnamentSVG className="pointer-events-none hidden sm:block absolute top-4 left-4 w-5 h-5 opacity-45" />

                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#38271F]/14 pr-8">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest font-semibold text-[#743D4A]">
                        Hadiah Quest 2 · Untukmu
                      </p>
                      <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#38271F] flex items-center gap-2">
                        <span>{QUEST2_LETTER_TITLE}</span>
                        <Heart className="w-5 h-5 fill-[#E8BFC5] text-[#A6533B]" />
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 text-[15px] sm:text-base text-[#38271F]/92 leading-[32px] whitespace-pre-line font-sans">
                    {QUEST2_LETTER_TEXT}
                  </div>

                  <div className="mt-7 pt-4 border-t border-[#38271F]/12 flex justify-end">
                    <StorybookButton
                      type="button"
                      variant="primary"
                      onClick={() => setOpen(false)}
                    >
                      Tutup Surat
                    </StorybookButton>
                  </div>
                </motion.article>
              )}
            </AnimatePresence>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
