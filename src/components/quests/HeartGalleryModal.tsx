import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Heart, RotateCcw, Sparkles, X } from 'lucide-react';
import {
  DEFAULT_HEART_GALLERY_PHOTOS,
  HEART_GALLERY_THEMES,
  HeartGalleryPhoto,
  HeartGalleryTheme,
} from '../../data/quests';
import { useContentStore } from '../../store/useContentStore';
import { useStore } from '../../store/useStore';
import { EASE_OUT_EXPO } from '../../utils/animation';
import {
  computeHeartContourSvgPath,
  computeHeartLayout,
  normalizeHeartGalleryOrder,
} from '../../utils/quests';

function ThemeCornerMotif({
  theme,
  compact = false,
}: {
  theme: HeartGalleryTheme;
  compact?: boolean;
}) {
  const sizeClass = compact ? 'w-3.5 h-3.5' : 'w-5 h-5';
  switch (theme) {
    case 'flowers':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <circle cx="12" cy="7" r="3" fill="#E8BFC5" />
          <circle cx="17" cy="11" r="3" fill="#E8BFC5" />
          <circle cx="15" cy="16" r="3" fill="#E8BFC5" />
          <circle cx="9" cy="16" r="3" fill="#E8BFC5" />
          <circle cx="7" cy="11" r="3" fill="#E8BFC5" />
          <circle cx="12" cy="12" r="2.5" fill="#743D4A" />
        </svg>
      );
    case 'butterflies':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <path d="M12 12 C8 5 3 7 5 12 C3 16 8 18 12 13 Z" fill="#8FB3C9" stroke="#38271F" strokeWidth="0.9" />
          <path d="M12 12 C16 5 21 7 19 12 C21 16 16 18 12 13 Z" fill="#8FB3C9" stroke="#38271F" strokeWidth="0.9" />
          <line x1="12" y1="8" x2="12" y2="17" stroke="#38271F" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'stars':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <path
            d="M12 3 L14.4 9.1 L21 9.6 L15.8 13.8 L17.5 20.2 L12 16.6 L6.5 20.2 L8.2 13.8 L3 9.6 L9.6 9.1 Z"
            fill="#E6B85C"
            stroke="#A6533B"
            strokeWidth="1"
          />
        </svg>
      );
    case 'notes':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="#FBF6EE" stroke="#38271F" strokeWidth="1.2" />
          <line x1="7" y1="9" x2="17" y2="9" stroke="#743D4A" strokeWidth="1.2" />
          <line x1="7" y1="13" x2="15" y2="13" stroke="#38271F" strokeWidth="1" opacity="0.6" />
          <line x1="7" y1="16" x2="13" y2="16" stroke="#38271F" strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case 'stamps':
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <rect
            x="4"
            y="5"
            width="16"
            height="14"
            rx="1.5"
            fill="#F4EBDD"
            stroke="#743D4A"
            strokeWidth="1.4"
            strokeDasharray="2 1.5"
          />
          <circle cx="12" cy="12" r="3.4" fill="#E8BFC5" stroke="#743D4A" strokeWidth="0.9" />
        </svg>
      );
    case 'scrapbook':
    default:
      return (
        <svg viewBox="0 0 24 24" className={sizeClass} aria-hidden="true">
          <rect
            x="3"
            y="8"
            width="18"
            height="8"
            rx="1"
            transform="rotate(-14 12 12)"
            fill="#E8BFC5"
            opacity="0.88"
            stroke="#743D4A"
            strokeWidth="0.9"
          />
        </svg>
      );
  }
}

interface HeartGalleryCanvasProps {
  photos: HeartGalleryPhoto[];
  onSelectPhoto?: (photo: HeartGalleryPhoto) => void;
  stage?: 'floating' | 'heart';
  compact?: boolean;
}

export function HeartGalleryCanvas({
  photos,
  onSelectPhoto,
  stage = 'heart',
  compact = false,
}: HeartGalleryCanvasProps) {
  const ordered = useMemo(
    () =>
      normalizeHeartGalleryOrder(
        photos.length > 0 ? photos.filter((p) => p.isPublished !== false) : DEFAULT_HEART_GALLERY_PHOTOS
      ),
    [photos]
  );

  const layout = useMemo(() => computeHeartLayout(ordered.length), [ordered.length]);
  const contourPath = useMemo(() => computeHeartContourSvgPath(), []);

  return (
    <div
      className={`relative w-full mx-auto select-none ${
        compact ? 'max-w-[380px] aspect-square' : 'max-w-[600px] aspect-square'
      }`}
    >
      {/* Subtle guiding heart contour matching parametric layout */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-25"
      >
        <path
          d={contourPath}
          fill="none"
          stroke="#743D4A"
          strokeWidth="0.7"
          strokeDasharray="2.5 2.5"
        />
      </svg>

      {/* Center heart title badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: stage === 'heart' ? 1 : 0.25,
          scale: stage === 'heart' ? 1 : 0.92,
        }}
        transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
        className="pointer-events-none absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 z-10 text-center px-3"
      >
        <Heart className="w-4 h-4 sm:w-5 sm:h-5 mx-auto fill-[#E8BFC5] text-[#A6533B]" />
        <p className="mt-0.5 font-serif text-xs sm:text-sm font-semibold text-[#38271F]">
          Our Little Heart
        </p>
        <p className="text-[10px] sm:text-[11px] font-hand text-[#743D4A]">
          {ordered.length} kenangan kecil ♡
        </p>
      </motion.div>

      {/* Arranged Polaroid Tiles */}
      <motion.div
        animate={{ scale: stage === 'floating' ? 1.24 : 1 }}
        transition={{ duration: 1.05, ease: EASE_OUT_EXPO }}
        className="relative w-full h-full"
      >
        {ordered.map((photo, idx) => {
          const point = layout[idx];
          if (!point) return null;
          const themeMeta =
            HEART_GALLERY_THEMES.find((t) => t.id === photo.theme) ?? HEART_GALLERY_THEMES[5];

          // Starting floating scatter prior to camera zoom-out into heart shape
          const floatOffsetX = ((idx % 4) - 1.5) * 14;
          const floatOffsetY = ((idx % 3) - 1) * 14;

          return (
            <motion.button
              key={photo.id}
              type="button"
              data-testid={`heart-photo-tile-${idx}`}
              onClick={() => onSelectPhoto?.(photo)}
              aria-label={`Lihat foto kenangan: ${photo.caption}`}
              initial={{
                left: `${50 + floatOffsetX}%`,
                top: `${50 + floatOffsetY}%`,
                opacity: 0,
                scale: 0.6,
                rotate: (idx % 2 === 0 ? 1 : -1) * 18,
              }}
              animate={{
                left: `${point.xPercent}%`,
                top: `${point.yPercent}%`,
                opacity: 1,
                scale: stage === 'floating' ? 0.85 : point.scale,
                rotate: point.rotationDeg,
              }}
              whileHover={{ scale: 1.24, zIndex: 40, rotate: 0 }}
              whileTap={{ scale: 0.96 }}
              transition={{
                duration: 0.82,
                delay: idx * 0.032,
                ease: EASE_OUT_EXPO,
              }}
              style={{
                backgroundColor: themeMeta.bgTint,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-[#38271F]/20 shadow-[0_6px_14px_rgba(56,39,31,0.18)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A6533B] ${
                compact
                  ? 'w-8 sm:w-10 p-0.5 pb-1.5'
                  : 'w-[40px] sm:w-[52px] md:w-[56px] p-1 pb-2 sm:pb-2.5'
              } ${point.ring === 'inner' ? 'z-20' : 'z-10'}`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-[2px] bg-[#EAE0CF]">
                <img
                  src={photo.imageUrl}
                  alt={photo.caption}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="pointer-events-none absolute -top-1.5 -right-1.5">
                <ThemeCornerMotif theme={photo.theme} compact />
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

export function HeartGalleryModal() {
  const open = useStore((s) => s.heartGalleryModalOpen);
  const setOpen = useStore((s) => s.setHeartGalleryModalOpen);
  const galleryRaw = useContentStore((s) => s.heartGallery);

  const photos = useMemo(
    () =>
      normalizeHeartGalleryOrder(
        galleryRaw.filter((item) => item.isPublished !== false).length > 0
          ? galleryRaw.filter((item) => item.isPublished !== false)
          : DEFAULT_HEART_GALLERY_PHOTOS
      ),
    [galleryRaw]
  );

  const [stage, setStage] = useState<'floating' | 'heart'>('floating');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [animRun, setAnimRun] = useState(0);

  useEffect(() => {
    if (!open) {
      setSelectedIndex(null);
      return;
    }
    setStage('floating');
    const timer = window.setTimeout(() => setStage('heart'), 900);
    return () => window.clearTimeout(timer);
  }, [open, animRun]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedIndex !== null) {
          setSelectedIndex(null);
        } else {
          setOpen(false);
        }
      } else if (e.key === 'ArrowRight' && selectedIndex !== null) {
        setSelectedIndex((idx) => (idx === null ? 0 : (idx + 1) % photos.length));
      } else if (e.key === 'ArrowLeft' && selectedIndex !== null) {
        setSelectedIndex((idx) =>
          idx === null ? 0 : (idx - 1 + photos.length) % photos.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, selectedIndex, photos.length, setOpen]);

  const activePhoto = selectedIndex !== null ? photos[selectedIndex] ?? null : null;
  const activeThemeMeta = activePhoto
    ? HEART_GALLERY_THEMES.find((t) => t.id === activePhoto.theme) ?? HEART_GALLERY_THEMES[5]
    : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="heart-gallery-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-[#1E1410]/84 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Our Little Heart Gallery"
            data-testid="heart-gallery-modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="paper-sheet relative w-full max-w-3xl p-4 sm:p-7 my-auto shadow-polaroid-lifted max-h-[92dvh] overflow-y-auto storybook-chapter-scroll"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup Our Little Heart Gallery"
              className="absolute top-3.5 right-3.5 z-30 min-w-[44px] min-h-[44px] rounded-full bg-[#F4EBDD] border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pr-12">
              <p className="editorial-kicker flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#A6533B]" />
                <span>Hadiah Quest 3 · 5/5 Polaroid Terkumpul</span>
              </p>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#38271F]">
                Our Little Heart Gallery ♡
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#38271F]/74">
                Ketuk salah satu Polaroid di susunan hati ini untuk melihat cerita dan tema bingkainya lebih dekat.
              </p>
            </div>

            <div className="mt-4 rounded-2xl paper-plate border border-[#C4A574]/40 p-2 sm:p-5 overflow-hidden">
              <HeartGalleryCanvas
                photos={photos}
                stage={stage}
                onSelectPhoto={(photo) => {
                  const foundIdx = photos.findIndex((p) => p.id === photo.id);
                  if (foundIdx >= 0) setSelectedIndex(foundIdx);
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#38271F]/70">
              <span>{photos.length} foto tersusun membentuk hati</span>
              <button
                type="button"
                onClick={() => setAnimRun((n) => n + 1)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#38271F]/18 bg-[#FBF6EE] text-xs font-medium text-[#38271F] hover:bg-[#EAE0CF] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#A6533B]" />
                <span>Putar Ulang Animasi</span>
              </button>
            </div>
          </motion.section>

          {/* Interactive Enlarged Polaroid Lightbox */}
          <AnimatePresence>
            {activePhoto && activeThemeMeta && (
              <motion.div
                key={`lightbox-${activePhoto.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(null);
                }}
                className="fixed inset-0 z-[70] bg-[#140D0A]/86 flex items-center justify-center p-4"
              >
                <motion.article
                  role="dialog"
                  aria-modal="true"
                  aria-label={activePhoto.caption}
                  data-testid="heart-gallery-lightbox"
                  initial={{ opacity: 0, scale: 0.82, rotate: -3, y: 16 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ backgroundColor: activeThemeMeta.bgTint }}
                  className="relative w-full max-w-md rounded-md border border-[#38271F]/22 p-4 sm:p-5 pb-6 shadow-2xl"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(null)}
                    aria-label="Tutup pratinjau foto"
                    className="absolute -top-3 -right-3 z-20 min-w-[42px] min-h-[42px] rounded-full bg-[#FBF6EE] border border-[#38271F]/20 text-[#38271F] flex items-center justify-center shadow-polaroid cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Decorative Corner Motif */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#38271F]/14 bg-[#FBF6EE]/80 text-[11px] font-medium"
                      style={{ color: activeThemeMeta.accent }}
                    >
                      <ThemeCornerMotif theme={activePhoto.theme} compact />
                      <span>Tema {activeThemeMeta.label}</span>
                    </span>
                    {activePhoto.dateLabel && (
                      <span className="text-[11px] font-medium text-[#38271F]/65">
                        {activePhoto.dateLabel}
                      </span>
                    )}
                  </div>

                  {/* Photo container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-[#EAE0CF] border border-[#38271F]/12">
                    <img
                      src={activePhoto.imageUrl}
                      alt={activePhoto.caption}
                      className="w-full h-full object-contain bg-[#FBF6EE]"
                    />
                  </div>

                  {/* Polaroid Caption Area */}
                  <div className="mt-4 text-center space-y-1 px-2">
                    <p className="font-hand text-2xl sm:text-[26px] text-[#38271F] leading-snug">
                      {activePhoto.caption}
                    </p>
                  </div>

                  {/* Prev / Next Navigation */}
                  {photos.length > 1 && (
                    <div className="mt-5 pt-3 border-t border-[#38271F]/12 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedIndex((idx) =>
                            idx === null ? 0 : (idx - 1 + photos.length) % photos.length
                          )
                        }
                        className="min-h-[40px] px-3 rounded-lg border border-[#38271F]/18 bg-[#FBF6EE] text-xs font-semibold text-[#38271F] inline-flex items-center gap-1 hover:bg-[#EAE0CF] cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Sebelumnya</span>
                      </button>

                      <span className="text-xs font-medium text-[#38271F]/65 tabular-nums">
                        {(selectedIndex ?? 0) + 1} / {photos.length}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedIndex((idx) => (idx === null ? 0 : (idx + 1) % photos.length))
                        }
                        className="min-h-[40px] px-3 rounded-lg border border-[#38271F]/18 bg-[#FBF6EE] text-xs font-semibold text-[#38271F] inline-flex items-center gap-1 hover:bg-[#EAE0CF] cursor-pointer"
                      >
                        <span>Berikutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.article>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
