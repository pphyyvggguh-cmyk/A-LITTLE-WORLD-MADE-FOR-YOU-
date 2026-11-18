import type { AppSection } from '../store/useStore';

export type BookChapterId = Exclude<AppSection, 'password' | 'welcome'>;

export const MAIN_BOOK_CHAPTERS: readonly BookChapterId[] = [
  'hub',
  'story',
  'world',
  'letters',
  'video',
  'voices',
  'wishlist',
  'postcards',
] as const;

export const VALID_BOOK_CHAPTER_SET = new Set<string>([...MAIN_BOOK_CHAPTERS, 'reward']);

export function getAvailableBookChapters(
  isRewardUnlocked: boolean,
  currentSection?: AppSection
): BookChapterId[] {
  if (isRewardUnlocked || currentSection === 'reward') {
    return [...MAIN_BOOK_CHAPTERS, 'reward'];
  }
  return [...MAIN_BOOK_CHAPTERS];
}

export function isBookChapterId(value: string | null | undefined): value is BookChapterId {
  return typeof value === 'string' && VALID_BOOK_CHAPTER_SET.has(value);
}

export function getAdjacentBookChapter(
  currentSection: AppSection,
  direction: 'prev' | 'next',
  isRewardUnlocked: boolean
): BookChapterId | null {
  const sequence = getAvailableBookChapters(isRewardUnlocked, currentSection);
  const idx = sequence.indexOf(currentSection as BookChapterId);
  if (idx < 0) return null;
  const targetIdx = direction === 'next' ? idx + 1 : idx - 1;
  if (targetIdx < 0 || targetIdx >= sequence.length) return null;
  return sequence[targetIdx];
}

export function getChapterTransitionDirection(
  fromSection: AppSection,
  toSection: AppSection,
  isRewardUnlocked: boolean
): 1 | -1 {
  const sequence = getAvailableBookChapters(isRewardUnlocked, toSection);
  const fromIdx = sequence.indexOf(fromSection as BookChapterId);
  const toIdx = sequence.indexOf(toSection as BookChapterId);
  if (fromIdx < 0 || toIdx < 0) return 1;
  return toIdx >= fromIdx ? 1 : -1;
}

/**
 * Resolves an initial or popped URL location cleanly.
 * Never returns 'password' or 'welcome' as a chapter target.
 */
export function resolveChapterFromLocation(
  search: string,
  hash: string,
  isRewardUnlocked: boolean
): BookChapterId | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const queryChapter = params.get('chapter') || params.get('bab');
  if (isBookChapterId(queryChapter)) {
    if (queryChapter === 'reward' && !isRewardUnlocked) {
      return 'hub';
    }
    return queryChapter;
  }

  const normalizedHash = hash.replace(/^#\/?/, '').trim();
  if (isBookChapterId(normalizedHash)) {
    if (normalizedHash === 'reward' && !isRewardUnlocked) {
      return 'hub';
    }
    return normalizedHash;
  }

  return null;
}

/**
 * Hard security & history guard:
 * Once unlocked, browser Back / popstate MUST NEVER return the user to 'password' or 'welcome'.
 */
export function resolvePostUnlockSection(
  requested: AppSection | BookChapterId | null | undefined,
  isUnlocked: boolean,
  isRewardUnlocked: boolean
): AppSection {
  if (!isUnlocked) {
    return 'password';
  }
  if (!requested || requested === 'password' || requested === 'welcome') {
    return 'hub';
  }
  if (requested === 'reward' && !isRewardUnlocked) {
    return 'hub';
  }
  return isBookChapterId(requested) ? requested : 'hub';
}

export function buildChapterUrlPath(chapter: BookChapterId): string {
  return chapter === 'hub' ? '/' : `/?chapter=${chapter}`;
}

export function computeChapterDragProgress(params: {
  dx: number;
  dir: 1 | -1;
  bookWidth: number;
}): number {
  const { dx, dir, bookWidth } = params;
  const width = Math.max(260, bookWidth);
  const signedDelta = dir === 1 ? -dx : dx;
  if (signedDelta <= 0) return 0;
  return Math.min(0.95, signedDelta / Math.min(width * 0.48, 360));
}

export function shouldCommitChapterSwipe(params: {
  dx: number;
  dy: number;
  velocityPxPerMs: number;
  dir: 1 | -1;
  canGoPrev: boolean;
  canGoNext: boolean;
  bookWidth: number;
}): boolean {
  const { dx, dy, velocityPxPerMs, dir, canGoPrev, canGoNext, bookWidth } = params;
  if (dir === 1 && !canGoNext) return false;
  if (dir === -1 && !canGoPrev) return false;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < 28 || absX < absY * 1.25) return false;

  const signedCorrect = dir === 1 ? dx < 0 : dx > 0;
  if (!signedCorrect) return false;

  const progress = computeChapterDragProgress({ dx, dir, bookWidth });
  if (progress >= 0.24) return true;
  if (absX >= 62) return true;
  if (velocityPxPerMs >= 0.42 && absX >= 34) return true;
  return false;
}
