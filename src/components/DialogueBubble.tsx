import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EASE_OUT_EXPO } from '../utils/animation';

interface DialogueBubbleProps {
  message: string;
  visible: boolean;
  onDismiss?: () => void;
  position?: 'left' | 'top';
}

export function DialogueBubble({
  message,
  visible,
  onDismiss,
  position = 'left',
}: DialogueBubbleProps) {
  return (
    <AnimatePresence mode="wait">
      {visible && message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
          className={`relative max-w-[240px] sm:max-w-[270px] bg-[#FBF6EE] text-[#38271F] border border-[#38271F]/18 rounded-2xl px-3.5 py-2.5 shadow-[0_8px_22px_rgba(56,39,31,0.16)] ${
            position === 'top' ? 'mb-2' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-[13px] leading-relaxed font-medium text-[#38271F]">
              {message}
            </p>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Tutup pesan Mini Oktaf"
                className="shrink-0 w-6 h-6 -mr-1 -mt-0.5 rounded-full flex items-center justify-center text-[#38271F]/50 hover:text-[#38271F] hover:bg-[#38271F]/8 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="block mt-1 text-[10px] font-hand text-[#A6533B]">
            Mini Oktaf ♡
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
