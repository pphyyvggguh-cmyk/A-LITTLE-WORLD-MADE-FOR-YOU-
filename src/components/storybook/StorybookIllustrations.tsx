import { useId } from 'react';

interface SVGProps {
  className?: string;
}

/**
 * Perched little watercolor songbird resting calmly on a tiny botanical sprig (static pose).
 */
export function SongbirdSVG({ className = 'w-14 h-12' }: SVGProps) {
  const uid = useId();
  return (
    <svg viewBox="0 0 80 68" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-body`} cx="45%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#FDF9F2" />
          <stop offset="68%" stopColor="#EFE1CB" />
          <stop offset="100%" stopColor="#D7C09E" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id={`${uid}-breast`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#C8755B" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#A6533B" stopOpacity="0.82" />
        </radialGradient>
      </defs>
      {/* Delicate twig & tiny leaf under perched bird */}
      <path d="M12 53 Q38 49 68 55" fill="none" stroke="#455342" strokeOpacity="0.58" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M58 53 Q66 47 71 50 Q66 56 58 53 Z" fill="#455342" fillOpacity="0.52" />
      {/* Tail feathers */}
      <path d="M22 39 L8 31 L11 41 L23 44 Z" fill="#743D4A" fillOpacity="0.72" />
      {/* Soft rounded body */}
      <ellipse cx="38" cy="36" rx="16.5" ry="12" fill={`url(#${uid}-body)`} stroke="#38271F" strokeOpacity="0.75" strokeWidth="1.25" />
      {/* Watercolor brick-red breast wash */}
      <path d="M36 27 C46 28 53 34 51 42 C45 47 35 46 31 41 C32 34 33 30 36 27 Z" fill={`url(#${uid}-breast)`} />
      {/* Resting folded wing */}
      <path d="M24 34 C24 26 36 25 43 32 C39 38 30 39 24 34 Z" fill="#C4A574" fillOpacity="0.72" stroke="#38271F" strokeOpacity="0.58" strokeWidth="1.1" />
      {/* Little feet perched gently on twig */}
      <path d="M35 47 L34 52 M42 47 L43 52" stroke="#38271F" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
      {/* Head, eye, blush & beak */}
      <circle cx="51" cy="24" r="8.2" fill="#38271F" fillOpacity="0.9" />
      <circle cx="53.5" cy="22.8" r="1.4" fill="#FBF6EE" />
      <circle cx="50.5" cy="26.5" r="2.2" fill="#E8BFC5" fillOpacity="0.55" />
      <path d="M58.5 23 L66 25.5 L58.5 27.8 Z" fill="#C4A574" />
    </svg>
  );
}

/**
 * Static pressed-flower style watercolor butterfly.
 */
export function ButterflySVG({
  className = 'w-11 h-11',
  wingColor = '#E8BFC5',
  accentColor = '#743D4A',
}: SVGProps & { wingColor?: string; accentColor?: string }) {
  const uid = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-wing`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FDF9F2" stopOpacity="0.88" />
          <stop offset="55%" stopColor={wingColor} stopOpacity="0.88" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.48" />
        </radialGradient>
      </defs>
      {/* Upper watercolor wings */}
      <path
        d="M31 29 C21 12 7 13 10 27 C12 35 24 35 31 32 Z"
        fill={`url(#${uid}-wing)`}
        stroke={accentColor}
        strokeOpacity="0.72"
        strokeWidth="1.15"
      />
      <path
        d="M33 29 C43 12 57 13 54 27 C52 35 40 35 33 32 Z"
        fill={`url(#${uid}-wing)`}
        stroke={accentColor}
        strokeOpacity="0.72"
        strokeWidth="1.15"
      />
      {/* Lower watercolor wings */}
      <path
        d="M31 33 C22 36 14 45 20 50 C25 53 30 44 31 35 Z"
        fill="#F5E5CF"
        fillOpacity="0.9"
        stroke={accentColor}
        strokeOpacity="0.65"
        strokeWidth="1.05"
      />
      <path
        d="M33 33 C42 36 50 45 44 50 C39 53 34 44 33 35 Z"
        fill="#F5E5CF"
        fillOpacity="0.9"
        stroke={accentColor}
        strokeOpacity="0.65"
        strokeWidth="1.05"
      />
      {/* Delicate gold speckles */}
      <circle cx="19" cy="24" r="2.6" fill="#C4A574" fillOpacity="0.68" />
      <circle cx="45" cy="24" r="2.6" fill="#C4A574" fillOpacity="0.68" />
      <circle cx="22" cy="43" r="1.6" fill="#A6533B" fillOpacity="0.45" />
      <circle cx="42" cy="43" r="1.6" fill="#A6533B" fillOpacity="0.45" />
      {/* Body & antennae */}
      <ellipse cx="32" cy="34" rx="1.9" ry="9.5" fill="#38271F" fillOpacity="0.88" />
      <path d="M31.2 25 Q26 17 22 18" fill="none" stroke="#38271F" strokeOpacity="0.75" strokeWidth="1.05" strokeLinecap="round" />
      <path d="M32.8 25 Q38 17 42 18" fill="none" stroke="#38271F" strokeOpacity="0.75" strokeWidth="1.05" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Static soft-watercolor sitting rabbit nestled in clover leaves (no hopping/running).
 */
export function PeekingRabbitSVG({ className = 'w-16 h-16' }: SVGProps) {
  const uid = useId();
  return (
    <svg viewBox="0 0 88 84" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-fur`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="72%" stopColor="#F4EBDD" />
          <stop offset="100%" stopColor="#DFCDBA" />
        </radialGradient>
      </defs>
      {/* Quiet clover sprigs beneath paws */}
      <ellipse cx="22" cy="68" rx="9" ry="4" transform="rotate(-12 22 68)" fill="#455342" fillOpacity="0.34" />
      <ellipse cx="66" cy="67" rx="8" ry="3.8" transform="rotate(14 66 67)" fill="#455342" fillOpacity="0.32" />
      {/* Soft fluffy tail */}
      <circle cx="62" cy="59" r="5.5" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.5" strokeWidth="1.1" />
      {/* Sitting bunny body */}
      <ellipse cx="44" cy="56" rx="16.5" ry="13.5" fill={`url(#${uid}-fur)`} stroke="#38271F" strokeOpacity="0.72" strokeWidth="1.25" />
      {/* Ears */}
      <ellipse cx="36" cy="21" rx="4.8" ry="15" transform="rotate(-11 36 21)" fill={`url(#${uid}-fur)`} stroke="#38271F" strokeOpacity="0.75" strokeWidth="1.25" />
      <ellipse cx="36" cy="22" rx="2.4" ry="10" transform="rotate(-11 36 22)" fill="#E8BFC5" fillOpacity="0.85" />
      <ellipse cx="50" cy="20" rx="4.8" ry="15" transform="rotate(10 50 20)" fill={`url(#${uid}-fur)`} stroke="#38271F" strokeOpacity="0.75" strokeWidth="1.25" />
      <ellipse cx="50" cy="21" rx="2.4" ry="10" transform="rotate(10 50 21)" fill="#E8BFC5" fillOpacity="0.85" />
      {/* Head */}
      <ellipse cx="43" cy="39" rx="13.5" ry="11.5" fill={`url(#${uid}-fur)`} stroke="#38271F" strokeOpacity="0.78" strokeWidth="1.25" />
      {/* Blush cheeks, gentle eyes, pink nose */}
      <circle cx="34.5" cy="41.5" r="2.9" fill="#E8BFC5" fillOpacity="0.72" />
      <circle cx="51.5" cy="41.5" r="2.9" fill="#E8BFC5" fillOpacity="0.72" />
      <circle cx="38" cy="37.8" r="1.55" fill="#38271F" />
      <circle cx="48" cy="37.8" r="1.55" fill="#38271F" />
      <ellipse cx="43" cy="41" rx="1.9" ry="1.3" fill="#A6533B" />
      <path d="M40.8 43.2 Q43 45 45.2 43.2" fill="none" stroke="#38271F" strokeOpacity="0.75" strokeWidth="1.1" strokeLinecap="round" />
      {/* Tiny front paws */}
      <ellipse cx="37" cy="64" rx="4.5" ry="3" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.65" strokeWidth="1.1" />
      <ellipse cx="49" cy="64" rx="4.5" ry="3" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.65" strokeWidth="1.1" />
      {/* Little daisy accent */}
      <circle cx="24" cy="63" r="3" fill="#E8BFC5" stroke="#743D4A" strokeWidth="0.7" />
      <circle cx="24" cy="63" r="1.1" fill="#C4A574" />
    </svg>
  );
}

/**
 * Static curled watercolor calico cat resting calmly in corner margins.
 */
export function SleepingCatSVG({ className = 'w-16 h-14' }: SVGProps) {
  const uid = useId();
  return (
    <svg viewBox="0 0 88 74" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-coat`} cx="38%" cy="35%" r="68%">
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="70%" stopColor="#F3E7D4" />
          <stop offset="100%" stopColor="#DEC8AB" />
        </radialGradient>
      </defs>
      {/* Curled body */}
      <ellipse cx="48" cy="47" rx="22" ry="14" fill={`url(#${uid}-coat)`} stroke="#38271F" strokeOpacity="0.74" strokeWidth="1.25" />
      {/* Warm spice-gold & terracotta calico patches */}
      <path d="M44 34 C53 33 61 38 60 44 C53 45 46 41 44 34 Z" fill="#C4A574" fillOpacity="0.58" />
      <path d="M56 46 C64 44 69 49 66 55 C59 56 54 51 56 46 Z" fill="#A6533B" fillOpacity="0.36" />
      {/* Curled tail */}
      <path d="M68 48 C77 48 80 57 70 60 C60 62 49 61 42 59" fill="none" stroke="#38271F" strokeOpacity="0.7" strokeWidth="3.8" strokeLinecap="round" />
      <path d="M68 48 C77 48 80 57 70 60 C60 62 49 61 42 59" fill="none" stroke="#EFE1CB" strokeWidth="2.2" strokeLinecap="round" />
      {/* Cat head & ears */}
      <path
        d="M21 34 L24 22 L31 29 L38 29 L45 22 L47 34 C50 38 50 47 45 52 C40 56 26 56 21 52 C17 47 17 38 21 34 Z"
        fill={`url(#${uid}-coat)`}
        stroke="#38271F"
        strokeOpacity="0.78"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {/* Pink inner ears */}
      <polygon points="25,26 26,30 29,29" fill="#E8BFC5" />
      <polygon points="43,26 42,30 39,29" fill="#E8BFC5" />
      {/* Peaceful closed eyes & whiskers */}
      <path d="M26 41 Q29 43 32 41" fill="none" stroke="#38271F" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M36 41 Q39 43 42 41" fill="none" stroke="#38271F" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="25.5" cy="44" r="2.3" fill="#E8BFC5" fillOpacity="0.68" />
      <circle cx="42.5" cy="44" r="2.3" fill="#E8BFC5" fillOpacity="0.68" />
      <ellipse cx="34" cy="44.2" rx="1.6" ry="1.1" fill="#A6533B" />
      <line x1="15" y1="42" x2="21" y2="43" stroke="#38271F" strokeOpacity="0.45" strokeWidth="1" />
      <line x1="15" y1="45" x2="21" y2="45" stroke="#38271F" strokeOpacity="0.45" strokeWidth="1" />
      <line x1="47" y1="43" x2="53" y2="42" stroke="#38271F" strokeOpacity="0.45" strokeWidth="1" />
      <line x1="47" y1="45" x2="53" y2="45" stroke="#38271F" strokeOpacity="0.45" strokeWidth="1" />
    </svg>
  );
}

/**
 * Watercolor cottagecore mushrooms & forest moss cluster (static).
 */
export function MushroomClusterSVG({ className = 'w-14 h-14' }: SVGProps) {
  const uid = useId();
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-cap1`} cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#CC775E" />
          <stop offset="70%" stopColor="#A6533B" />
          <stop offset="100%" stopColor="#743D4A" />
        </radialGradient>
        <radialGradient id={`${uid}-cap2`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#E8BFC5" />
          <stop offset="100%" stopColor="#B86B64" />
        </radialGradient>
      </defs>
      {/* Moss leaves at base */}
      <ellipse cx="26" cy="58" rx="9" ry="4" transform="rotate(-14 26 58)" fill="#455342" fillOpacity="0.42" />
      <ellipse cx="48" cy="59" rx="8" ry="3.6" transform="rotate(12 48 59)" fill="#5A6C56" fillOpacity="0.44" />
      {/* Tall mushroom */}
      <path d="M27 36 L26 57 Q31 60 36 57 L35 36 Z" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.65" strokeWidth="1.15" />
      <path
        d="M14 38 C14 20 48 20 48 38 C40 40 22 40 14 38 Z"
        fill={`url(#${uid}-cap1)`}
        stroke="#38271F"
        strokeOpacity="0.68"
        strokeWidth="1.2"
      />
      <circle cx="24" cy="29" r="2.6" fill="#FBF6EE" fillOpacity="0.88" />
      <circle cx="35" cy="26" r="2.1" fill="#FBF6EE" fillOpacity="0.86" />
      <circle cx="40" cy="33" r="1.7" fill="#FBF6EE" fillOpacity="0.8" />
      {/* Little companion mushroom */}
      <path d="M47 45 L46.5 58 Q50 60 53.5 58 L53 45 Z" fill="#FBF6EE" stroke="#38271F" strokeOpacity="0.62" strokeWidth="1.05" />
      <path
        d="M39 46 C39 35 61 35 61 46 C55 47.5 45 47.5 39 46 Z"
        fill={`url(#${uid}-cap2)`}
        stroke="#38271F"
        strokeOpacity="0.65"
        strokeWidth="1.1"
      />
      <circle cx="46" cy="40.5" r="1.7" fill="#FBF6EE" fillOpacity="0.85" />
      <circle cx="53.5" cy="42" r="1.3" fill="#FBF6EE" fillOpacity="0.82" />
    </svg>
  );
}

export function SwayingBotanicalSVG({
  className = 'w-20 h-28',
  flip = false,
}: SVGProps & { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 80 112"
      className={`${className} sb-anim-leaf`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <path
        d="M24 108 Q26 66 44 18"
        fill="none"
        stroke="#455342"
        strokeOpacity="0.85"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      {/* Soft watercolor leaves along stem */}
      <path d="M27 84 Q12 76 14 65 Q26 70 28 80 Z" fill="#455342" fillOpacity="0.68" />
      <path d="M30 70 Q46 66 49 55 Q37 56 30 66 Z" fill="#5A6C56" fillOpacity="0.72" />
      <path d="M34 54 Q18 46 20 36 Q32 40 35 51 Z" fill="#455342" fillOpacity="0.68" />
      <path d="M38 40 Q55 37 57 27 Q45 27 38 37 Z" fill="#5A6C56" fillOpacity="0.72" />
      {/* Delicate dusty-pink & ivory blossoms */}
      <circle cx="44" cy="17" r="5" fill="#E8BFC5" fillOpacity="0.9" stroke="#743D4A" strokeWidth="0.9" />
      <circle cx="44" cy="17" r="1.8" fill="#C4A574" />
      <circle cx="29" cy="30" r="3.4" fill="#FBF6EE" stroke="#C4A574" strokeWidth="0.9" />
      <circle cx="51" cy="52" r="2.2" fill="#E8BFC5" />
    </svg>
  );
}

export function DriftingPetalSVG({
  color = '#E8BFC5',
  className = 'w-4 h-4',
}: SVGProps & { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2 C18 6 20 14 14 21 C8 19 4 12 7 5 C8.5 3 10.5 2 12 2 Z"
        fill={color}
        fillOpacity="0.82"
        stroke="#743D4A"
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
    </svg>
  );
}

export function StarClusterSVG({ className = 'w-10 h-10' }: SVGProps) {
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
      <path
        d="M24 10 L26.5 20 L36 22.5 L26.5 25 L24 35 L21.5 25 L12 22.5 L21.5 20 Z"
        fill="#C4A574"
        fillOpacity="0.58"
        stroke="#A6533B"
        strokeOpacity="0.45"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M42 32 L43.2 36.8 L48 38 L43.2 39.2 L42 44 L40.8 39.2 L36 38 L40.8 36.8 Z"
        fill="#E8BFC5"
        fillOpacity="0.72"
      />
      <circle cx="15" cy="40" r="1.6" fill="#C4A574" fillOpacity="0.65" />
    </svg>
  );
}

export function BookCornerOrnamentSVG({ className = 'w-6 h-6' }: SVGProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M4 28 L4 8 Q4 4 8 4 L28 4"
        fill="none"
        stroke="#C4A574"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M8 20 Q10 10 20 8"
        fill="none"
        stroke="#455342"
        strokeOpacity="0.45"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="2" fill="#E8BFC5" stroke="#743D4A" strokeWidth="0.7" />
    </svg>
  );
}

