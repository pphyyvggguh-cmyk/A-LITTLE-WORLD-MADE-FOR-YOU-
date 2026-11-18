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
          className={`relative max-w-[220px] sm:max-w-[245px] bg-[#FBF6EE] text-[#38271F] border border-[#38271F]/18 rounded-2xl px-3 py-2 shadow-[0_8px_22px_rgba(56,39,31,0.16)] ${
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
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-hand text-[#A6533B]">
              Mini Oktaf ♡
            </span>
            {onOpenChat && (
              <button
                type="button"
                data-testid="mini-oktaf-chat-toggle"
                onClick={onOpenChat}
                className="inline-flex items-center gap-1 rounded-md bg-[#EAE0CF] hover:bg-[#E2D3BC] px-2 py-0.5 text-[10px] font-semibold text-[#743D4A] transition-colors cursor-pointer"
              >
                <MessageCircleHeart className="w-3 h-3 text-[#A6533B]" />
                <span>Ngobrol</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
