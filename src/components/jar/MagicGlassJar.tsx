import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  getJarPaperStyleOption,
  JarPaperStyle,
} from '../../data/jarOfThoughts';
import { EASE_OUT_EXPO } from '../../utils/animation';

export type JarAnimationPhase =
  | 'idle'
  | 'shaking'
  | 'opening'
  | 'floating'
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
  reducedMotion: boolean;
}

interface SlipLayoutSlot {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

const SLIP_SLOTS: readonly SlipLayoutSlot[] = [
  { x: 96, y: 278, rotate: -14, scale: 0.96 },
  { x: 146, y: 282, rotate: 9, scale: 1.0 },
  { x: 196, y: 274, rotate: -7, scale: 0.94 },
  { x: 118, y: 252, rotate: 16, scale: 0.95 },
  { x: 170, y: 254, rotate: -18, scale: 0.98 },
  { x: 214, y: 250, rotate: 11, scale: 0.9 },
  { x: 102, y: 224, rotate: -9, scale: 0.92 },
  { x: 152, y: 228, rotate: 6, scale: 0.96 },
  { x: 198, y: 222, rotate: -15, scale: 0.92 },
  { x: 130, y: 198, rotate: 13, scale: 0.9 },
  { x: 180, y: 198, rotate: -8, scale: 0.92 },
  { x: 154, y: 174, rotate: 4, scale: 0.88 },
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
  reducedMotion,
}: MagicGlassJarProps) {
  const visibleSlips = useMemo(() => slips.slice(0, SLIP_SLOTS.length), [slips]);
  const activeStyle = getJarPaperStyleOption(activePaperStyle);

  const isLidOpen = phase === 'opening' || phase === 'floating' || phase === 'revealed';
  const isShaking = !reducedMotion && phase === 'shaking';
  const isFloatingSlip = phase === 'floating';

  return (
    <div
      data-testid="magic-glass-jar"
      data-phase={phase}
      className="relative flex items-center justify-center w-full max-w-[205px] sm:max-w-[255px] mx-auto select-none"
    >
      {/* Subtle warm radial glow behind the jar */}
      <motion.div
        aria-hidden="true"
        animate={
          reducedMotion
            ? { opacity: 0.55 }
            : phase === 'shaking' || phase === 'opening' || phase === 'floating'
              ? { opacity: [0.55, 0.9, 0.7], scale: [0.97, 1.05, 1] }
              : { opacity: phase === 'cooldown' ? 0.35 : 0.62, scale: 1 }
        }
        transition={{ duration: 1.4, ease: EASE_OUT_EXPO }}
        className="pointer-events-none absolute inset-6 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(196,165,116,0.34) 0%, rgba(232,191,197,0.18) 45%, transparent 72%)',
        }}
      />

      <motion.svg
        viewBox="0 0 320 360"
        className="relative z-10 w-full h-auto overflow-visible"
        role="img"
        aria-label={`Toples kaca berisi ${slips.length} surat lipat yang siap dibuka`}
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
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.58" />
            <stop offset="16%" stopColor="#FBF6EE" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#FBF6EE" stopOpacity="0.12" />
            <stop offset="84%" stopColor="#FBF6EE" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.52" />
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
                      phase === 'opening' || phase === 'floating'
                        ? [0.4, 1, 0.4]
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

        {/* Jar Back Interior Layer */}
        <path
          d="M84 114 C72 132 62 152 62 178 L62 294 C62 314 78 326 98 326 L222 326 C242 326 258 314 258 294 L258 178 C258 152 248 132 236 114 Z"
          fill="rgba(251, 246, 238, 0.48)"
        />

        {/* Folded Little Thought Papers Inside the Jar */}
        <g clipPath="url(#jarInteriorClip)">
          {visibleSlips.map((slip, index) => {
            const slot = SLIP_SLOTS[index % SLIP_SLOTS.length];
            const palette = getJarPaperStyleOption(slip.paperStyle);
            const hideTopForFloat = isFloatingSlip && index === visibleSlips.length - 1;
            if (hideTopForFloat) return null;

            return (
              <motion.g
                key={slip.id}
                transform={`translate(${slot.x}, ${slot.y}) rotate(${slot.rotate}) scale(${slot.scale})`}
                animate={
                  reducedMotion
                    ? undefined
                    : phase === 'shaking'
                      ? { y: [0, -4, 1, 0] }
                      : { y: [0, -1.5, 0] }
                }
                transition={{
                  duration: 3.2 + (index % 4) * 0.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (index % 5) * 0.22,
                }}
              >
                {/* Mini folded letter rectangle */}
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
                  fillOpacity="0.65"
                  stroke={palette.borderColor}
                  strokeWidth="0.9"
                />
                {/* Tiny wax heart seal on folded slip */}
                <circle cx="0" cy="3" r="3.2" fill={palette.accentColor} fillOpacity="0.72" />
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
          stroke="rgba(255, 255, 255, 0.78)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M90 142 C87 154 87 186 89 200"
          fill="none"
          stroke="rgba(255, 255, 255, 0.52)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M241 168 C245 190 244 268 238 294"
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
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

        {/* Rising Chosen Folded Thought Slip */}
        {isFloatingSlip && (
          <motion.g
            initial={{ x: 160, y: 175, scale: 0.72, opacity: 0, rotate: -8 }}
            animate={{ x: 160, y: 34, scale: 1.18, opacity: 1, rotate: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.75, ease: EASE_OUT_EXPO }}
          >
            <rect
              x="-34"
              y="-20"
              width="68"
              height="40"
              rx="4.5"
              fill={activeStyle.paperBg}
              stroke={activeStyle.borderColor}
              strokeWidth="1.5"
            />
            <path
              d="M-32 -18 L0 4 L32 -18"
              fill={activeStyle.foldShadow}
              stroke={activeStyle.borderColor}
              strokeWidth="1.1"
            />
            <circle cx="0" cy="4" r="4.8" fill={activeStyle.accentColor} />
          </motion.g>
        )}

        {/* Cork & Brushed Gold Lid (lifts off during opening/reveal) */}
        <motion.g
          animate={
            isLidOpen
              ? { y: -38, x: 24, rotate: 16, opacity: 0.85 }
              : { y: 0, x: 0, rotate: 0, opacity: 1 }
          }
          transition={{ duration: reducedMotion ? 0.12 : 0.55, ease: EASE_OUT_EXPO }}
        >
          {/* Inner cork */}
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
          {/* Top brass-cream cap */}
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
