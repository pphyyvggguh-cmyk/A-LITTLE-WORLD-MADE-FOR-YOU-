import { motion, useReducedMotion } from 'motion/react';
import { BotanicalFlowerSVG } from '../Flower';
import { FlowerSpecies } from '../../data/flowers';
import { VoiceFlowerType } from '../../data/voices';

interface VoiceFlowerSVGProps {
  flowerType: VoiceFlowerType;
  isPlaying?: boolean;
  className?: string;
}

const SHARED_SPECIES: Record<string, FlowerSpecies> = {
  sakura: 'sakura',
  sunflower: 'sunflower',
  daisy: 'daisy',
  lavender: 'lavender',
  rose: 'rose',
  forgetmenot: 'forgetmenot',
  tulip: 'tulip',
};

function ExtraGardenFlowerSVG({
  flowerType,
  className,
}: {
  flowerType: 'lily' | 'peony' | 'orchid';
  className: string;
}) {
  if (flowerType === 'lily') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M32 39 L32 60" stroke="#455342" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M32 52 Q21 48 16 39 Q25 40 32 48 Z" fill="#455342" />
        <path d="M32 49 Q43 45 48 36 Q39 38 32 45 Z" fill="#5A6C56" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <path
            key={angle}
            transform={`rotate(${angle} 32 28)`}
            d="M32 28 C26 19 28 7 32 5 C36 7 38 19 32 28 Z"
            fill="#F9DFC6"
            stroke="#A6533B"
            strokeWidth="0.9"
          />
        ))}
        <circle cx="32" cy="28" r="5" fill="#C4A574" />
        <circle cx="32" cy="28" r="2.2" fill="#743D4A" />
      </svg>
    );
  }

  if (flowerType === 'peony') {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M32 40 L32 60" stroke="#455342" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M32 50 Q19 46 15 37 Q25 38 32 46 Z" fill="#455342" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <circle
            key={angle}
            cx={32 + Math.cos((angle * Math.PI) / 180) * 11}
            cy={27 + Math.sin((angle * Math.PI) / 180) * 10}
            r="8.5"
            fill="#E8BFC5"
            stroke="#743D4A"
            strokeWidth="0.85"
          />
        ))}
        {[20, 92, 164, 236, 308].map((angle) => (
          <circle
            key={angle}
            cx={32 + Math.cos((angle * Math.PI) / 180) * 5.5}
            cy={27 + Math.sin((angle * Math.PI) / 180) * 5.5}
            r="6.2"
            fill="#F3D6DB"
            stroke="#743D4A"
            strokeWidth="0.8"
          />
        ))}
        <circle cx="32" cy="27" r="4.2" fill="#C4A574" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 40 L32 60" stroke="#455342" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M32 51 Q43 47 48 39 Q39 40 32 47 Z" fill="#455342" />
      <ellipse cx="21" cy="26" rx="9" ry="7" transform="rotate(-18 21 26)" fill="#C39BB7" stroke="#743D4A" strokeWidth="0.9" />
      <ellipse cx="43" cy="26" rx="9" ry="7" transform="rotate(18 43 26)" fill="#C39BB7" stroke="#743D4A" strokeWidth="0.9" />
      <ellipse cx="32" cy="17" rx="7.5" ry="9" fill="#D8B6CE" stroke="#743D4A" strokeWidth="0.9" />
      <ellipse cx="26" cy="36" rx="6.5" ry="7" transform="rotate(16 26 36)" fill="#B185A4" stroke="#743D4A" strokeWidth="0.9" />
      <ellipse cx="38" cy="36" rx="6.5" ry="7" transform="rotate(-16 38 36)" fill="#B185A4" stroke="#743D4A" strokeWidth="0.9" />
      <circle cx="32" cy="27" r="5.5" fill="#743D4A" />
      <circle cx="32" cy="27" r="2.5" fill="#E8BFC5" />
    </svg>
  );
}

export function VoiceFlowerSVG({
  flowerType,
  isPlaying = false,
  className = 'w-14 h-14',
}: VoiceFlowerSVGProps) {
  const prefersReducedMotion = useReducedMotion();
  const shared = SHARED_SPECIES[flowerType];

  return (
    <motion.div
      className="inline-flex items-center justify-center"
      animate={
        isPlaying && !prefersReducedMotion
          ? {
              rotate: [-4, 5, -3, 4, 0],
              scale: [1, 1.08, 1.02, 1.09, 1],
            }
          : { rotate: 0, scale: 1 }
      }
      transition={
        isPlaying && !prefersReducedMotion
          ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.3 }
      }
    >
      {shared ? (
        <BotanicalFlowerSVG species={shared} className={className} />
      ) : (
        <ExtraGardenFlowerSVG
          flowerType={flowerType as 'lily' | 'peony' | 'orchid'}
          className={className}
        />
      )}
    </motion.div>
  );
}
