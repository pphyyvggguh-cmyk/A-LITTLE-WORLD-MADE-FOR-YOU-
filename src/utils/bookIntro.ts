export const BOOK_INTRO_SESSION_KEY = 'alittleworld_book_intro_played_v1';

export type BookIntroPhase = 'closed' | 'opening' | 'flipping' | 'zooming' | 'complete';

export interface IntroLeafSpec {
  id: string;
  startMs: number;
  durationMs: number;
  paperTint: 'ivory' | 'warm-linen' | 'blush-tint' | 'sage-tint';
  caption: string;
  chapterLabel: string;
}

export interface ComputedIntroLeafState {
  index: number;
  progress: number;
  angleDeg: number;
  velocityNormalized: number;
  motionBlurPx: number;
  zIndex: number;
  visible: boolean;
  opacity: number;
  shadowOpacity: number;
}

export interface BookIntroFrameState {
  phase: BookIntroPhase;
  elapsedMs: number;
  overallProgress: number;
  /** Offset in percentage of half-book width so closed cover sits dead center, then centers the open spread */
  spineShiftPercent: number;
  coverAngleDeg: number;
  coverOpacity: number;
  coverZIndex: number;
  bookTiltXDeg: number;
  bookTiltYDeg: number;
  bookScale: number;
  spreadRevealOpacity: number;
  backdropOpacity: number;
  overlayOpacity: number;
  closedShadowScale: number;
  leaves: ComputedIntroLeafState[];
}

export const INTRO_PHASE_WINDOWS = {
  closedEndMs: 820,
  coverOpenStartMs: 820,
  coverOpenEndMs: 1500,
  flippingStartMs: 1380,
  flippingEndMs: 3650,
  zoomStartMs: 3480,
  zoomEndMs: 4450,
  fadeOutStartMs: 4240,
  totalDurationMs: 4650,
} as const;

const LEAF_THEMES: Array<{
  paperTint: IntroLeafSpec['paperTint'];
  chapterLabel: string;
  caption: string;
}> = [
  { paperTint: 'ivory', chapterLabel: 'Prolog', caption: 'Untuk Wulan ♡' },
  { paperTint: 'warm-linen', chapterLabel: 'Bab 01', caption: 'Halaman Pertama' },
  { paperTint: 'blush-tint', chapterLabel: 'Bab 01', caption: 'Kenangan Manis' },
  { paperTint: 'ivory', chapterLabel: 'Bab 02', caption: 'Peta Impian Kita' },
  { paperTint: 'sage-tint', chapterLabel: 'Bab 03', caption: 'Amplop Bersegel' },
  { paperTint: 'warm-linen', chapterLabel: 'Bab 04', caption: 'Tiket 19.02' },
  { paperTint: 'blush-tint', chapterLabel: 'Bab 05', caption: 'Suara Sahabat' },
  { paperTint: 'ivory', chapterLabel: 'Bab 06', caption: 'Rencana Masa Depan' },
  { paperTint: 'sage-tint', chapterLabel: 'Bab 07', caption: 'Kartu Pos Waktu' },
  { paperTint: 'warm-linen', chapterLabel: 'Bab 00', caption: 'Selamat Membaca' },
];

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function easeOutCubic(t: number): number {
  const p = clamp01(t);
  return 1 - Math.pow(1 - p, 3);
}

export function easeInOutCubic(t: number): number {
  const p = clamp01(t);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

export function easeOutQuart(t: number): number {
  const p = clamp01(t);
  return 1 - Math.pow(1 - p, 4);
}

/**
 * Generates decelerating leaf flip schedules inside [flippingStartMs, flippingEndMs]:
 * Starts fast with overlapping flutter, then gradually slows down so the final leaf settles naturally.
 */
export function buildIntroLeafSchedule(count = LEAF_THEMES.length): IntroLeafSpec[] {
  const safeCount = Math.max(3, Math.floor(count));
  const startBase = INTRO_PHASE_WINDOWS.flippingStartMs;
  const endLimit = INTRO_PHASE_WINDOWS.flippingEndMs;

  // Normalized quadratic progression so step gaps increase smoothly toward the final pages
  const rawSteps: number[] = [];
  for (let i = 0; i < safeCount; i++) {
    const progress = i / (safeCount - 1);
    rawSteps.push(Math.pow(progress, 1.58));
  }

  const totalSpan = endLimit - startBase;
  // Reserve room for the final slow leaf to finish right at flippingEndMs
  const lastDuration = 580;
  const maxStartOffset = totalSpan - lastDuration;

  return Array.from({ length: safeCount }, (_, i) => {
    const tNorm = safeCount === 1 ? 0 : rawSteps[i];
    const startMs = Math.round(startBase + tNorm * maxStartOffset);
    // Duration grows smoothly from crisp 210ms rapid flips to 580ms gentle final land
    const durationMs = Math.round(210 + tNorm * 370);
    const meta = LEAF_THEMES[i % LEAF_THEMES.length];
    return {
      id: `intro-leaf-${i}`,
      startMs,
      durationMs,
      paperTint: meta.paperTint,
      chapterLabel: meta.chapterLabel,
      caption: meta.caption,
    };
  });
}

export const DEFAULT_INTRO_LEAVES: IntroLeafSpec[] = buildIntroLeafSchedule(LEAF_THEMES.length);

export function computeIntroTimeline(
  elapsedMs: number,
  leaves: readonly IntroLeafSpec[] = DEFAULT_INTRO_LEAVES,
  reducedMotion = false
): BookIntroFrameState {
  const safeElapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);

  if (reducedMotion) {
    const fadeDuration = 420;
    const t = clamp01(safeElapsed / fadeDuration);
    const phase: BookIntroPhase = t >= 1 ? 'complete' : 'zooming';
    return {
      phase,
      elapsedMs: safeElapsed,
      overallProgress: t,
      spineShiftPercent: 0,
      coverAngleDeg: -176,
      coverOpacity: 0,
      coverZIndex: 1,
      bookTiltXDeg: 0,
      bookTiltYDeg: 0,
      bookScale: 0.96 + 0.04 * easeOutCubic(t),
      spreadRevealOpacity: 1,
      backdropOpacity: t >= 1 ? 0 : 1 - easeOutCubic(t),
      overlayOpacity: t >= 1 ? 0 : 1 - easeOutCubic(t),
      closedShadowScale: 1,
      leaves: leaves.map((_, index) => ({
        index,
        progress: 1,
        angleDeg: -180,
        velocityNormalized: 0,
        motionBlurPx: 0,
        zIndex: index + 2,
        visible: false,
        opacity: 0,
        shadowOpacity: 0,
      })),
    };
  }

  const {
    closedEndMs,
    coverOpenStartMs,
    coverOpenEndMs,
    flippingStartMs,
    flippingEndMs,
    zoomStartMs,
    zoomEndMs,
    fadeOutStartMs,
    totalDurationMs,
  } = INTRO_PHASE_WINDOWS;

  // Determine high-level semantic phase
  let phase: BookIntroPhase = 'closed';
  if (safeElapsed >= totalDurationMs) {
    phase = 'complete';
  } else if (safeElapsed >= zoomStartMs) {
    phase = 'zooming';
  } else if (safeElapsed >= flippingStartMs) {
    phase = 'flipping';
  } else if (safeElapsed >= coverOpenStartMs) {
    phase = 'opening';
  }

  // Cover hinge animation (0deg closed -> -179.5deg folded open onto the left stack)
  const coverT = clamp01(
    (safeElapsed - coverOpenStartMs) / Math.max(1, coverOpenEndMs - coverOpenStartMs)
  );
  const coverEased = easeInOutCubic(coverT);
  const coverAngleDeg = -179.5 * coverEased;
  // Cover stays crisp (opacity 1) while hinged; vanishes cleanly once settled under left folio
  const coverOpacity = coverT >= 0.99 ? 0 : 1;
  // Once cover flips past 90deg, drop its z-index beneath flipping leaves (12+) while keeping it above leftBinding (2)
  const coverZIndex = coverAngleDeg > -90 ? 45 : 5;

  // Spine horizontal centering: when closed (-25% shifts spine left so right cover centers at 50%),
  // then moves smoothly to 0% so full 2-page spread centers cleanly on screen
  const spineShiftPercent = -25 * (1 - easeInOutCubic(coverT));

  // Book entry + camera zoom motion
  const entryT = clamp01(safeElapsed / closedEndMs);
  const entryEase = easeOutQuart(entryT);
  const zoomT = clamp01((safeElapsed - zoomStartMs) / Math.max(1, zoomEndMs - zoomStartMs));
  const zoomEase = easeInOutCubic(zoomT);

  // Perspective tilt settles cleanly during arrival, then flattens smoothly to 0deg during camera zoom
  const baseTiltX = (13 - 5.5 * entryEase) * (1 - zoomEase);
  const baseTiltY = (-10 + 7.5 * entryEase) * (1 - zoomEase);
  const bookTiltXDeg = Number(baseTiltX.toFixed(2));
  const bookTiltYDeg = Number(baseTiltY.toFixed(2));

  // Scale gently arrives (0.86 -> 0.93 closed -> 0.90 open -> 1.12 camera zoom filling frame cleanly)
  const closedScale = 0.86 + 0.07 * entryEase;
  const openBaseScale = closedScale - 0.03 * coverEased;
  const bookScale = Number((openBaseScale + 0.22 * zoomEase).toFixed(4));

  // Left spread base stays hidden while hardcover is still lifting (0..-145deg), then reveals cleanly as cover lays open
  const spreadRevealOpacity = Number(clamp01((-coverAngleDeg - 145) / 33).toFixed(3));

  // Backdrop stays 100% opaque while book animates so Navigation/Hub never ghost through until final zoom settle
  const fadeT = clamp01(
    (safeElapsed - fadeOutStartMs) / Math.max(1, totalDurationMs - fadeOutStartMs)
  );
  const fadeEased = easeInOutCubic(fadeT);
  const backdropOpacity = safeElapsed >= totalDurationMs ? 0 : Number((1 - fadeEased).toFixed(3));
  const overlayOpacity = backdropOpacity;

  // Per-leaf flipping physics & subtle speed-coupled motion blur
  const leafCount = leaves.length;
  const computedLeaves: ComputedIntroLeafState[] = leaves.map((leaf, index) => {
    const rawT = clamp01((safeElapsed - leaf.startMs) / Math.max(1, leaf.durationMs));
    // First ~70% of leaves move crisply, final leaves ease out noticeably
    const isLateLeaf = index >= leafCount - 3;
    const eased = isLateLeaf ? easeOutCubic(rawT) : easeInOutCubic(rawT);
    const angleDeg = -180 * eased;

    // Velocity peaks mid-turn (sin(pi * t)) and is higher for shorter (faster) flips
    const speedFactor = clamp01(240 / Math.max(180, leaf.durationMs));
    const midTurnEnvelope = Math.sin(Math.PI * rawT);
    const velocityNormalized = rawT > 0 && rawT < 1 ? midTurnEnvelope * speedFactor : 0;

    // Subtle motion blur (0..1.4px max) applied strictly on inner faces (never preserve-3d parent!)
    const motionBlurPx = Number((velocityNormalized * 1.4).toFixed(2));

    // Z-ordering: unflipped right stack stays front-most by lower index;
    // once past -90deg onto left stack, later flips sit on top of earlier flips
    const pastMid = angleDeg <= -90;
    const zIndex = pastMid ? 12 + index : 38 - index;

    // Reveal all unflipped leaves once cover begins lifting so Leaf 0 sits cleanly on top without pop-in
    const visible =
      safeElapsed >= coverOpenStartMs &&
      rawT < 0.995;

    const shadowOpacity = Number((midTurnEnvelope * 0.28).toFixed(3));

    return {
      index,
      progress: eased,
      angleDeg: Number(angleDeg.toFixed(2)),
      velocityNormalized: Number(velocityNormalized.toFixed(3)),
      motionBlurPx,
      zIndex,
      visible,
      opacity: 1,
      shadowOpacity,
    };
  });

  // Reference check to keep unused flippingEndMs clean in phase calculations
  void flippingEndMs;

  return {
    phase,
    elapsedMs: safeElapsed,
    overallProgress: clamp01(safeElapsed / totalDurationMs),
    spineShiftPercent: Number(spineShiftPercent.toFixed(3)),
    coverAngleDeg: Number(coverAngleDeg.toFixed(2)),
    coverOpacity,
    coverZIndex,
    bookTiltXDeg,
    bookTiltYDeg,
    bookScale,
    spreadRevealOpacity,
    backdropOpacity,
    overlayOpacity,
    closedShadowScale: Number((0.88 + 0.16 * coverEased).toFixed(3)),
    leaves: computedLeaves,
  };
}

export function hasBookIntroPlayed(storage: Pick<Storage, 'getItem'> | null | undefined = safeSessionStorage()): boolean {
  try {
    return storage?.getItem(BOOK_INTRO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function markBookIntroPlayed(storage: Pick<Storage, 'setItem'> | null | undefined = safeSessionStorage()): void {
  try {
    storage?.setItem(BOOK_INTRO_SESSION_KEY, '1');
  } catch {
    // Ignore storage restriction gracefully
  }
}

export function clearBookIntroPlayed(storage: Pick<Storage, 'removeItem'> | null | undefined = safeSessionStorage()): void {
  try {
    storage?.removeItem(BOOK_INTRO_SESSION_KEY);
  } catch {
    // Ignore
  }
}

function safeSessionStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function shouldPlayBookIntroOnEntry(params: {
  isUnlocked: boolean;
  currentSection: string;
  search: string;
  pathname: string;
  alreadyPlayedInSession: boolean;
}): boolean {
  const { isUnlocked, currentSection, search, pathname, alreadyPlayedInSession } = params;
  if (!isUnlocked) return false;
  if (pathname.startsWith('/admin')) return false;
  if (currentSection !== 'hub') return false;

  const query = new URLSearchParams(search);
  if (query.get('intro') === '1') return true;
  if (query.get('autostart') === '1' || query.get('skipIntro') === '1') return false;

  return !alreadyPlayedInSession;
}
