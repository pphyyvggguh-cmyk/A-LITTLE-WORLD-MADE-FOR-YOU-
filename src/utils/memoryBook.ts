export const TOTAL_MEMORY_PAGES = 17;
export const TOTAL_SPREADS = 9;
export const SESSION_SPREAD_STORAGE_KEY = 'wulan_memory_book_spread_v1';

export interface BookSpreadPair<T> {
  spreadIndex: number;
  spreadNumber: number;
  leftPage: T | null;
  rightPage: T | null;
}

/**
 * Group an exact 17-page book array into 9 two-page spreads.
 * Spreads 0..7 contain 2 facing pages each (pages 1..16).
 * Spread 8 contains page 17 on the left and a complementary unnumbered closing side (null) on the right.
 */
export function buildBookSpreads<T>(pages: readonly T[]): BookSpreadPair<T>[] {
  const spreads: BookSpreadPair<T>[] = [];
  for (let i = 0; i < TOTAL_SPREADS; i++) {
    const leftIdx = i * 2;
    const rightIdx = i * 2 + 1;
    spreads.push({
      spreadIndex: i,
      spreadNumber: i + 1,
      leftPage: pages[leftIdx] ?? null,
      rightPage: pages[rightIdx] ?? null,
    });
  }
  return spreads;
}

export function clampSpreadIndex(index: number, totalSpreads = TOTAL_SPREADS): number {
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(totalSpreads - 1, Math.floor(index)));
}

/**
 * Returns the readable page range indicator counting ONLY the 17 designed memory pages.
 */
export function getSpreadPageIndicator(
  spreadIndex: number,
  totalPages = TOTAL_MEMORY_PAGES
): string {
  const safeIdx = clampSpreadIndex(spreadIndex);
  const leftNum = safeIdx * 2 + 1;
  const rightNum = leftNum + 1;
  if (rightNum <= totalPages) {
    return `Halaman ${leftNum}–${rightNum} dari ${totalPages}`;
  }
  return `Halaman ${leftNum} dari ${totalPages}`;
}

/**
 * Computes reading progress percentage (based on highest memory page reached on the spread).
 */
export function getReadingProgressPercent(
  spreadIndex: number,
  totalPages = TOTAL_MEMORY_PAGES
): number {
  const safeIdx = clampSpreadIndex(spreadIndex);
  const highestPageReached = Math.min(totalPages, safeIdx * 2 + 2);
  return Math.round((highestPageReached / totalPages) * 100);
}

/**
 * Determines whether a horizontal drag/swipe gesture should flip the spread.
 * Ignores mostly-vertical gestures or short accidental micro-drags.
 */
export function detectSwipeDirection(
  dx: number,
  dy: number,
  thresholdPx = 48
): 'next' | 'prev' | null {
  if (Math.abs(dx) < thresholdPx) return null;
  if (Math.abs(dx) <= Math.abs(dy) * 1.25) return null;
  return dx < 0 ? 'next' : 'prev';
}

export function loadSessionSpreadIndex(): number {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return 0;
    const raw = window.sessionStorage.getItem(SESSION_SPREAD_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return clampSpreadIndex(parsed);
  } catch {
    return 0;
  }
}

export function saveSessionSpreadIndex(spreadIndex: number): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.setItem(
      SESSION_SPREAD_STORAGE_KEY,
      String(clampSpreadIndex(spreadIndex))
    );
  } catch {
    // Ignore storage errors safely
  }
}

export type PageCornerVerticalOrigin = 'top' | 'bottom';

export interface PageTapSideInput {
  clientX: number;
  containerLeft: number;
  containerWidth: number;
  canGoPrev: boolean;
  canGoNext: boolean;
}

/**
 * Resolves tap navigation intent based on horizontal position within the two-page book spread:
 * right half -> next spread; left half -> previous spread.
 */
export function detectPageTapSide({
  clientX,
  containerLeft,
  containerWidth,
  canGoPrev,
  canGoNext,
}: PageTapSideInput): 'next' | 'prev' | null {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return null;
  const relX = (clientX - containerLeft) / containerWidth;
  if (relX < 0 || relX > 1) return null;

  if (relX >= 0.5) {
    return canGoNext ? 'next' : null;
  }
  return canGoPrev ? 'prev' : null;
}

/**
 * Determines whether pointer started in the upper or lower half of a page,
 * anchoring the corner peel tilt naturally (top-right/bottom-right or top-left/bottom-left).
 */
export function detectPageCornerOrigin(
  clientY: number,
  containerTop: number,
  containerHeight: number
): PageCornerVerticalOrigin {
  if (!Number.isFinite(containerHeight) || containerHeight <= 0) return 'bottom';
  const relY = (clientY - containerTop) / containerHeight;
  return relY < 0.45 ? 'top' : 'bottom';
}

/**
 * Computes normalized page curl progress in [0, 1] during an active horizontal drag/corner peel.
 */
export function computeDragCurlProgress(params: {
  dx: number;
  direction: 1 | -1;
  bookWidth: number;
}): number {
  const { dx, direction, bookWidth } = params;
  const safeDistance = Math.max(140, bookWidth * 0.42);
  const effectiveDx = direction === 1 ? -dx : dx;
  if (!Number.isFinite(effectiveDx) || effectiveDx <= 0) return 0;
  return Math.max(0, Math.min(1, effectiveDx / safeDistance));
}

/**
 * Decides whether releasing a drag/corner curl commits a page turn or springs back smoothly.
 */
export function shouldCommitDragTurn(params: {
  progress: number;
  dx: number;
  dy: number;
  velocityPxPerMs?: number;
}): boolean {
  const { progress, dx, dy, velocityPxPerMs = 0 } = params;
  if (Math.abs(dx) <= Math.abs(dy) * 1.15) return false;
  if (progress >= 0.28) return true;
  // Quick intentional horizontal flick even with shorter travel
  return Math.abs(dx) >= 34 && Math.abs(velocityPxPerMs) >= 0.35;
}

/**
 * Checks whether pointer movement stayed within tap tolerance (so micro-jitter still taps cleanly,
 * whereas drags/swipes never trigger accidental tap flips).
 */
export function isTapWithinTolerance(dx: number, dy: number, maxMovePx = 8): boolean {
  return Math.hypot(dx, dy) <= maxMovePx;
}

