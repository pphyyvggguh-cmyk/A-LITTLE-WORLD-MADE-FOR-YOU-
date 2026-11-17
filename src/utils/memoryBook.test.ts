import test from 'node:test';
import assert from 'node:assert/strict';
import { MEMORY_BOOK_PAGES } from '../data/memories';
import {
  buildBookSpreads,
  clampSpreadIndex,
  computeDragCurlProgress,
  detectPageCornerOrigin,
  detectPageTapSide,
  detectSwipeDirection,
  getReadingProgressPercent,
  getSpreadPageIndicator,
  isTapWithinTolerance,
  shouldCommitDragTurn,
  TOTAL_MEMORY_PAGES,
  TOTAL_SPREADS,
} from './memoryBook';

test('buildBookSpreads produces exactly 9 spreads for 17 memory pages', () => {
  const mockPages = Array.from({ length: TOTAL_MEMORY_PAGES }, (_, i) => ({
    pageNumber: i + 1,
  }));
  const spreads = buildBookSpreads(mockPages);
  assert.equal(spreads.length, TOTAL_SPREADS);

  // Spreads 1..8 each have 2 numbered pages
  for (let i = 0; i < 8; i++) {
    assert.ok(spreads[i].leftPage);
    assert.ok(spreads[i].rightPage);
    assert.equal(spreads[i].leftPage?.pageNumber, i * 2 + 1);
    assert.equal(spreads[i].rightPage?.pageNumber, i * 2 + 2);
  }

  // Spread 9 has page 17 on left and unnumbered closing composition (null) on right
  assert.equal(spreads[8].leftPage?.pageNumber, 17);
  assert.equal(spreads[8].rightPage, null);
});

test('getSpreadPageIndicator counts strictly up to 17 memory pages', () => {
  assert.equal(getSpreadPageIndicator(0), 'Halaman 1–2 dari 17');
  assert.equal(getSpreadPageIndicator(4), 'Halaman 9–10 dari 17');
  assert.equal(getSpreadPageIndicator(7), 'Halaman 15–16 dari 17');
  assert.equal(getSpreadPageIndicator(8), 'Halaman 17 dari 17');
});

test('getReadingProgressPercent climbs monotonically and hits 100% at spread 9', () => {
  const p0 = getReadingProgressPercent(0);
  const p4 = getReadingProgressPercent(4);
  const p8 = getReadingProgressPercent(8);
  assert.ok(p0 > 0 && p0 < p4 && p4 < p8);
  assert.equal(p8, 100);
});

test('clampSpreadIndex clamps out-of-range and NaN indices safely', () => {
  assert.equal(clampSpreadIndex(-3), 0);
  assert.equal(clampSpreadIndex(0), 0);
  assert.equal(clampSpreadIndex(8), 8);
  assert.equal(clampSpreadIndex(99), 8);
  assert.equal(clampSpreadIndex(Number.NaN), 0);
});

test('detectSwipeDirection recognizes horizontal swipes and ignores vertical scroll/taps', () => {
  assert.equal(detectSwipeDirection(-80, 10), 'next');
  assert.equal(detectSwipeDirection(80, -15), 'prev');
  assert.equal(detectSwipeDirection(-20, 0), null);
  assert.equal(detectSwipeDirection(-55, 80), null);
});

test('detectPageTapSide routes right page taps forward and left page taps backward safely', () => {
  assert.equal(
    detectPageTapSide({
      clientX: 720,
      containerLeft: 100,
      containerWidth: 900,
      canGoPrev: true,
      canGoNext: true,
    }),
    'next'
  );
  assert.equal(
    detectPageTapSide({
      clientX: 250,
      containerLeft: 100,
      containerWidth: 900,
      canGoPrev: true,
      canGoNext: true,
    }),
    'prev'
  );
  // Boundary clamping
  assert.equal(
    detectPageTapSide({
      clientX: 200,
      containerLeft: 100,
      containerWidth: 900,
      canGoPrev: false,
      canGoNext: true,
    }),
    null
  );
  assert.equal(
    detectPageTapSide({
      clientX: 800,
      containerLeft: 100,
      containerWidth: 900,
      canGoPrev: true,
      canGoNext: false,
    }),
    null
  );
});

test('detectPageCornerOrigin resolves top vs bottom corner peel anchor', () => {
  assert.equal(detectPageCornerOrigin(140, 100, 500), 'top');
  assert.equal(detectPageCornerOrigin(480, 100, 500), 'bottom');
});

test('computeDragCurlProgress and shouldCommitDragTurn handle corner drag & flick velocity cleanly', () => {
  const halfProgress = computeDragCurlProgress({
    dx: -210,
    direction: 1,
    bookWidth: 1000,
  });
  assert.equal(halfProgress, 0.5);
  assert.equal(
    shouldCommitDragTurn({ progress: halfProgress, dx: -210, dy: 12 }),
    true
  );

  // Wrong drag direction stays 0
  assert.equal(
    computeDragCurlProgress({ dx: 60, direction: 1, bookWidth: 1000 }),
    0
  );

  // Short flick commits only when fast & horizontal
  assert.equal(
    shouldCommitDragTurn({ progress: 0.12, dx: -45, dy: 4, velocityPxPerMs: 0.5 }),
    true
  );
  assert.equal(
    shouldCommitDragTurn({ progress: 0.12, dx: -45, dy: 4, velocityPxPerMs: 0.1 }),
    false
  );
  // Mostly vertical gesture never commits
  assert.equal(
    shouldCommitDragTurn({ progress: 0.4, dx: -50, dy: 90, velocityPxPerMs: 0.8 }),
    false
  );
});

test('isTapWithinTolerance allows minor touch jitter while rejecting drags', () => {
  assert.equal(isTapWithinTolerance(3, -4), true);
  assert.equal(isTapWithinTolerance(18, 2), false);
});

test('MEMORY_BOOK_PAGES keeps all 17 pages and existing polaroid assignments intact', () => {
  assert.equal(MEMORY_BOOK_PAGES.length, 17);
  const allPolaroids = MEMORY_BOOK_PAGES.flatMap((p) => p.polaroids);
  assert.equal(allPolaroids.length, 24);
  for (let i = 0; i < MEMORY_BOOK_PAGES.length; i++) {
    assert.equal(MEMORY_BOOK_PAGES[i].pageNumber, i + 1);
    assert.ok(MEMORY_BOOK_PAGES[i].polaroids.length >= 1);
    for (const pol of MEMORY_BOOK_PAGES[i].polaroids) {
      assert.ok(pol.image.length > 0);
    }
  }
});

