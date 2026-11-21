import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Edit3,
  Heart,
  Lock,
  MailOpen,
  MapPin,
  Trash2,
} from 'lucide-react';
import {
  POSTCARD_DESIGN_META,
  POSTCARD_RECIPIENT_META,
  POSTCARD_STAMP_META,
  PostcardEnvelope,
  PostcardSecret,
} from '../../data/postcards';
import { DecorationSVG } from '../story/ScrapbookDecorations';
import { CloudMediaImg } from '../CloudMediaImg';
import { EASE_OUT_EXPO } from '../../utils/animation';
import {
  classifyPostcardBucket,
  formatCountdownLabel,
} from '../../utils/postcards';

interface PostcardCardProps {
  envelope: PostcardEnvelope;
  trustedNowMs: number;
  canReveal: boolean;
  canEdit: boolean;
  canDelete: boolean;
  secret?: PostcardSecret | null;
  loadingSecret?: boolean;
  onRevealRequest: (envelope: PostcardEnvelope) => Promise<void>;
  onEdit?: (envelope: PostcardEnvelope) => void;
  onDelete?: (id: string) => Promise<void>;
  onPhotoClick?: (url: string) => void;
}

export function PostcardCard({
  envelope,
  trustedNowMs,
  canReveal,
  canEdit,
  canDelete,
  secret,
  loadingSecret = false,
  onRevealRequest,
  onEdit,
  onDelete,
  onPhotoClick,
}: PostcardCardProps) {
  const bucket = classifyPostcardBucket(envelope, trustedNowMs);
  const design = POSTCARD_DESIGN_META[envelope.designTheme] ?? POSTCARD_DESIGN_META.vintage_cream;
  const stamp = POSTCARD_STAMP_META[envelope.stampStyle] ?? POSTCARD_STAMP_META.par_avion;
  const recMeta = POSTCARD_RECIPIENT_META[envelope.recipient] ?? POSTCARD_RECIPIENT_META.both;

  const [expanded, setExpanded] = useState(false);
  const [openingAnimation, setOpeningAnimation] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleOpenClick = async () => {
    if (bucket === 'waiting' || !canReveal) return;
    if (!expanded) {
      setOpeningAnimation(true);
      await onRevealRequest(envelope);
      window.setTimeout(() => {
        setOpeningAnimation(false);
        setExpanded(true);
      }, 360);
    } else {
      setExpanded(false);
    }
  };

  return (
    <article
      data-testid={`postcard-card-${envelope.id}`}
      style={{
        backgroundColor: design.paperBg,
        borderColor: design.borderColor,
      }}
      className="relative rounded-xl border p-5 sm:p-6 shadow-polaroid hover:shadow-polaroid-lifted transition-shadow overflow-hidden flex flex-col justify-between gap-4"
    >
      {/* Translucent Washi Tape */}
      <span
        aria-hidden="true"
        className={`absolute -top-2.5 left-8 w-16 h-4 -rotate-2 ${design.tapeClass}`}
      />

      {/* Decorative Stamp & Botanical Accent */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wider font-medium text-[#743D4A]">
            <span>Dari {envelope.senderName}</span>
            <span className="mx-1.5 text-[#38271F]/35">→</span>
            <span>{recMeta.shortLabel}</span>
            {envelope.visibility === 'public' && (
              <>
                <span className="mx-1.5 text-[#38271F]/35">·</span>
                <span className="text-[#455342]">Terbuka</span>
              </>
            )}
          </p>

          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#38271F] leading-snug">
            {envelope.title}
          </h2>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="postage-stamp px-2.5 py-1 text-[9px] font-semibold tracking-wider uppercase rotate-2"
            style={{ color: design.accentColor }}
          >
            {stamp.stampText}
          </span>
          <DecorationSVG kind={stamp.flowerKind} className="w-7 h-7 opacity-80" />
        </div>
      </div>

      {/* Animated Envelope Body / Opened Postcard Letter */}
      <AnimatePresence mode="wait">
        {!expanded || !secret ? (
          <motion.div
            key="sealed-front"
            initial={{ opacity: 0.92 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="relative rounded-lg border border-[#38271F]/14 overflow-hidden p-4 sm:p-5"
            style={{ backgroundColor: design.flapTint }}
          >
            {/* Envelope Flap Triangle */}
            <motion.svg
              viewBox="0 0 400 72"
              className="w-full h-12 -mt-4 mb-2 pointer-events-none origin-top"
              preserveAspectRatio="none"
              aria-hidden="true"
              animate={openingAnimation ? { scaleY: -0.65, opacity: 0.4 } : { scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
            >
              <path
                d="M0 0 L200 60 L400 0"
                fill="none"
                stroke="#38271F"
                strokeOpacity="0.2"
                strokeWidth="1.4"
              />
            </motion.svg>

            <div className="flex flex-col items-center text-center gap-2.5 py-1">
              <span
                aria-hidden="true"
                className="w-11 h-11 rounded-full flex items-center justify-center text-[#FBF6EE] shadow-sm"
                style={{
                  backgroundColor: bucket === 'waiting' ? '#743D4A' : '#455342',
                }}
              >
                {bucket === 'waiting' ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Heart className="w-4 h-4 fill-[#FBF6EE]" />
                )}
              </span>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#38271F]">
                  {bucket === 'waiting'
                    ? `Tersegel hingga ${envelope.unlockDateLabel}`
                    : bucket === 'opened'
                      ? `Sudah dibuka · Dibuka ${envelope.unlockDateLabel}`
                      : `Waktu tiba! Dapat dibuka sejak ${envelope.unlockDateLabel}`}
                </p>

                <p className="text-xs text-[#38271F]/70 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#A6533B]" />
                  <span>{formatCountdownLabel(envelope.unlockAt, trustedNowMs)}</span>
                </p>
              </div>

              {bucket !== 'waiting' && (
                <button
                  type="button"
                  onClick={handleOpenClick}
                  disabled={!canReveal || loadingSecret}
                  className="mt-1 min-h-[44px] px-4 py-2 rounded-lg bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#4e382d] disabled:opacity-50 cursor-pointer"
                >
                  <MailOpen className="w-3.5 h-3.5 text-[#E8BFC5]" />
                  <span>
                    {loadingSecret
                      ? 'Membuka Segel...'
                      : !canReveal
                        ? `Khusus untuk ${recMeta.shortLabel}`
                        : bucket === 'opened'
                          ? 'Baca Kembali Kartu Pos ♡'
                          : 'Buka Kartu Pos Sekarang ♡'}
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="opened-letter"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.36, ease: EASE_OUT_EXPO }}
            className="journal-lined rounded-lg border border-[#38271F]/16 p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1 space-y-2">
                <p className="font-hand text-2xl text-[#38271F] leading-[32px] whitespace-pre-line">
                  {secret.message}
                </p>
                <p className="font-hand text-xl text-[#743D4A] pt-1">
                  — {envelope.senderName} ♡
                </p>
              </div>

              {secret.photoUrl && (
                <button
                  type="button"
                  onClick={() => onPhotoClick?.(secret.photoUrl)}
                  className="bg-[#FBF8F2] p-1.5 pb-4 border border-[#38271F]/16 shadow-polaroid rotate-2 shrink-0 cursor-pointer hover:scale-[1.03] transition-transform"
                >
                  <CloudMediaImg
                    src={secret.photoUrl}
                    alt={`Lampiran foto ${envelope.title}`}
                    className="w-28 h-28 object-cover bg-[#EAE0CF]"
                    loading="lazy"
                  />
                </button>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#38271F]/18 bg-[#FBF6EE] text-xs font-medium text-[#38271F] hover:bg-[#EAE0CF] cursor-pointer"
              >
                Lipat Kembali
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Postmark Footer */}
      <div className="pt-2.5 border-t border-[#38271F]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#38271F]/65">
        <div className="flex flex-wrap items-center gap-3">
          <span>Ditulis {envelope.createdDateLabel || 'tercatat'}</span>
          {envelope.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#A6533B]" />
              <span>{envelope.location}</span>
            </span>
          )}
        </div>

        {(canEdit || canDelete) && (
          <div className="flex items-center gap-1.5">
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(envelope)}
                className="min-h-[36px] px-2.5 rounded-lg border border-[#38271F]/18 bg-[#FBF6EE] text-[11px] font-semibold text-[#38271F] inline-flex items-center gap-1 hover:bg-[#EAE0CF] cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}

            {canDelete && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDelete(envelope.id)}
                    className="min-h-[36px] px-2.5 rounded-lg bg-[#A6533B] text-[#F4EBDD] text-[11px] font-semibold cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="min-h-[36px] px-2 rounded-lg border border-[#38271F]/20 text-[11px] cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label={`Hapus ${envelope.title}`}
                  className="min-h-[36px] px-2 rounded-lg text-[11px] text-[#A6533B] hover:bg-[#A6533B]/10 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
        )}
      </div>
    </article>
  );
}
