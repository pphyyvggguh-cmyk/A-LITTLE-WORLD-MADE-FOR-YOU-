import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import {
  BookPolaroidItem,
  BookPolaroidSize,
  PolaroidAspect,
  TapeVariant,
} from '../../data/memories';

interface StoryPolaroidProps {
  item: BookPolaroidItem;
  onSelect: (item: BookPolaroidItem) => void;
  compactCaption?: boolean;
  className?: string;
}

const SIZE_WIDTH: Record<BookPolaroidSize, string> = {
  xs: 'w-[104px] sm:w-[138px] md:w-[155px] p-1.5 pb-2.5 sm:p-2 sm:pb-3',
  sm: 'w-[116px] sm:w-[162px] md:w-[186px] p-1.5 pb-2.5 sm:p-2 sm:pb-3.5',
  md: 'w-[132px] sm:w-[200px] md:w-[235px] p-2 pb-3 sm:p-2.5 sm:pb-4',
  lg: 'w-[146px] sm:w-[232px] md:w-[280px] p-2 pb-3.5 sm:p-3 sm:pb-5',
};

const ASPECT_CLASSES: Record<PolaroidAspect, string> = {
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
  square: 'aspect-square',
};

function getTapeClass(variant: TapeVariant) {
  if (variant === 'gold') return 'washi-tape-gold';
  if (variant === 'sage') return 'washi-tape-sage';
  return 'washi-tape';
}

export function StoryPolaroid({
  item,
  onSelect,
  compactCaption = false,
  className = '',
}: StoryPolaroidProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [item.image]);

  return (
    <button
      type="button"
      data-interactive-item="true"
      data-no-swipe="true"
      data-polaroid-id={item.id}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
      style={{ transform: `rotate(${item.rotation}deg)` }}
      aria-label={`Buka foto kenangan: ${item.title}`}
      className={`group relative bg-[#FCF9F3] border border-[#38271F]/14 rounded-[4px] shadow-polaroid hover:shadow-polaroid-lifted hover:-translate-y-1.5 transition-all duration-200 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A6533B] ${SIZE_WIDTH[item.size]} ${className}`}
    >
      {/* Decorative Push-pin */}
      {item.pinColor && (
        <span
          aria-hidden="true"
          className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-[#38271F]/25 shadow-sm"
          style={{
            background: `radial-gradient(circle at 35% 30%, #ffffffaa, ${item.pinColor} 65%)`,
          }}
        />
      )}

      {/* Decorative Washi Tape */}
      {item.tape && (
        <span
          aria-hidden="true"
          className={`absolute -top-2 sm:-top-2.5 left-1/2 -translate-x-1/2 -rotate-2 z-10 w-10 h-3 sm:w-16 sm:h-4 ${getTapeClass(
            item.tape
          )}`}
        />
      )}

      {/* Corner Sticker */}
      {item.sticker && (
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 -right-1.5 z-20 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FBF6EE] border border-[#C4A574]/55 shadow-xs flex items-center justify-center text-[10px] sm:text-xs text-[#743D4A]"
        >
          {item.sticker === 'heart' && '♡'}
          {item.sticker === 'star' && '✦'}
          {item.sticker === 'flower' && '✿'}
          {item.sticker === 'clip' && '📎'}
        </span>
      )}

      {/* Cropped Image Container (Preserves Exact Photo & Aspect Ratio Without Distortion) */}
      <div
        className={`relative w-full overflow-hidden bg-[#EAE0CF] border border-[#38271F]/12 shadow-[inset_0_0_0_1px_rgba(56,39,31,0.04)] ${ASPECT_CLASSES[item.aspect]}`}
      >
        {!imgError ? (
          <img
            src={item.image}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            draggable={false}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-[#F4EBDD] to-[#E2D2BA] text-[#38271F]/70">
            <ImageOff className="w-4 h-4 sm:w-5 sm:h-5 mb-1 opacity-60" />
            <span className="font-serif text-[9px] sm:text-xs font-medium line-clamp-2">
              {item.title}
            </span>
          </div>
        )}

        {item.stamp && (
          <div className="postage-stamp hidden sm:block absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[7px] md:text-[8px] font-semibold tracking-wider text-[#743D4A] uppercase -rotate-3">
            {item.stamp}
          </div>
        )}
      </div>

      {/* Warm Cream Border Handwritten Caption & Date */}
      <div className="pt-1.5 sm:pt-2 px-0.5">
        <div className="flex items-start justify-between gap-1.5">
          <h4 className="font-serif text-[10px] sm:text-xs md:text-[13px] leading-snug font-semibold text-[#38271F] line-clamp-2">
            {item.title}
          </h4>
          {!compactCaption && (
            <span className="hidden md:inline text-[9px] leading-snug text-[#38271F]/55 whitespace-nowrap shrink-0">
              {item.date}
            </span>
          )}
        </div>
        <p className="mt-0.5 font-hand text-[12px] sm:text-[15px] md:text-[17px] leading-tight text-[#743D4A] line-clamp-1 sm:line-clamp-2">
          {item.caption}
        </p>
      </div>
    </button>
  );
}

