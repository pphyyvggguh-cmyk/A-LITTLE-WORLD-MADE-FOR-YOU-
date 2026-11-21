import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  getJarPaperStyleOption,
  JarPaperStyle,
} from '../../data/jarOfThoughts';
import { EASE_OUT_EXPO } from '../../utils/animation';

export type JarAnimationPhase =
  | 'idle'
  | 'arriving'
  | 'shaking'
  | 'opening'
  | 'floating'
  | 'unfolding'
  | 'revealed'
  | 'cooldown'
  | 'empty';

export interface JarSlipPreview {
  id: string;
  paperStyle: JarPaperStyle;
  sortSeed: number;
}

interface MagicGlassJarProps {
  slips: JarSlipPreview[];
  phase: JarAnimationPhase;
  activePaperStyle?: JarPaperStyle;
  arrivingPaperStyle?: JarPaperStyle;
  arrivingIds?: string[];
  reducedMotion: boolean;
}

interface SlipLayoutSlot {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

// 22 organic layered positions rising from bottom of the jar so every approved letter visibly fills the glass
const SLIP_SLOTS: readonly SlipLayoutSlot[] = [
  { x: 94, y: 296, rotate: -14, scale: 0.96 },
  { x: 146, y: 300, rotate: 9, scale: 1.0 },
  { x: 198, y: 294, rotate: -7, scale: 0.95 },
  { x: 224, y: 280, rotate: 18, scale: 0.88 },
  { x: 118, y: 272, rotate: 16, scale: 0.95 },
  { x: 170, y: 274, rotate: -18, scale: 0.98 },
  { x: 214, y: 266, rotate: 11, scale: 0.9 },
  { x: 92, y: 252, rotate: -10, scale: 0.92 },
  { x: 142, y: 250, rotate: 6, scale: 0.95 },
  { x: 192, y: 246, rotate: -15, scale: 0.93 },
  { x: 116, y: 228, rotate: 13, scale: 0.92 },
  { x: 164, y: 226, rotate: -8, scale: 0.94 },
  { x: 210, y: 224, rotate: 15, scale: 0.88 },
  { x: 100, y: 204, rotate: -16, scale: 0.9 },
  { x: 148, y: 204, rotate: 8, scale: 0.92 },
  { x: 194, y: 202, rotate: -11, scale: 0.9 },
  { x: 124, y: 182, rotate: 12, scale: 0.88 },
  { x: 174, y: 182, rotate: -9, scale: 0.89 },
  { x: 148, y: 162, rotate: 4, scale: 0.87 },
  { x: 114, y: 158, rotate: -13, scale: 0.85 },
  { x: 184, y: 156, rotate: 14, scale: 0.85 },
  { x: 152, y: 140, rotate: -4, scale: 0.84 },
];

const SPARKLES = [
  { cx: 58, cy: 132, r: 2.2, delay: 0 },
  { cx: 256, cy: 120, r: 2.5, delay: 0.5 },
  { cx: 74, cy: 210, r: 1.8, delay: 1.1 },
  { cx: 250, cy: 230, r: 2.0, delay: 0.8 },
  { cx: 160, cy: 48, r: 2.4, delay: 0.3 },
  { cx: 215, cy: 88, r: 1.7, delay: 1.4 },
  { cx: 95, cy: 86, r: 1.9, delay: 0.9 },
];

export function playJarRevealChime(): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.06, now + idx * 0.11 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 0.72);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.78);
    });

    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 1600);
  } catch {
    // Audio playback safely skipped if browser blocks Web Audio
  }
}

export function MagicGlassJar({
  slips,
  phase,
  activePaperStyle = 'ivory-linen',
  arrivingPaperStyle = 'blush-petal',
  arrivingIds = [],
  reducedMotion,
}: MagicGlassJarProps) {
  const visibleSlips = useMemo(() => slips.slice(0, SLIP_SLOTS.length), [slips]);
  const arrivingSet = useMemo(() => new Set(arrivingIds), [arrivingIds]);
  const activeStyle = getJarPaperStyleOption(activePaperStyle);
  const arrivingStyle = getJarPaperStyleOption(arrivingPaperStyle);

  const isLidOpen =
    phase === 'arriving' ||
    phase === 'opening' ||
    phase === 'floating' ||
    phase === 'unfolding' ||
    phase === 'revealed';
  const isShaking = !reducedMotion && phase === 'shaking';
  const isFloatingSlip = phase === 'floating';
  const isUnfoldingSlip = phase === 'unfolding';
  const isArriving = phase === 'arriving';

  // Target resting coordinates inside the jar for the arriving slip
  const targetSlot =
    SLIP_SLOTS[Math.max(0, visibleSlips.length - 1) % SLIP_SLOTS.length];

  return (
    <div
      data-testid="magic-glass-jar"
      data-phase={phase}
      className="relative flex items-center justify-center w-full max-w-[215px] sm:max-w-[265px] mx-auto select-none"
    >
      {/* Subtle warm radial glow behind the jar */}
      <motion.div
        aria-hidden="true"
        animate={
          reducedMotion
            ? { opacity: 0.55 }
            : phase === 'shaking' ||
                phase === 'opening' ||
                phase === 'floating' ||
                phase === 'unfolding' ||
                phase === 'arriving'
              ? { opacity: [0.55, 0.94, 0.72], scale: [0.97, 1.06, 1] }
              : { opacity: phase === 'cooldown' ? 0.36 : 0.65, scale: 1 }
        }
        transition={{ duration: 1.4, ease: EASE_OUT_EXPO }}
        className="pointer-events-none absolute inset-6 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(196,165,116,0.36) 0%, rgba(232,191,197,0.22) 45%, transparent 72%)',
        }}
      />

      <motion.svg
        viewBox="0 0 320 360"
        className="relative z-10 w-full h-auto overflow-visible"
        role="img"
        aria-label={`Toples kaca transparan berisi ${slips.length} surat lipat yang siap dibuka`}
        animate={
          isShaking
            ? {
                rotate: [0, -2.5, 2.5, -1.8, 1.8, 0],
                y: [0, -3, 0, -2, 0],
              }
            : { rotate: 0, y: 0 }
        }
        transition={
          isShaking
            ? { duration: 0.55, ease: 'easeInOut' }
            : { duration: 0.4, ease: EASE_OUT_EXPO }
        }
      >
        <defs>
          <linearGradient id="jarGlassBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.62" />
            <stop offset="16%" stopColor="#FBF6EE" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#FBF6EE" stopOpacity="0.08" />
            <stop offset="84%" stopColor="#FBF6EE" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.54" />
          </linearGradient>
          <linearGradient id="jarCorkLid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D7B98A" />
            <stop offset="55%" stopColor="#C4A574" />
            <stop offset="100%" stopColor="#9C7A42" />
          </linearGradient>
          <linearGradient id="jarNeckRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EAE0CF" />
            <stop offset="50%" stopColor="#FBF6EE" />
            <stop offset="100%" stopColor="#DFD2BE" />
          </linearGradient>
          <clipPath id="jarInteriorClip">
            <path d="M84 114 C72 132 62 152 62 178 L62 294 C62 314 78 326 98 326 L222 326 C242 326 258 314 258 294 L258 178 C258 152 248 132 236 114 Z" />
          </clipPath>
        </defs>

        {/* Wooden / Linen Desk Coaster Base */}
        <ellipse
          cx="160"
          cy="332"
          rx="108"
          ry="15"
          fill="#EAE0CF"
          stroke="rgba(56, 39, 31, 0.14)"
          strokeWidth="1.2"
        />
        <ellipse
          cx="160"
          cy="329"
          rx="94"
          ry="10"
          fill="rgba(56, 39, 31, 0.08)"
        />

        {/* Ambient Floating Sparkles */}
        {SPARKLES.map((sp, i) => (
          <motion.circle
            key={i}
            cx={sp.cx}
            cy={sp.cy}
            r={sp.r}
            fill={i % 2 === 0 ? '#C4A574' : '#E8BFC5'}
            initial={{ opacity: 0.35 }}
            animate={
              reducedMotion
                ? { opacity: 0.45 }
                : {
                    opacity:
                      phase === 'opening' ||
                      phase === 'floating' ||
                      phase === 'unfolding' ||
                      phase === 'arriving'
                        ? [0.45, 1, 0.45]
                        : [0.22, 0.65, 0.22],
                    y: [0, -6, 0],
                  }
            }
            transition={{
              duration: 3.4 + (i % 3) * 0.7,
              repeat: Infinity,
              delay: sp.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Jar Back Interior Layer (Crystal-clear translucent glass depth) */}
        <path
          d="M84 114 C72 132 62 152 62 178 L62 294 C62 314 78 326 98 326 L222 326 C242 326 258 314 258 294 L258 178 C258 152 248 132 236 114 Z"
          fill="rgba(255, 253, 250, 0.42)"
        />

        {/* Folded Little Thought Papers Visibly Inside the Transparent Jar */}
        <g clipPath="url(#jarInteriorClip)">
          {visibleSlips.map((slip, index) => {
            const slot = SLIP_SLOTS[index % SLIP_SLOTS.length];
            const palette = getJarPaperStyleOption(slip.paperStyle);
            const hideTopForFloat =
              (isFloatingSlip || isUnfoldingSlip) && index === visibleSlips.length - 1;
            const hideArrivingWhileDropping =
              isArriving && arrivingSet.has(slip.id) && index === visibleSlips.length - 1;
            if (hideTopForFloat || hideArrivingWhileDropping) return null;

            return (
              <motion.g
                key={slip.id}
                data-testid={`jar-slip-${slip.id}`}
                transform={`translate(${slot.x}, ${slot.y}) rotate(${slot.rotate}) scale(${slot.scale})`}
                animate={
                  reducedMotion
                    ? undefined
                    : phase === 'shaking'
                      ? { y: [0, -5, 1.5, 0] }
                      : { y: [0, -1.4, 0] }
                }
                transition={{
                  duration: 3.2 + (index % 4) * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (index % 5) * 0.22,
                }}
              >
                {/* Mini folded letter rectangle with soft drop shadow */}
                <rect
                  x="-21"
                  y="-11"
                  width="44"
                  height="24"
                  rx="3.5"
                  fill="rgba(56, 39, 31, 0.08)"
                />
                <rect
                  x="-22"
                  y="-12"
                  width="44"
                  height="24"
                  rx="3.5"
                  fill={palette.paperBg}
                  stroke={palette.borderColor}
                  strokeWidth="1.2"
                />
                {/* Diagonal paper fold crease */}
                <path
                  d="M-21 -11 L0 3 L21 -11"
                  fill={palette.foldShadow}
                  fillOpacity="0.68"
                  stroke={palette.borderColor}
                  strokeWidth="0.9"
                />
                {/* Tiny wax heart seal on folded slip */}
                <circle cx="0" cy="3" r="3.2" fill={palette.accentColor} fillOpacity="0.78" />
              </motion.g>
            );
          })}
        </g>

        {/* Glass Body & Specular Reflections */}
        <path
          d="M84 114 C72 132 62 152 62 178 L62 294 C62 314 78 326 98 326 L222 326 C242 326 258 314 258 294 L258 178 C258 152 248 132 236 114 Z"
          fill="url(#jarGlassBody)"
          stroke="rgba(56, 39, 31, 0.28)"
          strokeWidth="2"
        />

        {/* Vertical glass highlights */}
        <path
          d="M78 158 C73 176 74 268 78 298"
          fill="none"
          stroke="rgba(255, 255, 255, 0.82)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M90 142 C87 154 87 186 89 200"
          fill="none"
          stroke="rgba(255, 255, 255, 0.56)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M241 168 C245 190 244 268 238 294"
          fill="none"
          stroke="rgba(255, 255, 255, 0.48)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Jar Glass Collar Neck */}
        <rect
          x="96"
          y="96"
          width="128"
          height="18"
          rx="6"
          fill="url(#jarNeckRim)"
          stroke="rgba(56, 39, 31, 0.28)"
          strokeWidth="1.6"
        />

        {/* Delicate archival twine & paper tag tied at jar neck */}
        <path
          d="M96 114 Q160 124 224 114"
          fill="none"
          stroke="#A6533B"
          strokeOpacity="0.65"
          strokeWidth="2.2"
        />
        <g transform="translate(214, 118) rotate(8)">
          <rect
            x="-16"
            y="2"
            width="32"
            height="19"
            rx="2.5"
            fill="#FBF6EE"
            stroke="rgba(56, 39, 31, 0.24)"
            strokeWidth="1"
          />
          <circle cx="0" cy="6" r="1.4" fill="#A6533B" />
          <text
            x="0"
            y="16"
            textAnchor="middle"
            fontSize="6.5"
            fontFamily="Georgia, serif"
            fill="#743D4A"
          >
            for wulan ♡
          </text>
        </g>

        {/* Arriving New Folded Letter Floating Into the Jar & Settling */}
        <AnimatePresence>
          {isArriving && (
            <motion.g
              key="arriving-slip"
              data-testid="jar-arriving-slip"
              initial={{ x: 160, y: -38, scale: 1.08, opacity: 0, rotate: -14 }}
              animate={{
                x: [160, 154, targetSlot.x],
                y: [-38, 128, targetSlot.y],
                scale: [1.08, 1.0, targetSlot.scale],
                opacity: [0, 1, 1],
                rotate: [-14, 8, targetSlot.rotate],
              }}
              transition={{ duration: reducedMotion ? 0.15 : 1.15, ease: EASE_OUT_EXPO }}
            >
              <rect
                x="-24"
                y="-14"
                width="48"
                height="28"
                rx="4"
                fill={arrivingStyle.paperBg}
                stroke={arrivingStyle.borderColor}
                strokeWidth="1.4"
              />
              <path
                d="M-22 -12 L0 4 L22 -12"
                fill={arrivingStyle.foldShadow}
                stroke={arrivingStyle.borderColor}
                strokeWidth="1"
              />
              <circle cx="0" cy="4" r="3.8" fill={arrivingStyle.accentColor} />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Emerging & Unfolding Chosen Thought Slip */}
        <AnimatePresence>
          {(isFloatingSlip || isUnfoldingSlip) && (
            <motion.g
              key="emerging-slip"
              data-testid="jar-emerging-slip"
              initial={{ x: 160, y: 185, scale: 0.72, opacity: 0, rotate: -10 }}
              animate={
                isUnfoldingSlip
                  ? { x: 160, y: 36, scale: 1.48, opacity: 1, rotate: 0 }
                  : { x: 160, y: 46, scale: 1.15, opacity: 1, rotate: 2 }
              }
              transition={{ duration: reducedMotion ? 0.15 : 0.68, ease: EASE_OUT_EXPO }}
            >
              {/* Main unfolded inner stationery sheet */}
              <motion.rect
                x="-40"
                y="-26"
                width="80"
                height="52"
                rx="5"
                fill={activeStyle.paperBg}
                stroke={activeStyle.borderColor}
                strokeWidth="1.5"
                animate={
                  isUnfoldingSlip
                    ? { scaleY: [0.85, 1.08, 1] }
                    : { scaleY: 0.85 }
                }
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              />
              {/* Decorative subtle ink lines inside unfolded paper */}
              {isUnfoldingSlip && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.55 }}
                  transition={{ duration: 0.35 }}
                >
                  <line x1="-24" y1="-2" x2="24" y2="-2" stroke={activeStyle.inkColor} strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="-24" y1="7" x2="18" y2="7" stroke={activeStyle.inkColor} strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="-24" y1="16" x2="10" y2="16" stroke={activeStyle.accentColor} strokeWidth="1.2" strokeLinecap="round" />
                </motion.g>
              )}
              {/* Top envelope flap unfolding upward */}
              <motion.path
                d="M-38 -24 L0 4 L38 -24 Z"
                fill={activeStyle.foldShadow}
                stroke={activeStyle.borderColor}
                strokeWidth="1.1"
                style={{ transformOrigin: '0px -24px' }}
                animate={
                  isUnfoldingSlip
                    ? { scaleY: -0.92, opacity: 0.9 }
                    : { scaleY: 1, opacity: 1 }
                }
                transition={{ duration: reducedMotion ? 0.12 : 0.48, ease: EASE_OUT_EXPO }}
              />
              {/* Wax seal badge */}
              <motion.circle
                cx="0"
                cy={isUnfoldingSlip ? -46 : 4}
                r="5"
                fill={activeStyle.accentColor}
                transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Cork & Brushed Gold Lid (lifts off during arrival/opening/reveal) */}
        <motion.g
          animate={
            isLidOpen
              ? { y: -40, x: 24, rotate: 16, opacity: 0.85 }
              : { y: 0, x: 0, rotate: 0, opacity: 1 }
          }
          transition={{ duration: reducedMotion ? 0.12 : 0.52, ease: EASE_OUT_EXPO }}
        >
          <rect
            x="108"
            y="72"
            width="104"
            height="24"
            rx="5"
            fill="url(#jarCorkLid)"
            stroke="rgba(56, 39, 31, 0.28)"
            strokeWidth="1.5"
          />
          <rect
            x="98"
            y="64"
            width="124"
            height="14"
            rx="7"
            fill="#EDE1CF"
            stroke="rgba(56, 39, 31, 0.28)"
            strokeWidth="1.6"
          />
          <line
            x1="112"
            y1="69"
            x2="208"
            y2="69"
            stroke="rgba(255, 255, 255, 0.65)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </motion.g>
      </motion.svg>
    </div>
  );
}
