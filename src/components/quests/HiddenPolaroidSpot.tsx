import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { POLAROIDS_QUEST_DATA } from '../../data/quests';
import { useStore } from '../../store/useStore';
import { EASE_OUT_EXPO } from '../../utils/animation';

interface HiddenPolaroidSpotProps {
  polaroidId: string;
  className?: string;
}

export function HiddenPolaroidSpot({ polaroidId, className = '' }: HiddenPolaroidSpotProps) {
  const collectedPolaroids = useStore((s) => s.collectedPolaroids);
  const collectPolaroid = useStore((s) => s.collectPolaroid);
  const [justPicked, setJustPicked] = useState(false);

  const meta = POLAROIDS_QUEST_DATA.find((p) => p.id === polaroidId);
  if (!meta) return null;

  const isCollected = collectedPolaroids.includes(polaroidId);

  const handleCollect = () => {
    if (isCollected) return;
    setJustPicked(true);
    collectPolaroid(polaroidId);
  };

  return (
    <div
      data-no-chapter-swipe="true"
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <AnimatePresence mode="wait">
        {!isCollected ? (
          <motion.button
            key="polaroid-uncollected"
            type="button"
            data-testid={`hidden-polaroid-${polaroidId}`}
            onClick={handleCollect}
            aria-label={`Kumpulkan Polaroid tersembunyi: ${meta.title}`}
            title={`${meta.title} — ${meta.notePreview}`}
            initial={{ scale: 0.92, opacity: 0.9, rotate: -6 }}
            whileHover={{ scale: 1.12, rotate: 2 }}
            whileTap={{ scale: 0.92 }}
            animate={
              justPicked
                ? { scale: [1, 1.35, 0], rotate: [0, 14, 28], opacity: [1, 1, 0] }
                : { scale: 1, opacity: 0.92, rotate: -5 }
            }
            transition={{ duration: justPicked ? 0.48 : 0.24, ease: EASE_OUT_EXPO }}
            className="group relative min-w-[44px] min-h-[44px] p-1 rounded-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A6533B]"
          >
            <span className="sr-only">{meta.title}</span>
            {/* Mini tilted Polaroid charm */}
            <div className="relative w-10 h-11 rounded-[3px] bg-[#FFFDF8] border border-[#38271F]/22 p-1 pb-2.5 shadow-[0_6px_14px_rgba(56,39,31,0.22)]">
              <div className="w-full h-full rounded-[2px] overflow-hidden bg-[#EAE0CF]">
                <img
                  src={meta.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#E8BFC5] border border-[#743D4A]/40 flex items-center justify-center text-[#743D4A]"
              >
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="polaroid-collected"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.65 }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center pointer-events-none select-none"
            aria-label={`${meta.title} sudah ditemukan`}
          >
            <div className="w-8 h-8 rounded-md border border-dashed border-[#455342]/45 bg-[#FBF6EE]/65 flex items-center justify-center text-[11px] font-hand text-[#455342]">
              ✓
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
