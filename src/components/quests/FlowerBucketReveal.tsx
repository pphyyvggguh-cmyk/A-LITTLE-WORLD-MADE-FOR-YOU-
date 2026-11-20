import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { BotanicalFlowerSVG } from '../Flower';
import { FLOWERS_DATA } from '../../data/flowers';
import { EASE_OUT_EXPO } from '../../utils/animation';

type BucketStage = 'gathering' | 'glow' | 'revealed';

const ORBIT_OFFSETS = [
  { x: -135, y: -70, rot: -18 },
  { x: 130, y: -75, rot: 22 },
  { x: -155, y: 12, rot: -12 },
  { x: 152, y: 18, rot: 14 },
  { x: -105, y: 95, rot: -8 },
  { x: 108, y: 92, rot: 12 },
  { x: 0, y: -125, rot: 4 },
];

const SPARKLE_POSITIONS = [
  { left: '16%', top: '22%', delay: 0.1 },
  { left: '82%', top: '20%', delay: 0.3 },
  { left: '12%', top: '62%', delay: 0.5 },
  { left: '86%', top: '58%', delay: 0.25 },
  { left: '28%', top: '12%', delay: 0.45 },
  { left: '72%', top: '14%', delay: 0.6 },
  { left: '48%', top: '8%', delay: 0.2 },
  { left: '24%', top: '76%', delay: 0.4 },
  { left: '76%', top: '78%', delay: 0.55 },
];

export function FlowerBucketReveal() {
  const [stage, setStage] = useState<BucketStage>('gathering');
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    setStage('gathering');
    const glowTimer = window.setTimeout(() => setStage('glow'), 1250);
    const revealTimer = window.setTimeout(() => setStage('revealed'), 2100);
    return () => {
      window.clearTimeout(glowTimer);
      window.clearTimeout(revealTimer);
    };
  }, [runKey]);

  return (
    <div
      data-testid="flower-bucket-reveal"
      className="mt-7 relative overflow-hidden rounded-2xl paper-plate border border-[#C4A574]/45 px-4 py-7 sm:py-8 min-h-[340px] flex flex-col items-center justify-center"
    >
      {/* Background radial warm glow */}
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: stage === 'glow' ? 0.95 : stage === 'revealed' ? 0.55 : 0.25,
          scale: stage === 'glow' ? 1.35 : stage === 'revealed' ? 1.1 : 0.85,
        }}
        transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[radial-gradient(circle,rgba(246,214,154,0.85)_0%,rgba(232,191,197,0.45)_45%,rgba(251,246,238,0)_75%)]" />
      </motion.div>

      <AnimatePresence mode="wait">
        {stage !== 'revealed' ? (
          <motion.div
            key={`converge-${runKey}`}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="relative w-full max-w-md h-[250px] flex flex-col items-center justify-center"
          >
            {/* All 7 collected flowers floating toward center and merging into light */}
            {FLOWERS_DATA.map((flower, idx) => {
              const orbit = ORBIT_OFFSETS[idx % ORBIT_OFFSETS.length];
              const isGlow = stage === 'glow';
              return (
                <motion.div
                  key={flower.id}
                  initial={{
                    x: orbit.x * 0.78,
                    y: orbit.y * 0.78,
                    scale: 0.95,
                    rotate: orbit.rot,
                    opacity: 0.9,
                  }}
                  animate={
                    isGlow
                      ? { x: 0, y: 0, scale: 0.35, rotate: 0, opacity: 0 }
                      : { x: 0, y: -8, scale: 1.04, rotate: 0, opacity: 1 }
                  }
                  transition={{
                    duration: isGlow ? 0.55 : 1.05,
                    delay: isGlow ? idx * 0.03 : idx * 0.07,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="absolute flex items-center justify-center pointer-events-none"
                >
                  <BotanicalFlowerSVG
                    species={flower.species}
                    className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_6px_12px_rgba(56,39,31,0.18)]"
                  />
                </motion.div>
              );
            })}

            {/* Bright convergence light core */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={
                stage === 'glow'
                  ? { scale: [0.6, 1.55, 1.1], opacity: [0.4, 1, 0.95] }
                  : { scale: 0.45, opacity: 0.35 }
              }
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              className="w-24 h-24 rounded-full bg-[radial-gradient(circle,#FFFDF7_0%,#F6D69A_45%,rgba(232,191,197,0)_78%)] shadow-[0_0_48px_14px_rgba(246,214,154,0.75)] flex items-center justify-center"
            >
              <Sparkles className="w-7 h-7 text-[#A6533B]" />
            </motion.div>

            <p className="mt-36 text-xs font-serif italic text-[#743D4A]">
              {stage === 'gathering'
                ? 'Ketujuh bunga sedang berkumpul...'
                : 'Cahaya merangkai buket kecilmu...'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`bucket-${runKey}`}
            initial={{ opacity: 0, scale: 0.84 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="relative w-full flex flex-col items-center"
          >
            {/* Magical twinkling sparkles */}
            {SPARKLE_POSITIONS.map((sp, i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{
                  opacity: [0.25, 0.95, 0.25],
                  scale: [0.75, 1.2, 0.75],
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 2.4,
                  delay: sp.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ left: sp.left, top: sp.top }}
                className="pointer-events-none absolute text-[#A6533B]/75"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </motion.span>
            ))}

            {/* Completed Flower Bucket composition with all 7 blooms arranged in a rustic bucket */}
            <div className="relative w-64 sm:w-72 h-60 sm:h-64 flex flex-col items-center justify-end">
              {/* Blooms fan rising from bucket rim */}
              <div className="relative z-10 w-56 h-32 -mb-8 pointer-events-none">
                {[
                  { species: FLOWERS_DATA[0].species, left: '6%', top: '26%', rot: -22, delay: 0.05 },
                  { species: FLOWERS_DATA[1].species, left: '37%', top: '-4%', rot: -4, delay: 0.12 },
                  { species: FLOWERS_DATA[2].species, left: '68%', top: '22%', rot: 20, delay: 0.18 },
                  { species: FLOWERS_DATA[3].species, left: '20%', top: '8%', rot: -12, delay: 0.1 },
                  { species: FLOWERS_DATA[4].species, left: '53%', top: '6%', rot: 14, delay: 0.16 },
                  { species: FLOWERS_DATA[5].species, left: '16%', top: '34%', rot: -10, delay: 0.22 },
                  { species: FLOWERS_DATA[6].species, left: '57%', top: '32%', rot: 12, delay: 0.25 },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 18, scale: 0.6 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: item.delay, duration: 0.55, ease: EASE_OUT_EXPO }}
                    style={{ left: item.left, top: item.top, transform: `rotate(${item.rot}deg)` }}
                    className="absolute"
                  >
                    <BotanicalFlowerSVG
                      species={item.species}
                      className="w-16 h-16 sm:w-[70px] sm:h-[70px] drop-shadow-[0_6px_10px_rgba(56,39,31,0.18)]"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Crafted botanical linen bucket SVG */}
              <motion.svg
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.14, duration: 0.55, ease: EASE_OUT_EXPO }}
                viewBox="0 0 200 130"
                className="relative z-20 w-44 sm:w-48 h-28 sm:h-32 drop-shadow-[0_12px_20px_rgba(56,39,31,0.18)]"
                aria-label="Ember buket berisi tujuh bunga untuk Wulan"
              >
                {/* Handle */}
                <path
                  d="M44 26 Q100 -8 156 26"
                  fill="none"
                  stroke="#7A5A43"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Bucket body */}
                <path
                  d="M36 28 L164 28 L146 116 Q144 122 136 122 L64 122 Q56 122 54 116 Z"
                  fill="#E8D8C0"
                  stroke="#38271F"
                  strokeWidth="2.2"
                />
                {/* Subtle vertical ribs */}
                <path d="M68 34 L76 116" stroke="#C4A574" strokeWidth="1.4" opacity="0.65" />
                <path d="M100 34 L100 116" stroke="#C4A574" strokeWidth="1.4" opacity="0.65" />
                <path d="M132 34 L124 116" stroke="#C4A574" strokeWidth="1.4" opacity="0.65" />
                {/* Rim */}
                <rect
                  x="28"
                  y="20"
                  width="144"
                  height="14"
                  rx="7"
                  fill="#D6C0A1"
                  stroke="#38271F"
                  strokeWidth="2.2"
                />
                {/* Dusty rose satin ribbon around bucket */}
                <path
                  d="M43 66 Q100 76 157 66 L154 79 Q100 89 46 79 Z"
                  fill="#743D4A"
                />
                {/* Ribbon bow */}
                <path
                  d="M100 74 C86 62 76 66 80 76 C84 82 96 78 100 74 Z"
                  fill="#E8BFC5"
                  stroke="#743D4A"
                  strokeWidth="1.4"
                />
                <path
                  d="M100 74 C114 62 124 66 120 76 C116 82 104 78 100 74 Z"
                  fill="#E8BFC5"
                  stroke="#743D4A"
                  strokeWidth="1.4"
                />
                <circle cx="100" cy="74" r="4.5" fill="#743D4A" />
                {/* Gift tag */}
                <g transform="rotate(-7 100 94)">
                  <rect
                    x="70"
                    y="84"
                    width="60"
                    height="24"
                    rx="4"
                    fill="#FBF6EE"
                    stroke="#38271F"
                    strokeWidth="1.3"
                  />
                  <text
                    x="100"
                    y="99"
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#A6533B"
                    fontFamily="Georgia, serif"
                    fontStyle="italic"
                  >
                    Untuk Wulan ♡
                  </text>
                </g>
              </motion.svg>
            </div>

            {/* Compact flower chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {FLOWERS_DATA.map((flower) => (
                <span
                  key={flower.id}
                  className="inline-flex items-center gap-1 rounded-md border border-[#38271F]/12 bg-[#FBF6EE] px-2 py-0.5 text-[11px] font-medium text-[#38271F]/80"
                >
                  <span className="text-[#455342]">✿</span>
                  <span>{flower.indonesianName}</span>
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setRunKey((k) => k + 1)}
              className="mt-4 min-h-[38px] px-3 py-1.5 rounded-lg border border-[#38271F]/18 bg-[#FBF6EE] text-xs font-medium text-[#38271F]/80 hover:bg-[#EAE0CF] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#A6533B]" />
              <span>Putar Ulang Momen</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
