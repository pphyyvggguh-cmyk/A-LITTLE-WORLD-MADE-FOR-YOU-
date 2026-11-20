import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookmarkCheck, Compass, Flower2, Lock, RotateCcw, X } from 'lucide-react';
import { FLOWERS_DATA } from '../data/flowers';
import { useFirebaseAuth } from '../lib/FirebaseProvider';
import { useStore } from '../store/useStore';
import { MOTION_INTERFACE } from '../utils/animation';
import { getChapterIndexSummary } from '../utils/storybookMotion';
import { BookCornerOrnamentSVG } from './storybook/StorybookIllustrations';

interface ContentsDrawerProps {
  open: boolean;
  onClose: () => void;
  onChapterSelected?: () => void;
}

export function ContentsDrawer({
  open,
  onClose,
  onChapterSelected,
}: ContentsDrawerProps) {
  const { isAdmin } = useFirebaseAuth();
  const currentSection = useStore((s) => s.currentSection);
  const visitedSections = useStore((s) => s.visitedSections);
  const collectedFlowers = useStore((s) => s.collectedFlowers);
  const questDiscovered = useStore((s) => s.questDiscovered);
  const rewardClaimed = useStore((s) => s.rewardClaimed);
  const navigateTo = useStore((s) => s.navigateTo);
  const setQuestModalOpen = useStore((s) => s.setQuestModalOpen);
  const lockExperience = useStore((s) => s.lockExperience);
  const replayBookIntro = useStore((s) => s.replayBookIntro);

  const isRewardUnlocked =
    rewardClaimed || collectedFlowers.length >= FLOWERS_DATA.length;

  const summary = getChapterIndexSummary(
    currentSection,
    visitedSections,
    isRewardUnlocked
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleNavigate = (sectionId: (typeof summary.chapters)[number]['id']) => {
    navigateTo(sectionId);
    onChapterSelected?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Jelajahi Semua Bab Dunia Kecil"
        >
          {/* Warm linen vignette backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#30272A]/45"
          />

          {/* Clean Editorial Sheet / Folio */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={MOTION_INTERFACE}
            className="relative z-10 w-full sm:max-w-lg max-h-[86dvh] flex flex-col bg-[#FFFDFC] border border-[#30272A]/14 rounded-t-2xl sm:rounded-2xl shadow-polaroid-lifted overflow-hidden"
          >
            {/* Mobile grab bar */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1">
              <span className="w-10 h-1 rounded-full bg-[#30272A]/18" />
            </div>

            <BookCornerOrnamentSVG className="pointer-events-none hidden sm:block absolute top-2.5 left-2.5 w-4 h-4 opacity-40" />

            {/* Chapter Folio Header */}
            <header className="px-5 sm:px-7 pt-4 sm:pt-6 pb-4 border-b border-[#30272A]/10 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#552E3D]">
                  <Compass className="w-3.5 h-3.5 text-[#A95F70]" />
                  <span>Explore All Chapters</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-[#4E5D49]">
                    {summary.visitedCount}/{summary.totalAccessibleCount} dibuka
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-semibold text-[#30272A] tracking-tight">
                  Our Little Universe
                </h2>
                <p className="font-hand text-lg text-[#6E5F63] leading-tight">
                  Pilih cerita, suara, surat, atau kejutan yang ingin dibuka.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup daftar bab"
                className="min-w-[44px] min-h-[44px] -mr-2 rounded-xl flex items-center justify-center text-[#6E5F63] hover:text-[#30272A] hover:bg-[#F8F1E8] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Chapter Index List */}
            <nav
              aria-label="Indeks bab dunia kecil"
              className="flex-1 overflow-y-auto px-4 sm:px-7 py-3 divide-y divide-[#30272A]/8"
            >
              {summary.chapters.map((chapter) => {
                if (chapter.requiresReward && chapter.isLocked && !questDiscovered) {
                  return null;
                }

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => handleNavigate(chapter.id)}
                    aria-current={chapter.isCurrent ? 'page' : undefined}
                    className={`w-full min-h-[54px] py-3 px-3 -mx-1 rounded-xl flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                      chapter.isCurrent
                        ? 'bg-[#EBC9CB]/30 text-[#30272A]'
                        : 'hover:bg-[#F8F1E8] text-[#30272A]/88'
                    }`}
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span
                        className={`text-xs font-semibold tabular-nums shrink-0 ${
                          chapter.isCurrent ? 'text-[#A95F70]' : 'text-[#552E3D]/70'
                        }`}
                      >
                        {chapter.chapterNumber}
                      </span>
                      <div className="min-w-0">
                        <p
                          className={`font-serif text-base truncate ${
                            chapter.isCurrent
                              ? 'font-semibold text-[#552E3D]'
                              : 'font-medium text-[#30272A]'
                          }`}
                        >
                          {chapter.title}
                        </p>
                        <p className="text-xs text-[#6E5F63] truncate">
                          {chapter.isLocked
                            ? `Terkunci (${collectedFlowers.length}/${FLOWERS_DATA.length} bunga)`
                            : chapter.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium">
                      {chapter.isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[#A95F70] whitespace-nowrap">
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </span>
                      ) : chapter.isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-[#6E5F63]" />
                      ) : (
                        <span className="text-sm text-[#6E5F63] font-serif">→</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Footer: Secret Quest Quick Access & Utility Actions */}
            <footer className="px-5 sm:px-7 py-3.5 border-t border-[#30272A]/10 bg-[#F8F1E8]/85 flex items-center justify-between gap-3 flex-wrap">
              {questDiscovered ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setQuestModalOpen(true);
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-medium text-[#4E5D49] hover:text-[#30272A] cursor-pointer"
                >
                  <Flower2 className="w-4 h-4 text-[#A95F70]" />
                  <span className="tabular-nums">
                    Secret Quest ({collectedFlowers.length}/{FLOWERS_DATA.length})
                  </span>
                </button>
              ) : (
                <span className="font-hand text-base text-[#6E5F63]">
                  A Little World Made For You ♡
                </span>
              )}

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    replayBookIntro();
                  }}
                  className="min-h-[40px] px-2 inline-flex items-center gap-1 text-xs font-medium text-[#6E5F63] hover:text-[#552E3D] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Putar Intro</span>
                </button>
                <span aria-hidden="true" className="text-[#30272A]/25">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    lockExperience();
                  }}
                  className="min-h-[40px] px-2 inline-flex items-center gap-1 text-xs font-medium text-[#6E5F63] hover:text-[#552E3D] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Kunci</span>
                </button>
                {isAdmin && (
                  <>
                    <span aria-hidden="true" className="text-[#30272A]/25">
                      ·
                    </span>
                    <a
                      href="/admin"
                      onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        window.history.pushState(null, '', '/admin');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="min-h-[40px] px-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#6E5F63] hover:text-[#552E3D] transition-colors whitespace-nowrap"
                    >
                      <span>Control Room</span>
                    </a>
                  </>
                )}
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
