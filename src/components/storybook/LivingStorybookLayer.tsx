import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore, type AppSection } from '../../store/useStore';
import { EASE_OUT_EXPO } from '../../utils/animation';
import {
  getSectionAnimationProfile,
  shouldPauseAmbientMotion,
} from '../../utils/storybookMotion';
import {
  ButterflySVG,
  DriftingPetalSVG,
  MushroomClusterSVG,
  PeekingRabbitSVG,
  SleepingCatSVG,
  SongbirdSVG,
  StarClusterSVG,
  SwayingBotanicalSVG,
} from './StorybookIllustrations';

interface LivingStorybookLayerProps {
  section: AppSection;
  interactionSeed?: number;
}

const PETAL_POSITIONS = [
  { left: '4%', top: '16%', delay: '0s', size: 'w-3.5 h-3.5' },
  { left: '91%', top: '34%', delay: '2.4s', size: 'w-3 h-3' },
  { left: '7%', top: '62%', delay: '4.1s', size: 'w-4 h-4' },
  { left: '88%', top: '72%', delay: '1.6s', size: 'w-3.5 h-3.5' },
];

const FIREFLY_POSITIONS = [
  { left: '8%', top: '26%', delay: '0s' },
  { left: '92%', top: '24%', delay: '1.8s' },
  { left: '10%', top: '68%', delay: '3.1s' },
  { left: '86%', top: '60%', delay: '0.9s' },
];

export function LivingStorybookLayer({
  section,
  interactionSeed = 0,
}: LivingStorybookLayerProps) {
  const justCollectedFlowerId = useStore((s) => s.justCollectedFlowerId);
  const layerRef = useRef<HTMLDivElement | null>(null);

  const [isDocumentHidden, setIsDocumentHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const handleVisibility = () => setIsDocumentHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const handleMq = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq?.addEventListener?.('change', handleMq);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      mq?.removeEventListener?.('change', handleMq);
    };
  }, []);

  // Gentle scroll micro-parallax strictly clamped (+/- 8px) and skipped when reduced motion is active
  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') return;
    let rafId = 0;

    const updateParallax = () => {
      rafId = 0;
      const el = layerRef.current;
      if (!el) return;
      const shift = Math.max(-8, Math.min(8, (window.scrollY || 0) * -0.02));
      el.style.setProperty('--sb-parallax-y', `${shift.toFixed(2)}px`);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  const paused = shouldPauseAmbientMotion({ isDocumentHidden, reducedMotion });
  const profile = getSectionAnimationProfile(section);
  const has = (type: (typeof profile.creatures)[number]) => profile.creatures.includes(type);

  const showInteractionBloom = Boolean(justCollectedFlowerId) || interactionSeed > 0;
  const floatGentleClass = reducedMotion ? '' : 'sb-anim-float-gentle';
  const floatSlowClass = reducedMotion ? '' : 'sb-anim-float-slow';

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      data-storybook-mood={profile.moodLabel}
      data-ambient-paused={paused ? 'true' : 'false'}
      data-testid="living-storybook-layer"
      className={`pointer-events-none fixed inset-0 z-20 overflow-hidden select-none ${
        paused ? 'storybook-ambient-paused' : ''
      }`}
    >
      {/* Perched static little songbird floating gently near upper quiet margin (zero wing flapping / flying) */}
      {has('bird') && (
        <div
          style={{ transform: 'translate3d(0, var(--sb-parallax-y, 0px), 0)' }}
          className="absolute top-16 right-2 sm:top-20 sm:right-6 xl:right-10 opacity-75 sm:opacity-85"
        >
          <div className={floatGentleClass}>
            <SongbirdSVG className="w-11 h-9 sm:w-14 sm:h-12" />
          </div>
        </div>
      )}

      {/* Static pressed-style butterfly hovering calmly near upper margin */}
      {has('butterfly') && (
        <div
          style={{ transform: 'translate3d(0, calc(var(--sb-parallax-y, 0px) * 1.2), 0)' }}
          className="absolute top-16 left-2 sm:top-24 sm:left-8 xl:left-14 opacity-75 sm:opacity-85"
        >
          <div className={floatSlowClass}>
            <ButterflySVG
              className="w-8 h-8 sm:w-10 sm:h-10"
              wingColor={profile.petalTint}
              accentColor={profile.accentTone}
            />
          </div>
        </div>
      )}

      {/* Corner botanical leaves & blossoms gently swaying */}
      {has('leaves') && (
        <>
          <div className="hidden md:block absolute bottom-24 left-2 xl:left-4 opacity-50">
            <SwayingBotanicalSVG className="w-16 h-24" />
          </div>
          <div className="hidden lg:block absolute top-24 left-2 xl:left-4 opacity-38 rotate-12">
            <SwayingBotanicalSVG className="w-14 h-20" flip />
          </div>
        </>
      )}

      {/* Cute static bunny perched quietly in outer left margin (away from Vinyl Player at bottom-left) */}
      {has('rabbit') && (
        <div
          style={{ transform: 'translate3d(0, var(--sb-parallax-y, 0px), 0)' }}
          className="hidden md:block absolute bottom-32 left-3 xl:left-8 opacity-85"
        >
          <div className={floatSlowClass}>
            <PeekingRabbitSVG className="w-16 h-16 xl:w-20 xl:h-20" />
          </div>
        </div>
      )}

      {/* Curled static watercolor cat resting quietly in outer right upper-mid margin (away from Mini Oktaf at bottom-right) */}
      {has('cat') && (
        <div
          style={{ transform: 'translate3d(0, var(--sb-parallax-y, 0px), 0)' }}
          className="hidden md:block absolute bottom-44 xl:bottom-48 right-3 xl:right-8 opacity-80"
        >
          <div className={floatSlowClass}>
            <SleepingCatSVG className="w-16 h-14 xl:w-20 xl:h-16" />
          </div>
        </div>
      )}

      {/* Cottagecore woodland mushrooms tucked gently in upper-right / outer corner */}
      {has('mushroom') && (
        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-2 xl:left-6 opacity-75">
          <div className={floatGentleClass}>
            <MushroomClusterSVG className="w-14 h-14 xl:w-16 xl:h-16" />
          </div>
        </div>
      )}

      {/* Soft gold watercolor stars in outer edge */}
      {has('star') && (
        <div className="absolute top-28 right-3 sm:top-32 sm:right-8 opacity-75">
          <div className={floatGentleClass}>
            <StarClusterSVG className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>
      )}

      {/* Gentle static petal accents hovering in outermost perimeter */}
      {has('petals') &&
        PETAL_POSITIONS.map((p, idx) => (
          <div
            key={`${section}-petal-${idx}`}
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
            }}
            className={`hidden sm:block absolute ${
              reducedMotion ? 'opacity-45' : 'sb-anim-petal opacity-55'
            }`}
          >
            <DriftingPetalSVG color={profile.petalTint} className={p.size} />
          </div>
        ))}

      {/* Soft dusk/candlelight glow motes */}
      {has('fireflies') &&
        !reducedMotion &&
        FIREFLY_POSITIONS.map((f, idx) => (
          <span
            key={`${section}-firefly-${idx}`}
            style={{
              left: f.left,
              top: f.top,
              animationDelay: f.delay,
              backgroundColor: profile.fireflyTint,
            }}
            className="hidden sm:block absolute w-2 h-2 rounded-full sb-anim-firefly shadow-[0_0_8px_rgba(196,165,116,0.55)]"
          />
        ))}

      {/* Interactive Bloom Feedback when collecting a quest flower */}
      <AnimatePresence>
        {showInteractionBloom && !reducedMotion && (
          <motion.div
            key={`bloom-${justCollectedFlowerId ?? interactionSeed}`}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 0.85, 0], scale: [0.75, 1.18, 1.45] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border border-[#C4A574]/45"
          >
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#E8BFC5]" />
            <span className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C4A574]" />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#455342]/60" />
            <span className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-2 rounded-full bg-[#A6533B]/70" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

