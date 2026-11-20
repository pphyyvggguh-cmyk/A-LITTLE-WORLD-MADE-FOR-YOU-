import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Camera, CheckCircle2, Heart, Sparkles, X } from 'lucide-react';
import {
  BotanicalDivider,
  StorybookButton,
} from '../components/editorial/StorybookPrimitives';
import { BotanicalFlowerSVG } from '../components/Flower';
import { Quest2Challenge } from '../components/quests/Quest2Challenge';
import { BookCornerOrnamentSVG } from '../components/storybook/StorybookIllustrations';
import { FLOWERS_DATA } from '../data/flowers';
import { POLAROIDS_QUEST_DATA } from '../data/quests';
import { useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';
import { isPolaroidQuestComplete, TOTAL_POLAROIDS } from '../utils/quests';
import { isFlowerQuestComplete } from '../utils/storage';

export function QuestsModal() {
  const questModalOpen = useStore((s) => s.questModalOpen);
  const setQuestModalOpen = useStore((s) => s.setQuestModalOpen);
  const collectedFlowers = useStore((s) => s.collectedFlowers);
  const collectedPolaroids = useStore((s) => s.collectedPolaroids);
  const claimReward = useStore((s) => s.claimReward);
  const setHeartGalleryModalOpen = useStore((s) => s.setHeartGalleryModalOpen);

  useEffect(() => {
    if (!questModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuestModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [questModalOpen, setQuestModalOpen]);

  const flowerComplete = isFlowerQuestComplete(collectedFlowers);
  const polaroidComplete = isPolaroidQuestComplete(collectedPolaroids);

  return (
    <AnimatePresence>
      {questModalOpen && (
        <motion.div
          key="quests-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuestModalOpen(false)}
          className="fixed inset-0 z-50 bg-[#38271F]/65 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quests-modal-title"
            data-testid="quests-modal"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="paper-sheet relative w-full max-w-2xl p-5 sm:p-7 my-auto shadow-polaroid-lifted max-h-[89dvh] overflow-y-auto storybook-chapter-scroll"
          >
            <BookCornerOrnamentSVG className="pointer-events-none hidden sm:block absolute top-3 left-3 w-4 h-4 opacity-45" />

            <button
              type="button"
              onClick={() => setQuestModalOpen(false)}
              aria-label="Tutup Misi Rahasia"
              className="sticky top-0 float-right z-20 min-w-[44px] min-h-[44px] rounded-full bg-[#F4EBDD] border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-12">
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
                Kamu menemukan pintu rahasia lewat Mini Oktaf! Selesaikan tiga misi di bawah ini untuk membuka masing-masing hadiah spesialnya.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {/* Quest 1: The Flower Bucket */}
              <div className="paper-plate p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-[#455342]">
                      Quest 1 · {flowerComplete ? 'Selesai' : 'Aktif'}
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-[#38271F]">
                      The Flower Bucket
                    </h3>
                  </div>
                  <span className="text-sm font-semibold text-[#A6533B] tabular-nums">
                    {collectedFlowers.length}/{FLOWERS_DATA.length} Bunga
                  </span>
                </div>

                <p className="mt-1.5 text-xs sm:text-sm text-[#38271F]/75">
                  Temukan tujuh bunga kecil yang terselip di berbagai sudut halaman untuk dirangkai menjadi satu buket utuh.
                </p>

                <div className="mt-3 h-2 w-full rounded-full bg-[#38271F]/10 overflow-hidden">
                  <div
                    className="h-full bg-[#455342] transition-all duration-500"
                    style={{
                      width: `${(collectedFlowers.length / FLOWERS_DATA.length) * 100}%`,
                    }}
                  />
                </div>

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

                {flowerComplete && (
                  <div className="mt-4 pt-4 border-t border-[#455342]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#455342]">
                      Semua 7 bunga sudah terkumpul! Rangkaian buket siap dibuka.
                    </p>
                    <StorybookButton
                      type="button"
                      variant="primary"
                      onClick={claimReward}
                      className="!bg-[#A6533B] hover:!bg-[#8e442f] !border-[#A6533B] shrink-0"
                    >
                      <Award className="w-4 h-4" />
                      <span>Buka Flower Bucket ♡</span>
                    </StorybookButton>
                  </div>
                )}
              </div>

              <BotanicalDivider className="my-1" />

              {/* Quest 2: Three Little Questions */}
              <Quest2Challenge />

              <BotanicalDivider className="my-1" />

              {/* Quest 3: Find the Polaroids */}
              <div data-testid="quest-3-panel" className="paper-plate p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-[#743D4A]">
                      Quest 3 · {polaroidComplete ? 'Selesai' : 'Aktif'}
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-[#38271F]">
                      Find the Polaroids
                    </h3>
                  </div>
                  <span
                    data-testid="quest-3-progress"
                    className="text-sm font-semibold text-[#A6533B] tabular-nums"
                  >
                    {collectedPolaroids.length}/{TOTAL_POLAROIDS} Polaroid
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#38271F]/75">
                  Temukan lima Polaroid kecil yang tersembunyi di lima bab berbeda untuk membuka Our Little Heart Gallery.
                </p>

                <div className="h-2 w-full rounded-full bg-[#38271F]/10 overflow-hidden">
                  <div
                    className="h-full bg-[#743D4A] transition-all duration-500"
                    style={{
                      width: `${(collectedPolaroids.length / TOTAL_POLAROIDS) * 100}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POLAROIDS_QUEST_DATA.map((pol) => {
                    const found = collectedPolaroids.includes(pol.id);
                    return (
                      <div
                        key={pol.id}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors ${
                          found
                            ? 'bg-[#FBF6EE] border-[#743D4A]/35'
                            : 'bg-[#FBF6EE]/50 border-[#38271F]/10'
                        }`}
                      >
                        <div
                          className={`w-9 h-10 rounded-[2px] border border-[#38271F]/20 bg-[#FFFDF8] p-0.5 pb-2 shrink-0 flex items-center justify-center ${
                            found ? '' : 'opacity-40 grayscale'
                          }`}
                        >
                          {found ? (
                            <img
                              src={pol.imageUrl}
                              alt={pol.title}
                              className="w-full h-full object-cover rounded-[1px]"
                            />
                          ) : (
                            <Camera className="w-4 h-4 text-[#38271F]/60" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#38271F] flex items-center gap-1.5">
                            <span className="truncate">{pol.title}</span>
                            {found && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#743D4A] shrink-0" />
                            )}
                          </p>
                          <p className="text-[11px] text-[#38271F]/65 line-clamp-2">
                            {found ? `${pol.chapterLabel} · Sudah ditemukan!` : pol.clueHint}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {polaroidComplete && (
                  <div className="mt-2 pt-4 border-t border-[#743D4A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#743D4A]">
                      Semua 5 Polaroid ketemu! Our Little Heart Gallery siap dibuka.
                    </p>
                    <StorybookButton
                      type="button"
                      variant="primary"
                      data-testid="quest-3-open-gallery"
                      onClick={() => setHeartGalleryModalOpen(true)}
                      className="!bg-[#743D4A] hover:!bg-[#5c2f3a] !border-[#743D4A] shrink-0"
                    >
                      <Heart className="w-4 h-4 fill-[#E8BFC5]" />
                      <span>Buka Heart Gallery ♡</span>
                    </StorybookButton>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
