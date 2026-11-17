import {
  SECTION_ANIMATION_PROFILES,
  STORYBOOK_CHAPTERS,
  type SectionAnimationProfile,
  type StorybookChapterItem,
} from '../data/storybook';
import type { AppSection } from '../store/useStore';

export function getSectionAnimationProfile(section: AppSection): SectionAnimationProfile {
  return SECTION_ANIMATION_PROFILES[section] ?? SECTION_ANIMATION_PROFILES.hub;
}

export interface AmbientPauseContext {
  isDocumentHidden: boolean;
  reducedMotion: boolean;
  disabled?: boolean;
}

export function shouldPauseAmbientMotion(ctx: AmbientPauseContext): boolean {
  return Boolean(ctx.isDocumentHidden || ctx.reducedMotion || ctx.disabled);
}

export interface VisibleChapterEntry extends StorybookChapterItem {
  isCurrent: boolean;
  isVisited: boolean;
  isLocked: boolean;
}

export interface ChapterIndexSummary {
  chapters: VisibleChapterEntry[];
  activeChapter: StorybookChapterItem | null;
  visitedCount: number;
  totalAccessibleCount: number;
}

export function getChapterIndexSummary(
  currentSection: AppSection,
  visitedSections: string[],
  isRewardUnlocked: boolean
): ChapterIndexSummary {
  const visitedSet = new Set(visitedSections);

  const chapters: VisibleChapterEntry[] = STORYBOOK_CHAPTERS.map((ch) => ({
    ...ch,
    isCurrent: currentSection === ch.id,
    isVisited: visitedSet.has(ch.id) || currentSection === ch.id,
    isLocked: Boolean(ch.requiresReward && !isRewardUnlocked),
  }));

  const accessible = chapters.filter((c) => !c.isLocked);
  const visitedCount = accessible.filter((c) => c.isVisited).length;
  const activeChapter =
    STORYBOOK_CHAPTERS.find((c) => c.id === currentSection) ?? null;

  return {
    chapters,
    activeChapter,
    visitedCount,
    totalAccessibleCount: accessible.length,
  };
}
