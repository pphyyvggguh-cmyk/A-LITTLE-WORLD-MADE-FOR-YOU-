import { MessageCircleHeart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EASE_OUT_EXPO } from '../utils/animation';

interface DialogueBubbleProps {
  message: string;
  visible: boolean;
  onDismiss?: () => void;
  onOpenChat?: () => void;
  chatOpen?: boolean;
  position?: 'left' | 'top';
}

export function DialogueBubble({
  message,
  visible,
  onDismiss,
  onOpenChat,
  chatOpen = false,
  position = 'left',
}: DialogueBubbleProps) {
  return (
    <AnimatePresence mode="wait">
      {visible && message && !chatOpen && (
        <motion.div
          key={message}
          data-no-chapter-swipe="true"
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
          className={`relative max-w-[205px] sm:max-w-[248px] bg-[#FFFDFC] text-[#30272A] border border-[#30272A]/14 rounded-2xl px-3.5 py-2.5 shadow-[0_8px_24px_rgba(48,39,42,0.14)] ${
            position === 'top' ? 'mb-2' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs sm:text-[13px] leading-relaxed font-medium text-[#30272A]">
              {message}
            </p>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Tutup pesan Mini Oktaf"
                className="shrink-0 w-6 h-6 -mr-1 -mt-0.5 rounded-full flex items-center justify-center text-[#6E5F63] hover:text-[#30272A] hover:bg-[#F8F1E8] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-hand font-semibold text-[#552E3D]">
              Mini Oktaf ♡
            </span>
            {onOpenChat && (
              <button
                type="button"
                data-testid="mini-oktaf-chat-toggle"
                onClick={onOpenChat}
                className="inline-flex items-center gap-1 rounded-lg bg-[#EBC9CB]/45 hover:bg-[#EBC9CB]/70 px-2.5 py-1 text-[10px] font-semibold text-[#552E3D] transition-colors cursor-pointer"
              >
                <MessageCircleHeart className="w-3 h-3 text-[#A95F70]" />
                <span>Ngobrol</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
