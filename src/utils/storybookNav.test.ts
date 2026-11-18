import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChapterUrlPath,
  computeChapterDragProgress,
  getAdjacentBookChapter,
  getAvailableBookChapters,
  getChapterTransitionDirection,
  resolveChapterFromLocation,
  resolvePostUnlockSection,
  shouldCommitChapterSwipe,
} from './storybookNav';

test('getAvailableBookChapters excludes removed calendar chapter and appends reward only when unlocked', () => {
  const locked = getAvailableBookChapters(false);
  assert.deepEqual(locked, [
    'hub',
    'story',
    'world',
    'letters',
    'video',
    'voices',
    'wishlist',
    'postcards',
  ]);
  assert.equal((locked as string[]).includes('calendar'), false);

  const unlocked = getAvailableBookChapters(true);
  assert.equal(unlocked.at(-1), 'reward');
  assert.equal(unlocked.length, 9);
});

test('getAdjacentBookChapter navigates forward and backward across book chapters safely', () => {
  assert.equal(getAdjacentBookChapter('hub', 'prev', false), null);
  assert.equal(getAdjacentBookChapter('hub', 'next', false), 'story');
  assert.equal(getAdjacentBookChapter('story', 'prev', false), 'hub');
  assert.equal(getAdjacentBookChapter('postcards', 'next', false), null);
  assert.equal(getAdjacentBookChapter('postcards', 'next', true), 'reward');
  assert.equal(getAdjacentBookChapter('reward', 'prev', true), 'postcards');
});

test('resolvePostUnlockSection prevents authenticated browser Back from returning to password or welcome', () => {
  assert.equal(resolvePostUnlockSection('password', false, false), 'password');
  assert.equal(resolvePostUnlockSection('hub', false, false), 'password');

  // Once unlocked, browser Back / popstate resolving to password, welcome, or empty MUST stay inside the book
  assert.equal(resolvePostUnlockSection('password', true, false), 'hub');
  assert.equal(resolvePostUnlockSection('welcome', true, false), 'hub');
  assert.equal(resolvePostUnlockSection(null, true, false), 'hub');
  assert.equal(resolvePostUnlockSection('story', true, false), 'story');
  assert.equal(resolvePostUnlockSection('reward', true, false), 'hub');
  assert.equal(resolvePostUnlockSection('reward', true, true), 'reward');
});

test('resolveChapterFromLocation parses URL chapter cleanly and ignores password/calendar/welcome', () => {
  assert.equal(resolveChapterFromLocation('?chapter=letters', '', false), 'letters');
  assert.equal(resolveChapterFromLocation('', '#world', false), 'world');
  assert.equal(resolveChapterFromLocation('?chapter=calendar', '', false), null);
  assert.equal(resolveChapterFromLocation('?chapter=password', '', false), null);
  assert.equal(resolveChapterFromLocation('?chapter=reward', '', false), 'hub');
  assert.equal(resolveChapterFromLocation('?chapter=reward', '', true), 'reward');
  assert.equal(buildChapterUrlPath('hub'), '/');
  assert.equal(buildChapterUrlPath('story'), '/?chapter=story');
});

test('chapter swipe physics commit intentional horizontal turns and ignore vertical scrolls', () => {
  assert.equal(
    getChapterTransitionDirection('hub', 'letters', false),
    1
  );
  assert.equal(
    getChapterTransitionDirection('letters', 'hub', false),
    -1
  );

  // Vertical scroll attempt should NOT flip chapter
  assert.equal(
    shouldCommitChapterSwipe({
      dx: -24,
      dy: -110,
      velocityPxPerMs: 0.7,
      dir: 1,
      canGoPrev: true,
      canGoNext: true,
      bookWidth: 900,
    }),
    false
  );

  // Clean horizontal swipe left turns forward
  assert.equal(
    shouldCommitChapterSwipe({
      dx: -95,
      dy: 8,
      velocityPxPerMs: 0.3,
      dir: 1,
      canGoPrev: true,
      canGoNext: true,
      bookWidth: 900,
    }),
    true
  );

  // Swipe at boundary does not commit
  assert.equal(
    shouldCommitChapterSwipe({
      dx: 120,
      dy: 4,
      velocityPxPerMs: 0.8,
      dir: -1,
      canGoPrev: false,
      canGoNext: true,
      bookWidth: 900,
    }),
    false
  );

  assert.equal(
    computeChapterDragProgress({ dx: -180, dir: 1, bookWidth: 800 }) > 0.4,
    true
  );
});
