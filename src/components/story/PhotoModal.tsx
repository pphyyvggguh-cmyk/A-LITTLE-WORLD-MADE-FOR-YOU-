import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageOff, MapPin, X } from 'lucide-react';
import { BookPolaroidItem } from '../../data/memories';
import { EASE_OUT_EXPO } from '../../utils/animation';

interface PhotoModalProps {
  polaroid: BookPolaroidItem | null;
  pageLabel?: string;
  onClose: () => void;
}

export function PhotoModal({ polaroid, pageLabel, onClose }: PhotoModalProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [polaroid?.id, polaroid?.image]);

  useEffect(() => {
    if (!polaroid) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [polaroid, onClose]);

  return (
    <AnimatePresence>
      {polaroid && (
        <motion.div
          key="story-photo-modal"
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
            aria-labelledby="story-photo-modal-title"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-[#FBF6EE] border border-[#38271F]/20 rounded-2xl shadow-2xl overflow-hidden my-auto"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup tampilan foto"
              className="absolute top-3 right-3 z-20 min-w-[44px] min-h-[44px] rounded-full bg-[#FBF6EE]/95 border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF] flex items-center justify-center shadow-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Larger Framed Photograph */}
              <div className="bg-[#EFE4D3] p-5 sm:p-7 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#38271F]/12">
                <div className="w-full max-w-[310px] bg-[#FBF8F2] p-3 pb-5 rounded-[3px] shadow-polaroid -rotate-1">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#EAE0CF] border border-[#38271F]/10">
                    {!imgError ? (
                      <img
                        src={polaroid.image}
                        alt={polaroid.title}
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-[#38271F]/70 bg-gradient-to-br from-[#F4EBDD] to-[#E2D2BA]">
                        <ImageOff className="w-7 h-7 mb-2 opacity-60" />
                        <span className="font-serif text-sm">{polaroid.title}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 font-hand text-xl text-[#743D4A] text-center leading-tight">
                    {polaroid.caption}
                  </p>
                </div>
              </div>

              {/* Editorial Story & Details */}
              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#743D4A] font-medium pr-10">
                    {pageLabel && (
                      <>
                        <span>{pageLabel}</span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{polaroid.date}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {polaroid.location}
                    </span>
                  </div>

                  <h2
                    id="story-photo-modal-title"
                    className="mt-2.5 font-serif text-2xl sm:text-3xl font-semibold text-[#38271F]"
                  >
                    {polaroid.title}
                  </h2>

                  <p className="mt-1 font-hand text-xl text-[#743D4A]">{polaroid.caption}</p>

                  <div className="mt-4 pt-4 border-t border-[#38271F]/12">
                    <p className="text-sm sm:text-base text-[#38271F]/85 leading-relaxed">
                      {polaroid.story}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#38271F]/12 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-medium hover:bg-[#4e382d] transition-colors cursor-pointer"
                  >
                    Kembali ke Buku
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
