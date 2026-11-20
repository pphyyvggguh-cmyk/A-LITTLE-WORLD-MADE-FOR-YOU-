import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, MessageCircle, MessageCircleHeart } from 'lucide-react';
import { OKTAF_EXPRESSION_PATHS, OKTAF_POSE_PATHS } from '../data/miniOktaf';
import { useStore } from '../store/useStore';
import { DialogueBubble } from './DialogueBubble';
import { MiniOktafChatPanel } from './MiniOktafChatPanel';
import { EASE_OUT_EXPO } from '../utils/animation';

interface MiniOktafCharacterProps {
  /** Inline mode renders Mini Oktaf inside a section (e.g. Welcome screen), floating mode pins him safely in corner */
  mode?: 'floating' | 'inline';
  className?: string;
}

export function MiniOktafCharacter({
  mode = 'floating',
  className = '',
}: MiniOktafCharacterProps) {
  const oktaf = useStore((s) => s.oktaf);
  const triggerSingleTap = useStore((s) => s.triggerOktafSingleTap);
  const triggerDoubleTap = useStore((s) => s.triggerOktafDoubleTap);
  const toggleMinimized = useStore((s) => s.toggleOktafMinimized);
  const dismissBubble = useStore((s) => s.dismissBubble);

  const [chatOpen, setChatOpen] = useState(false);

  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<number | null>(null);

  const poseSrc = OKTAF_POSE_PATHS[oktaf.pose] ?? OKTAF_POSE_PATHS.waving;
  const exprSrc = OKTAF_EXPRESSION_PATHS[oktaf.expression] ?? OKTAF_EXPRESSION_PATHS.happy;

  const handleCharacterTap = () => {
    const now = Date.now();
    const delta = lastTapTimeRef.current > 0 ? now - lastTapTimeRef.current : -1;

    if (delta >= 0 && delta < 440) {
      if (singleTapTimerRef.current) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      triggerDoubleTap();
      return;
    }

    lastTapTimeRef.current = now;
    if (singleTapTimerRef.current) {
      window.clearTimeout(singleTapTimerRef.current);
    }
    singleTapTimerRef.current = window.setTimeout(() => {
      triggerSingleTap();
      singleTapTimerRef.current = null;
    }, 365);
  };

  if (mode === 'inline') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <DialogueBubble message={oktaf.message} visible={oktaf.bubbleVisible} position="top" />
        <motion.button
          type="button"
          onClick={handleCharacterTap}
          aria-label="Mini Oktaf — ketuk untuk menyapa, ketuk dua kali untuk misi rahasia"
          className="relative group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A6533B] rounded-2xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={poseSrc}
              src={poseSrc}
              alt="Mini Oktaf"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_12px_20px_rgba(56,39,31,0.18)] select-none"
              draggable={false}
            />
          </AnimatePresence>
        </motion.button>
      </div>
    );
  }

  // Floating companion mode (non-obstructive on Android mobile bottom nav & Desktop)
  if (oktaf.minimized) {
    return (
      <>
        <MiniOktafChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
        <div
          data-no-chapter-swipe="true"
          className={`fixed bottom-[70px] right-2.5 md:bottom-5 md:right-5 z-40 flex items-center gap-1.5 sm:gap-2 ${className}`}
        >
          <button
            type="button"
            data-testid="mini-oktaf-chat-toggle"
            onClick={() => setChatOpen((v) => !v)}
            aria-label="Ngobrol bareng Mini Oktaf"
            className="min-h-[42px] px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-[11px] sm:text-xs font-medium inline-flex items-center gap-1.5 shadow-lg hover:bg-[#3f202c] transition-colors cursor-pointer"
          >
            <MessageCircleHeart className="w-3.5 h-3.5 text-[#EBC9CB]" />
            <span>Ngobrol</span>
          </button>

          <button
            type="button"
            onClick={() => toggleMinimized(false)}
            aria-label="Tampilkan Mini Oktaf"
            className="flex items-center gap-1.5 bg-[#FFFDFC] border border-[#30272A]/16 rounded-xl pl-1 pr-2.5 py-1 shadow-lg hover:bg-[#F8F1E8] transition-colors cursor-pointer min-h-[42px]"
          >
            <img
              src={exprSrc}
              alt="Mini Oktaf"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain bg-[#EBC9CB]/35"
            />
            <span className="text-[11px] sm:text-xs font-medium text-[#30272A]">Oktaf</span>
            <MessageCircle className="w-3 h-3 text-[#A95F70] hidden sm:inline" />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <MiniOktafChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      <aside
        aria-label="Pemandu Mini Oktaf"
        data-no-chapter-swipe="true"
        className={`fixed bottom-[70px] right-2.5 md:bottom-5 md:right-5 z-40 flex flex-col items-end pointer-events-none ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-end gap-2 pointer-events-auto">
          <div className="order-1 sm:order-1 mb-1 sm:mb-6">
            <DialogueBubble
              message={oktaf.message}
              visible={oktaf.bubbleVisible}
              onDismiss={dismissBubble}
              onOpenChat={() => setChatOpen(true)}
              chatOpen={chatOpen}
            />
          </div>

          <div className="order-2 sm:order-2 flex flex-col items-center gap-1">
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={handleCharacterTap}
                aria-label="Mini Oktaf — ketuk sekali untuk mengobrol, ketuk dua kali untuk membuka misi rahasia"
                className="relative cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A95F70] rounded-xl active:scale-95 transition-transform"
              >
                <img
                  src={poseSrc}
                  alt="Mini Oktaf"
                  className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-[0_10px_18px_rgba(48,39,42,0.18)] select-none transition-transform duration-200"
                  draggable={false}
                />
              </button>

              <button
                type="button"
                onClick={() => toggleMinimized(true)}
                aria-label="Sembunyikan sementara Mini Oktaf"
                title="Sembunyikan Mini Oktaf"
                className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#FFFDFC] border border-[#30272A]/16 text-[#6E5F63] hover:text-[#30272A] hover:bg-[#F8F1E8] flex items-center justify-center shadow-sm cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Always-accessible AI chat button (even if dialogue bubble was dismissed) */}
            {(!oktaf.bubbleVisible || chatOpen) && (
              <button
                type="button"
                data-testid="mini-oktaf-chat-toggle-always"
                onClick={() => setChatOpen((v) => !v)}
                className="rounded-xl bg-[#552E3D] text-[#FFFDFC] px-2.5 py-1 text-[10px] font-medium inline-flex items-center gap-1 shadow-md hover:bg-[#3f202c] cursor-pointer"
              >
                <MessageCircleHeart className="w-3 h-3 text-[#EBC9CB]" />
                <span>{chatOpen ? 'Tutup Chat' : 'Ngobrol AI'}</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
