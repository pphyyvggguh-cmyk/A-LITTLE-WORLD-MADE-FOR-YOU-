import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getChapterIndexSummary,
  getSectionAnimationProfile,
  shouldPauseAmbientMotion,
} from './storybookMotion';
import type { AppSection } from '../store/useStore';

test('getSectionAnimationProfile returns distinct living animation personalities across major sections', () => {
  const sections: AppSection[] = [
    'hub',
    'story',
    'world',
    'letters',
    'video',
    'voices',
    'wishlist',
    'postcards',
    'reward',
  ];

  const signatures = sections.map((sec) => {
    const profile = getSectionAnimationProfile(sec);
    assert.equal(profile.section, sec);
    assert.ok(profile.creatures.length >= 1);
    return `${profile.moodLabel}:${profile.creatures.join(',')}`;
  });

  // Every major section must have a unique personality signature
  assert.equal(new Set(signatures).size, sections.length);
});

test('shouldPauseAmbientMotion pauses when tab is hidden, reduced motion is requested, or disabled', () => {
  assert.equal(
    shouldPauseAmbientMotion({ isDocumentHidden: false, reducedMotion: false }),
    false
  );
  assert.equal(
    shouldPauseAmbientMotion({ isDocumentHidden: true, reducedMotion: false }),
    true
  );
  assert.equal(
    shouldPauseAmbientMotion({ isDocumentHidden: false, reducedMotion: true }),
    true
  );
  assert.equal(
    shouldPauseAmbientMotion({ isDocumentHidden: false, reducedMotion: false, disabled: true }),
    true
  );
});

test('getChapterIndexSummary tracks active chapter, visited counts, and reward lock accurately', () => {
  const lockedSummary = getChapterIndexSummary('story', ['hub', 'story'], false);
  assert.equal(lockedSummary.activeChapter?.chapterNumber, '01');
  assert.equal(lockedSummary.visitedCount, 2);
  assert.equal(lockedSummary.totalAccessibleCount, 8);
  const rewardEntryLocked = lockedSummary.chapters.find((c) => c.id === 'reward');
  assert.equal(rewardEntryLocked?.isLocked, true);

  const unlockedSummary = getChapterIndexSummary('reward', ['hub', 'postcards', 'reward'], true);
  assert.equal(unlockedSummary.activeChapter?.chapterNumber, '08');
  assert.equal(unlockedSummary.totalAccessibleCount, 9);
  assert.equal(unlockedSummary.chapters.find((c) => c.id === 'reward')?.isLocked, false);
});
