import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, Lock, Sparkles, X } from 'lucide-react';
import {
  BotanicalDivider,
  StorybookButton,
} from '../components/editorial/StorybookPrimitives';
import { BotanicalFlowerSVG } from '../components/Flower';
import { BookCornerOrnamentSVG } from '../components/storybook/StorybookIllustrations';
import { FLOWERS_DATA } from '../data/flowers';
import { useStore } from '../store/useStore';
import { isFlowerQuestComplete } from '../utils/storage';
import { EASE_OUT_EXPO } from '../utils/animation';

export function QuestsModal() {
  const questModalOpen = useStore((s) => s.questModalOpen);
  const setQuestModalOpen = useStore((s) => s.setQuestModalOpen);
  const collectedFlowers = useStore((s) => s.collectedFlowers);
  const claimReward = useStore((s) => s.claimReward);

  const complete = isFlowerQuestComplete(collectedFlowers);

  return (
    <AnimatePresence>
      {questModalOpen && (
        <motion.div
          key="quests-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuestModalOpen(false)}
          className="fixed inset-0 z-50 bg-[#38271F]/65 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quests-modal-title"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="paper-sheet relative w-full max-w-2xl p-6 sm:p-8 my-auto shadow-polaroid-lifted"
          >
            <BookCornerOrnamentSVG className="pointer-events-none hidden sm:block absolute top-3 left-3 w-4 h-4 opacity-45" />

            <button
              type="button"
              onClick={() => setQuestModalOpen(false)}
              aria-label="Tutup Misi Rahasia"
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] rounded-full bg-[#F4EBDD] border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-10">
              <p className="editorial-kicker flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#A6533B]" />
                <span>Secret Quest</span>
              </p>
              <h2
                id="quests-modal-title"
                className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#38271F]"
              >
                Misi Rahasia Dunia Kecil
              </h2>
              <p className="mt-1.5 text-sm text-[#38271F]/74">
                Kamu menemukan pintu rahasia lewat Mini Oktaf! Selesaikan misi di bawah untuk membuka halaman hadiah terakhir.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {/* Quest 1: The Lost Flowers (Fully Functional) */}
              <div className="paper-plate p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-[#455342]">
                      Quest 1 · Aktif
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-[#38271F]">
                      The Lost Flowers
                    </h3>
                  </div>
                  <span className="text-sm font-semibold text-[#A6533B] tabular-nums">
                    {collectedFlowers.length}/{FLOWERS_DATA.length} Bunga
                  </span>
                </div>

                <p className="mt-1.5 text-xs sm:text-sm text-[#38271F]/75">
                  Temukan tujuh bunga kecil yang terselip di berbagai sudut halaman di sini.
                </p>

                {/* Progress bar */}
                <div className="mt-3 h-2 w-full rounded-full bg-[#38271F]/10 overflow-hidden">
                  <div
                    className="h-full bg-[#455342] transition-all duration-500"
                    style={{
                      width: `${(collectedFlowers.length / FLOWERS_DATA.length) * 100}%`,
                    }}
                  />
                </div>

                {/* 7 Flower Checklist */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FLOWERS_DATA.map((flower) => {
                    const found = collectedFlowers.includes(flower.id);
                    return (
                      <div
                        key={flower.id}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors ${
                          found
                            ? 'bg-[#FBF6EE] border-[#455342]/35'
                            : 'bg-[#FBF6EE]/50 border-[#38271F]/10'
                        }`}
                      >
                        <div className={found ? 'opacity-100' : 'opacity-30 grayscale'}>
                          <BotanicalFlowerSVG species={flower.species} className="w-9 h-9" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#38271F] flex items-center gap-1.5">
                            <span className="truncate">{flower.indonesianName}</span>
                            {found && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#455342] shrink-0" />
                            )}
                          </p>
                          <p className="text-[11px] text-[#38271F]/65 line-clamp-1">
                            {found ? 'Sudah ditemukan!' : flower.locationHint}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {complete && (
                  <div className="mt-4 pt-4 border-t border-[#455342]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#455342]">
                      Semua 7 bunga sudah terkumpul! Halaman rahasia siap dibuka.
                    </p>
                    <StorybookButton
                      type="button"
                      variant="primary"
                      onClick={claimReward}
                      className="!bg-[#A6533B] hover:!bg-[#8e442f] !border-[#A6533B] shrink-0"
                    >
                      <Award className="w-4 h-4" />
                      <span>Buka Hadiah Terakhir</span>
                    </StorybookButton>
                  </div>
                )}
              </div>

              <BotanicalDivider className="my-2" />

              {/* Quest 2 & Quest 3: Upcoming Chapters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#EFE5D6]/60 border border-[#38271F]/12 rounded-xl p-4 opacity-85">
                  <div className="flex items-center justify-between text-xs text-[#38271F]/62">
                    <span>Quest 2</span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-[#38271F]/78">
                    How Well?
                  </h3>
                  <p className="mt-1 text-xs text-[#38271F]/62">
                    Misi kecil berikutnya masih disimpan untuk nanti.
                  </p>
                </div>

                <div className="bg-[#EFE5D6]/60 border border-[#38271F]/12 rounded-xl p-4 opacity-85">
                  <div className="flex items-center justify-between text-xs text-[#38271F]/62">
                    <span>Quest 3</span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </span>
                  </div>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-[#38271F]/78">
                    Memories
                  </h3>
                  <p className="mt-1 text-xs text-[#38271F]/62">
                    Masih tersimpan rapat untuk dibuka di waktu yang pas nanti.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
