import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Mail, MailOpen, X } from 'lucide-react';
import { HIDDEN_MESSAGES, HiddenEnvelopeMessage } from '../../data/hiddenMessages';
import { useContentStore } from '../../store/useContentStore';
import { EASE_OUT_EXPO } from '../../utils/animation';

interface HiddenEnvelopeTriggerProps {
  envelopeId?: string;
  note?: HiddenEnvelopeMessage;
  onOpen: (msg: HiddenEnvelopeMessage) => void;
  compact?: boolean;
}

/**
 * Physical miniature paper envelope attached to a scrapbook page.
 * Stops pointer & click propagation so opening it never turns the book spread.
 */
export function HiddenEnvelopeTrigger({
  envelopeId,
  note,
  onOpen,
  compact = false,
}: HiddenEnvelopeTriggerProps) {
  const secretNotes = useContentStore((s) => s.secretNotes);
  const storeNote = envelopeId
    ? secretNotes.find((item) => item.id === envelopeId && item.enabled)
    : undefined;
  const data = note ?? storeNote ?? (envelopeId ? HIDDEN_MESSAGES[envelopeId] : undefined);
  const [flapHover, setFlapHover] = useState(false);

  if (!data || data.enabled === false) return null;

  const displayTitle = data.title || data.label;
  const displayHint = data.hint || 'Ketuk amplop kecil';

  return (
    <button
      type="button"
      data-interactive-item="true"
      data-no-swipe="true"
      data-secret-note-id={data.id}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setFlapHover(true)}
      onMouseLeave={() => setFlapHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(data);
      }}
      aria-label={`Buka amplop tersembunyi: ${displayTitle}`}
      className={`group relative text-left bg-[#F5E8D5] border border-[#38271F]/20 rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A6533B] ${
        compact ? 'px-2.5 py-1.5 max-w-[188px]' : 'px-3 py-2.5 sm:px-3.5 sm:py-3 max-w-[210px]'
      }`}
    >
      {/* Washi tape holding the envelope to the page */}
      <span
        aria-hidden="true"
        className="washi-tape-gold absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3 -rotate-2"
      />

      {/* Envelope V-flap illustration */}
      <svg
        viewBox="0 0 120 28"
        className={`w-full h-3 sm:h-4 -mt-0.5 transition-transform duration-200 origin-top ${
          flapHover ? '-scale-y-75' : ''
        }`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0 L60 24 L120 0"
          fill="#EFE0C9"
          stroke="#38271F"
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />
      </svg>

      <div className="mt-1 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shrink-0 flex items-center justify-center text-[#F4EBDD] shadow-xs group-hover:scale-105 transition-transform"
          style={{ backgroundColor: data.sealColor }}
        >
          {flapHover ? <MailOpen className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
        </span>
        <div className="min-w-0">
          <p className="font-serif text-[10px] sm:text-xs font-semibold text-[#38271F] leading-tight line-clamp-2">
            {displayHint}
          </p>
          <p className="hidden sm:block text-[9px] text-[#743D4A] truncate">{displayTitle}</p>
        </div>
      </div>
    </button>
  );
}

interface HiddenEnvelopeModalProps {
  envelope: HiddenEnvelopeMessage | null;
  onClose: () => void;
}

export function HiddenEnvelopeModal({ envelope, onClose }: HiddenEnvelopeModalProps) {
  useEffect(() => {
    if (!envelope) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [envelope, onClose]);

  return (
    <AnimatePresence>
      {envelope && (
        <motion.div
          key="hidden-envelope-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-[#38271F]/65 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <motion.article
            role="dialog"
            aria-modal="true"
            aria-labelledby="hidden-envelope-title"
            initial={{ opacity: 0, y: 24, scale: 0.94, rotate: -1 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="journal-lined relative w-full max-w-lg border border-[#38271F]/20 rounded-2xl shadow-2xl px-6 py-7 sm:px-9 sm:py-9 my-auto"
          >
            {/* Washi tape top */}
            <span
              aria-hidden="true"
              className="washi-tape absolute -top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 rotate-1"
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pesan amplop"
              className="absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-full bg-[#F4EBDD] border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-[#743D4A] font-medium pr-10">
              <span
                aria-hidden="true"
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#F4EBDD]"
                style={{ backgroundColor: envelope.sealColor }}
              >
                <Heart className="w-3 h-3 fill-[#F4EBDD]" />
              </span>
              <span>{envelope.title || envelope.label}</span>
              <span aria-hidden="true">·</span>
              <span className="uppercase tracking-wider text-[10px]">{envelope.stampText}</span>
            </div>

            <h2
              id="hidden-envelope-title"
              className="mt-4 font-hand text-2xl sm:text-3xl text-[#38271F]"
            >
              {envelope.recipient || envelope.greeting}
            </h2>

            <p className="mt-3 text-sm sm:text-base text-[#38271F]/88 leading-relaxed whitespace-pre-line">
              {envelope.message}
            </p>

            <p className="mt-6 font-hand text-xl text-[#A6533B] text-right">
              {envelope.signature}
            </p>

            <div className="mt-6 pt-4 border-t border-[#38271F]/12 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-medium hover:bg-[#4e382d] transition-colors cursor-pointer"
              >
                Simpan Kembali
              </button>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
