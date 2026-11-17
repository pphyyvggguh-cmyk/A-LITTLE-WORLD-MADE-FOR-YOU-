import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FLOWERS_DATA, FlowerSpecies } from '../data/flowers';
import { useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';

interface BotanicalFlowerSVGProps {
  species: FlowerSpecies;
  className?: string;
}

export function BotanicalFlowerSVG({ species, className = 'w-12 h-12' }: BotanicalFlowerSVGProps) {
  switch (species) {
    case 'sakura':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M34 38 Q48 42 54 30 Q43 29 35 35 Z" fill="#455342" opacity="0.88" />
          <path d="M30 40 Q18 47 12 37 Q22 33 30 37 Z" fill="#5A6C56" opacity="0.85" />
          {[0, 72, 144, 216, 288].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 32 32)`}>
              <path
                d="M32 30 C24 22 23 10 30 7 L32 11 L34 7 C41 10 40 22 32 30 Z"
                fill="#E8BFC5"
                stroke="#743D4A"
                strokeWidth="1.2"
              />
              <path d="M32 28 L32 15" stroke="#743D4A" strokeWidth="0.9" opacity="0.4" />
            </g>
          ))}
          <circle cx="32" cy="32" r="5" fill="#743D4A" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <circle
              key={a}
              cx={32 + Math.cos((a * Math.PI) / 180) * 6.5}
              cy={32 + Math.sin((a * Math.PI) / 180) * 6.5}
              r="1.1"
              fill="#C4A574"
            />
          ))}
        </svg>
      );

    case 'sunflower':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M32 42 L32 60" stroke="#455342" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M32 52 Q45 48 48 39 Q38 40 32 48 Z" fill="#455342" />
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (i * 360) / 14;
            return (
              <path
                key={angle}
                transform={`rotate(${angle} 32 28)`}
                d="M32 28 C28 19 29 7 32 4 C35 7 36 19 32 28 Z"
                fill={i % 2 === 0 ? '#D9A74A' : '#C48F36'}
                stroke="#38271F"
                strokeWidth="0.7"
              />
            );
          })}
          <circle cx="32" cy="28" r="9" fill="#38271F" />
          <circle cx="32" cy="28" r="6.2" fill="#5A3E30" />
          <circle cx="30" cy="26" r="1" fill="#C4A574" />
          <circle cx="34" cy="27" r="1" fill="#C4A574" />
          <circle cx="31" cy="30" r="1" fill="#C4A574" />
        </svg>
      );

    case 'lavender':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M32 58 Q31 36 32 12" stroke="#455342" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M32 52 Q21 44 16 34 Q26 39 32 48 Z" fill="#455342" />
          <path d="M32 50 Q43 42 48 32 Q38 37 32 46 Z" fill="#5A6C56" />
          {[
            [32, 11, 0],
            [27, 17, -25],
            [37, 17, 25],
            [26, 24, -28],
            [38, 24, 28],
            [27, 31, -24],
            [37, 31, 24],
            [28, 38, -20],
            [36, 38, 20],
          ].map(([cx, cy, rot], i) => (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx="3.4"
              ry="5.4"
              transform={`rotate(${rot} ${cx} ${cy})`}
              fill={i % 2 === 0 ? '#9B89B3' : '#7C6896'}
              stroke="#38271F"
              strokeWidth="0.7"
            />
          ))}
        </svg>
      );

    case 'rose':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M32 39 L32 59" stroke="#455342" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M32 49 Q20 46 16 38 Q26 38 32 45 Z" fill="#455342" />
          <path d="M32 46 Q45 43 49 35 Q39 35 32 42 Z" fill="#5A6C56" />
          <path d="M18 28 C16 18 26 11 32 14 C38 11 48 18 46 28 C46 37 38 41 32 41 C26 41 18 37 18 28 Z" fill="#C97B84" stroke="#743D4A" strokeWidth="1.2" />
          <path d="M22 27 C22 19 29 16 33 19 C39 17 43 22 41 29 C39 34 34 36 29 35 C24 34 22 31 22 27 Z" fill="#E8BFC5" stroke="#743D4A" strokeWidth="1" />
          <path d="M27 25 C28 21 34 20 36 24 C37 28 33 31 29 29 C27 28 26 26 27 25 Z" fill="#743D4A" />
          <path d="M30 24 C32 23 34 25 32 27" fill="none" stroke="#F4EBDD" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );

    case 'daisy':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M32 38 Q30 50 31 60" stroke="#455342" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M31 50 Q42 46 46 39 Q37 40 31 47 Z" fill="#455342" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12;
            return (
              <ellipse
                key={angle}
                cx="32"
                cy="15"
                rx="3.4"
                ry="10.5"
                transform={`rotate(${angle} 32 28)`}
                fill="#FBF6EE"
                stroke="#C4A574"
                strokeWidth="0.9"
              />
            );
          })}
          <circle cx="32" cy="28" r="6.5" fill="#D9A74A" stroke="#A6533B" strokeWidth="1" />
          <circle cx="30.5" cy="26.5" r="1.4" fill="#FBF6EE" opacity="0.55" />
        </svg>
      );

    case 'forgetmenot':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M24 38 Q15 44 11 35 Q20 33 26 36 Z" fill="#455342" />
          <path d="M40 38 Q49 44 53 35 Q44 33 38 36 Z" fill="#5A6C56" />
          {[0, 72, 144, 216, 288].map((angle) => (
            <circle
              key={angle}
              cx={32 + Math.cos(((angle - 90) * Math.PI) / 180) * 11}
              cy={31 + Math.sin(((angle - 90) * Math.PI) / 180) * 11}
              r="8.5"
              fill="#8FB3C9"
              stroke="#455342"
              strokeWidth="1"
            />
          ))}
          <circle cx="32" cy="31" r="5.5" fill="#FBF6EE" />
          <circle cx="32" cy="31" r="3.4" fill="#E6B85C" />
        </svg>
      );

    case 'tulip':
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <path d="M32 39 L32 60" stroke="#455342" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M32 57 Q17 48 16 32 Q24 41 32 52 Z" fill="#455342" />
          <path d="M32 57 Q47 48 48 32 Q40 41 32 52 Z" fill="#5A6C56" />
          <path
            d="M21 26 C21 15 27 10 32 16 C37 10 43 15 43 26 C43 35 38 40 32 40 C26 40 21 35 21 26 Z"
            fill="#A6533B"
            stroke="#38271F"
            strokeWidth="1.2"
          />
          <path
            d="M27 28 C27 17 32 10 32 10 C32 10 37 17 37 28 C37 35 35 39 32 39 C29 39 27 35 27 28 Z"
            fill="#C76D52"
            stroke="#38271F"
            strokeWidth="0.9"
          />
          <path d="M30 14 Q32 11 34 14" fill="none" stroke="#C4A574" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
  }
}

interface HiddenFlowerSpotProps {
  flowerId: string;
  className?: string;
}

export function HiddenFlowerSpot({ flowerId, className = '' }: HiddenFlowerSpotProps) {
  const collectedFlowers = useStore((s) => s.collectedFlowers);
  const collectFlower = useStore((s) => s.collectFlower);
  const [justBloomed, setJustBloomed] = useState(false);

  const flower = FLOWERS_DATA.find((f) => f.id === flowerId);
  if (!flower) return null;

  const isCollected = collectedFlowers.includes(flowerId);

  const handleCollect = () => {
    if (isCollected) return;
    setJustBloomed(true);
    collectFlower(flowerId);
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <AnimatePresence mode="wait">
        {!isCollected ? (
          <motion.button
            key="uncollected"
            type="button"
            onClick={handleCollect}
            aria-label={`Kumpulkan bunga tersembunyi: ${flower.indonesianName}`}
            title={flower.indonesianName}
            initial={{ scale: 0.92, opacity: 0.92 }}
            whileHover={{ scale: 1.14, rotate: 6 }}
            whileTap={{ scale: 0.92 }}
            animate={
              justBloomed
                ? { scale: [1, 1.4, 0], rotate: [0, 18, 30], opacity: [1, 1, 0] }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: justBloomed ? 0.5 : 0.25, ease: EASE_OUT_EXPO }}
            className="group relative min-w-[44px] min-h-[44px] p-1.5 rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A6533B]"
          >
            <span className="absolute inset-1 rounded-full bg-[#C4A574]/15 group-hover:bg-[#E8BFC5]/40 transition-colors" />
            <BotanicalFlowerSVG
              species={flower.species}
              className="relative w-10 h-10 drop-shadow-[0_3px_6px_rgba(56,39,31,0.22)]"
            />
          </motion.button>
        ) : (
          <motion.div
            key="collected"
            initial={{ scale: 1.25, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center pointer-events-none select-none"
            aria-label={`${flower.indonesianName} sudah ditemukan`}
          >
            <div className="w-7 h-7 rounded-full border border-dashed border-[#455342]/40 flex items-center justify-center text-[11px] font-hand text-[#455342]">
              ✓
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
