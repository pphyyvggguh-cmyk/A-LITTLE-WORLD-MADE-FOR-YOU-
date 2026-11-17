import { useId } from 'react';
import { DecorationKind, PageDecoration } from '../../data/memories';

interface DecorationSVGProps {
  kind: DecorationKind;
  className?: string;
  label?: string;
}

export function DecorationSVG({ kind, className = 'w-8 h-8', label }: DecorationSVGProps) {
  const uid = useId();

  switch (kind) {
    case 'daisy':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <g transform="translate(32,32)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-14"
                rx="4.8"
                ry="10.2"
                transform={`rotate(${deg})`}
                fill="#FFFDF8"
                fillOpacity="0.92"
                stroke="#38271F"
                strokeOpacity="0.38"
                strokeWidth="1.05"
              />
            ))}
            <circle cx="0" cy="0" r="6.8" fill="#C4A574" fillOpacity="0.88" stroke="#38271F" strokeOpacity="0.45" strokeWidth="1.05" />
            <circle cx="-1.5" cy="-1.5" r="2" fill="#FBF6EE" fillOpacity="0.4" />
          </g>
        </svg>
      );

    case 'rose':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-rose`} cx="45%" cy="40%" r="58%">
              <stop offset="0%" stopColor="#F5D5DA" />
              <stop offset="65%" stopColor="#E8BFC5" />
              <stop offset="100%" stopColor="#B86B78" stopOpacity="0.9" />
            </radialGradient>
          </defs>
          <path d="M32 38 C32 48 31 54 29 58" fill="none" stroke="#455342" strokeOpacity="0.82" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 46 Q42 42 45 48 Q38 51 32 46 Z" fill="#455342" fillOpacity="0.7" />
          <path d="M31 49 Q21 46 20 51 Q26 53 31 49 Z" fill="#5A6C56" fillOpacity="0.65" />
          <circle cx="32" cy="25" r="13.2" fill={`url(#${uid}-rose)`} stroke="#743D4A" strokeOpacity="0.8" strokeWidth="1.2" />
          <path d="M25 25 C25 19 36 18 38 24 C40 30 30 33 27 28 C25 24 31 21 34 24" fill="none" stroke="#743D4A" strokeOpacity="0.8" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      );

    case 'wildflower':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M32 56 Q31 40 33 24" fill="none" stroke="#455342" strokeOpacity="0.8" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M32 42 Q22 36 20 40 Q25 45 32 42 Z" fill="#455342" fillOpacity="0.65" />
          <path d="M33 46 Q43 41 44 45 Q39 49 33 46 Z" fill="#5A6C56" fillOpacity="0.6" />
          <circle cx="33" cy="18" r="5.5" fill="#E8BFC5" fillOpacity="0.88" stroke="#743D4A" strokeOpacity="0.45" strokeWidth="0.95" />
          <circle cx="24" cy="24" r="4.2" fill="#C4A574" fillOpacity="0.72" />
          <circle cx="42" cy="25" r="4.2" fill="#E8BFC5" fillOpacity="0.82" />
          <circle cx="33" cy="18" r="2" fill="#743D4A" />
        </svg>
      );

    case 'leaf':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path
            d="M14 48 C18 24 36 14 52 12 C48 32 36 46 14 48 Z"
            fill="#455342"
            fillOpacity="0.28"
            stroke="#455342"
            strokeOpacity="0.78"
            strokeWidth="1.5"
          />
          <path d="M12 50 Q30 30 48 15" fill="none" stroke="#455342" strokeOpacity="0.75" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M27 33 L24 25 M34 27 L41 28 M23 39 L31 41" fill="none" stroke="#455342" strokeOpacity="0.45" strokeWidth="0.95" strokeLinecap="round" />
        </svg>
      );

    case 'branch':
      return (
        <svg viewBox="0 0 72 64" className={className} aria-hidden="true">
          <path d="M10 52 Q30 36 58 14" fill="none" stroke="#38271F" strokeOpacity="0.52" strokeWidth="1.6" strokeLinecap="round" />
          <ellipse cx="26" cy="34" rx="7.2" ry="3.5" transform="rotate(-35 26 34)" fill="#455342" fillOpacity="0.6" />
          <ellipse cx="42" cy="24" rx="6.8" ry="3.2" transform="rotate(20 42 24)" fill="#5A6C56" fillOpacity="0.62" />
          <ellipse cx="52" cy="14" rx="5.5" ry="2.8" transform="rotate(-15 52 14)" fill="#455342" fillOpacity="0.65" />
          <circle cx="33" cy="37" r="2.2" fill="#E8BFC5" fillOpacity="0.88" />
          <circle cx="58" cy="14" r="2.5" fill="#C4A574" fillOpacity="0.8" />
        </svg>
      );

    case 'butterfly':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M31 24 C20 12 10 18 14 29 C16 35 26 34 31 31" fill="#E8BFC5" fillOpacity="0.85" stroke="#743D4A" strokeOpacity="0.78" strokeWidth="1.25" />
          <path d="M33 24 C44 12 54 18 50 29 C48 35 38 34 33 31" fill="#E8BFC5" fillOpacity="0.85" stroke="#743D4A" strokeOpacity="0.78" strokeWidth="1.25" />
          <path d="M31 32 C22 35 16 44 23 48 C28 50 31 42 31 34" fill="#C4A574" fillOpacity="0.62" stroke="#743D4A" strokeOpacity="0.72" strokeWidth="1.15" />
          <path d="M33 32 C42 35 48 44 41 48 C36 50 33 42 33 34" fill="#C4A574" fillOpacity="0.62" stroke="#743D4A" strokeOpacity="0.72" strokeWidth="1.15" />
          <circle cx="21" cy="24" r="1.8" fill="#FBF6EE" fillOpacity="0.75" />
          <circle cx="43" cy="24" r="1.8" fill="#FBF6EE" fillOpacity="0.75" />
          <line x1="32" y1="20" x2="32" y2="44" stroke="#38271F" strokeWidth="2" strokeLinecap="round" />
          <path d="M31 20 Q27 13 24 14 M33 20 Q37 13 40 14" fill="none" stroke="#38271F" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );

    case 'bird':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M10 47 Q34 44 54 48" fill="none" stroke="#455342" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round" />
          <path
            d="M16 38 C20 24 34 20 42 26 L52 24 L45 31 C45 41 34 47 22 44 L12 48 Z"
            fill="#EFE1CB"
            stroke="#38271F"
            strokeOpacity="0.75"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M27 33 C33 28 39 31 38 37 C34 40 28 39 27 33 Z" fill="#A6533B" fillOpacity="0.55" />
          <circle cx="40" cy="27" r="1.6" fill="#38271F" />
        </svg>
      );

    case 'bee':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <ellipse cx="28" cy="23" rx="7" ry="4.5" transform="rotate(-25 28 23)" fill="#FBF6EE" fillOpacity="0.9" stroke="#38271F" strokeOpacity="0.4" strokeWidth="1.1" />
          <ellipse cx="38" cy="23" rx="7" ry="4.5" transform="rotate(25 38 23)" fill="#FBF6EE" fillOpacity="0.9" stroke="#38271F" strokeOpacity="0.4" strokeWidth="1.1" />
          <ellipse cx="33" cy="35" rx="11" ry="8" fill="#DFB25C" fillOpacity="0.9" stroke="#38271F" strokeOpacity="0.8" strokeWidth="1.4" />
          <line x1="29" y1="28" x2="29" y2="42" stroke="#38271F" strokeWidth="2.1" />
          <line x1="36" y1="28" x2="36" y2="42" stroke="#38271F" strokeWidth="2.1" />
          <circle cx="40" cy="33" r="1.35" fill="#38271F" />
        </svg>
      );

    case 'cat':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path
            d="M18 24 L22 14 L29 21 L35 21 L42 14 L46 24 C49 28 49 36 45 41 C41 45 23 45 19 41 C15 36 15 28 18 24 Z"
            fill="#FBF6EE"
            stroke="#38271F"
            strokeOpacity="0.78"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="34" r="2.2" fill="#E8BFC5" fillOpacity="0.7" />
          <circle cx="40" cy="34" r="2.2" fill="#E8BFC5" fillOpacity="0.7" />
          <circle cx="27" cy="30" r="1.6" fill="#38271F" />
          <circle cx="37" cy="30" r="1.6" fill="#38271F" />
          <path d="M30 34 Q32 36 34 34" fill="none" stroke="#A6533B" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="14" y1="31" x2="21" y2="32" stroke="#38271F" strokeOpacity="0.45" strokeWidth="1.1" />
          <line x1="43" y1="32" x2="50" y2="31" stroke="#38271F" strokeOpacity="0.45" strokeWidth="1.1" />
        </svg>
      );

    case 'rabbit':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <ellipse cx="26" cy="18" rx="4" ry="11" transform="rotate(-8 26 18)" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.78" strokeWidth="1.4" />
          <ellipse cx="26" cy="19" rx="1.8" ry="7" transform="rotate(-8 26 19)" fill="#E8BFC5" fillOpacity="0.78" />
          <ellipse cx="38" cy="18" rx="4" ry="11" transform="rotate(8 38 18)" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.78" strokeWidth="1.4" />
          <ellipse cx="38" cy="19" rx="1.8" ry="7" transform="rotate(8 38 19)" fill="#E8BFC5" fillOpacity="0.78" />
          <ellipse cx="32" cy="37" rx="13" ry="11" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.78" strokeWidth="1.45" />
          <circle cx="27" cy="35" r="1.5" fill="#38271F" />
          <circle cx="37" cy="35" r="1.5" fill="#38271F" />
          <circle cx="24" cy="39" r="2.4" fill="#E8BFC5" fillOpacity="0.78" />
          <circle cx="40" cy="39" r="2.4" fill="#E8BFC5" fillOpacity="0.78" />
          <path d="M30 39 Q32 41 34 39" fill="none" stroke="#A6533B" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      );

    case 'mushroom':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M27 33 L26 51 Q32 54 38 51 L37 33 Z" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.68" strokeWidth="1.3" />
          <path
            d="M13 35 C13 17 51 17 51 35 C41 37 23 37 13 35 Z"
            fill="#A6533B"
            fillOpacity="0.82"
            stroke="#38271F"
            strokeOpacity="0.7"
            strokeWidth="1.3"
          />
          <circle cx="24" cy="26" r="2.5" fill="#FBF6EE" fillOpacity="0.88" />
          <circle cx="36" cy="23" r="2" fill="#FBF6EE" fillOpacity="0.88" />
          <circle cx="41" cy="30" r="1.6" fill="#FBF6EE" fillOpacity="0.8" />
          <ellipse cx="22" cy="52" rx="6" ry="2.6" fill="#455342" fillOpacity="0.45" />
        </svg>
      );

    case 'petal':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path
            d="M24 8 C34 15 36 30 26 40 C16 36 11 24 16 14 C18 10 21 8 24 8 Z"
            fill="#E8BFC5"
            fillOpacity="0.82"
            stroke="#743D4A"
            strokeOpacity="0.45"
            strokeWidth="1.1"
          />
        </svg>
      );

    case 'star':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path
            d="M24 6 L28.6 17.6 L41 18.6 L31.5 26.8 L34.4 39 L24 32.4 L13.6 39 L16.5 26.8 L7 18.6 L19.4 17.6 Z"
            fill="#C4A574"
            fillOpacity="0.52"
            stroke="#A6533B"
            strokeOpacity="0.72"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'heart':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path
            d="M24 39 C13 31 8 23 11 16 C13.5 10.5 20.5 10.5 24 15.5 C27.5 10.5 34.5 10.5 37 16 C40 23 35 31 24 39 Z"
            fill="#E8BFC5"
            fillOpacity="0.86"
            stroke="#743D4A"
            strokeOpacity="0.82"
            strokeWidth="1.35"
          />
        </svg>
      );

    case 'cloud':
      return (
        <svg viewBox="0 0 64 40" className={className} aria-hidden="true">
          <path
            d="M16 30 H48 C53 30 56 26 55 21 C54 16 49 14 45 15 C43 9 37 6 31 8 C26 9 23 13 22 17 C16 16 11 20 11 25 C11 28 13 30 16 30 Z"
            fill="#FBF6EE"
            fillOpacity="0.88"
            stroke="#38271F"
            strokeOpacity="0.32"
            strokeWidth="1.3"
          />
        </svg>
      );

    case 'paperclip':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path
            d="M17 31 L17 15 C17 10 25 10 25 15 L25 33 C25 36.5 20 36.5 20 33 L20 18"
            fill="none"
            stroke="#38271F"
            strokeOpacity="0.62"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'ribbon':
      return (
        <svg viewBox="0 0 64 36" className={className} aria-hidden="true">
          <path
            d="M6 12 H56 L50 18 L56 24 H6 L12 18 Z"
            fill="#E8BFC5"
            fillOpacity="0.65"
            stroke="#743D4A"
            strokeOpacity="0.52"
            strokeWidth="1.2"
          />
        </svg>
      );

    case 'stamp':
    default:
      return (
        <div
          aria-hidden="true"
          className="postage-stamp px-2 py-0.5 text-[8px] sm:text-[9px] font-semibold tracking-wider text-[#743D4A] uppercase select-none whitespace-nowrap"
        >
          {label || 'MEMORY'}
        </div>
      );
  }
}

const POSITION_CLASSES: Record<PageDecoration['position'], string> = {
  'top-left': 'top-1.5 left-1.5 sm:top-2.5 sm:left-2.5',
  'top-right': 'top-1.5 right-1.5 sm:top-2.5 sm:right-2.5',
  'bottom-left': 'bottom-8 left-1.5 sm:bottom-9 sm:left-3',
  'bottom-right': 'bottom-8 right-1.5 sm:bottom-9 sm:right-3',
  'mid-left': 'top-1/2 -translate-y-1/2 left-1 sm:left-2',
  'mid-right': 'top-1/2 -translate-y-1/2 right-1 sm:right-2',
};

export function PageDecorationsLayer({ decorations }: { decorations: PageDecoration[] }) {
  return (
    <>
      {decorations.map((dec, idx) => {
        const animClass =
          dec.animate === 'float'
            ? 'story-animate-float'
            : dec.animate === 'sway'
              ? 'story-animate-sway'
              : '';
        return (
          <div
            key={`${dec.kind}-${dec.position}-${idx}`}
            aria-hidden="true"
            style={dec.rotation ? { transform: `rotate(${dec.rotation}deg)` } : undefined}
            className={`pointer-events-none absolute z-10 opacity-65 sm:opacity-80 ${POSITION_CLASSES[dec.position]}`}
          >
            <div className={animClass}>
              <DecorationSVG
                kind={dec.kind}
                label={dec.label}
                className="w-5 h-5 sm:w-8 sm:h-8 md:w-9 md:h-9"
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

