import { ReactNode, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ImageOff } from 'lucide-react';
import { PolaroidSize, TapeVariant } from '../data/memories';
import { EASE_OUT_EXPO } from '../utils/animation';

interface PolaroidProps {
  image: string;
  title: string;
  date?: string;
  caption?: string;
  stamp?: string;
  tape?: TapeVariant | null;
  tapePosition?: 'center' | 'corners';
  rotation?: number;
  size?: PolaroidSize;
  pinColor?: string;
  showPin?: boolean;
  onClick?: () => void;
  footerExtra?: ReactNode;
  className?: string;
}

const SIZE_CLASSES: Record<PolaroidSize, string> = {
  sm: 'w-[210px] sm:w-[225px] p-2.5 pb-4',
  md: 'w-[240px] sm:w-[265px] p-3 pb-5',
  lg: 'w-[270px] sm:w-[300px] p-3.5 pb-6',
};

function tapeClass(variant: TapeVariant) {
  if (variant === 'gold') return 'washi-tape-gold';
  if (variant === 'sage') return 'washi-tape-sage';
  return 'washi-tape';
}

export function Polaroid({
  image,
  title,
  date,
  caption,
  stamp,
  tape = 'pink',
  tapePosition = 'center',
  rotation = 0,
  size = 'md',
  pinColor,
  showPin = false,
  onClick,
  footerExtra,
  className = '',
}: PolaroidProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [image]);

  const interactive = Boolean(onClick);
  const Wrapper = interactive ? motion.button : motion.div;

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      style={{ rotate: `${rotation}deg` }}
      whileHover={
        interactive
          ? { y: -8, scale: 1.03, rotate: 0, transition: { duration: 0.22, ease: EASE_OUT_EXPO } }
          : undefined
      }
      whileTap={interactive ? { scale: 0.985 } : undefined}
      className={`group relative bg-[#FBF8F2] border border-[#38271F]/10 rounded-[3px] shadow-polaroid text-left transition-shadow ${
        interactive ? 'cursor-pointer hover:shadow-polaroid-lifted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A6533B]' : ''
      } ${SIZE_CLASSES[size]} ${className}`}
    >
      {/* Decorative Push-pin */}
      {showPin && (
        <span
          aria-hidden="true"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 w-4 h-4 rounded-full border border-[#38271F]/25 shadow-sm"
          style={{
            background: `radial-gradient(circle at 35% 30%, #ffffff99, ${pinColor || '#A6533B'} 65%)`,
          }}
        />
      )}

      {/* Decorative Washi Tape */}
      {tape && tapePosition === 'center' && (
        <span
          aria-hidden="true"
          className={`absolute -top-3 left-1/2 -translate-x-1/2 -rotate-2 z-10 w-20 h-5 ${tapeClass(tape)}`}
        />
      )}
      {tape && tapePosition === 'corners' && (
        <>
          <span
            aria-hidden="true"
            className={`absolute -top-2.5 -left-3 -rotate-[22deg] z-10 w-14 h-4 ${tapeClass(tape)}`}
          />
          <span
            aria-hidden="true"
            className={`absolute -top-2.5 -right-3 rotate-[20deg] z-10 w-14 h-4 ${tapeClass(tape)}`}
          />
        </>
      )}

      {/* Photo Frame */}
      <div
        className="relative w-full aspect-[10/7] overflow-hidden bg-[#EAE0CF] border border-[#38271F]/10"
      >
        {!imgError ? (
          <img
            src={image}
            alt={title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[#F4EBDD] to-[#E2D2BA] text-[#38271F]/70">
            <ImageOff className="w-5 h-5 mb-1.5 opacity-60" />
            <span className="font-serif text-xs font-medium line-clamp-2">{title}</span>
          </div>
        )}

        {/* Optional Vintage Postage Stamp */}
        {stamp && (
          <div className="postage-stamp absolute bottom-2 right-2 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-[#743D4A] uppercase rotate-[-4deg]">
            {stamp}
          </div>
        )}
      </div>

      {/* Handwritten Caption & Editorial Metadata */}
      <div className="pt-3 px-0.5 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-[15px] font-semibold text-[#38271F] leading-snug truncate">
            {title}
          </h3>
          {date && (
            <span className="text-[10px] font-medium text-[#38271F]/60 whitespace-nowrap shrink-0">
              {date}
            </span>
          )}
        </div>
        {caption && (
          <p className="font-hand text-[19px] leading-tight text-[#743D4A] line-clamp-2">
            {caption}
          </p>
        )}
        {footerExtra}
      </div>
    </Wrapper>
  );
}
