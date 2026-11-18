import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIntroLeafSchedule,
  computeIntroTimeline,
  INTRO_PHASE_WINDOWS,
  shouldPlayBookIntroOnEntry,
} from './bookIntro';

test('buildIntroLeafSchedule starts rapid and gradually slows down with increasing durations', () => {
  const leaves = buildIntroLeafSchedule(10);
  assert.equal(leaves.length, 10);

  const firstGap = leaves[1].startMs - leaves[0].startMs;
  const lastGap = leaves[leaves.length - 1].startMs - leaves[leaves.length - 2].startMs;
  assert.ok(lastGap > firstGap, `Expected final gap (${lastGap}) > initial gap (${firstGap})`);
  assert.ok(
    leaves[leaves.length - 1].durationMs > leaves[0].durationMs,
    'Final leaves should take longer to settle than opening rapid flips'
  );
  assert.ok(
    leaves[leaves.length - 1].startMs + leaves[leaves.length - 1].durationMs <=
      INTRO_PHASE_WINDOWS.flippingEndMs + 20
  );
});

test('computeIntroTimeline transitions continuously from closed -> opening -> flipping -> zooming -> complete', () => {
  const closedFrame = computeIntroTimeline(250);
  assert.equal(closedFrame.phase, 'closed');
  assert.equal(closedFrame.coverAngleDeg, 0);
  assert.equal(closedFrame.spineShiftPercent, -25);
  assert.equal(closedFrame.overlayOpacity, 1);

  const openingFrame = computeIntroTimeline(1050);
  assert.equal(openingFrame.phase, 'opening');
  assert.ok(openingFrame.coverAngleDeg < 0 && openingFrame.coverAngleDeg > -178);
  assert.ok(openingFrame.spineShiftPercent > -25 && openingFrame.spineShiftPercent < 0);

  const flippingFrame = computeIntroTimeline(1950);
  assert.equal(flippingFrame.phase, 'flipping');
  assert.ok(
    flippingFrame.leaves.some((leaf) => leaf.angleDeg < 0 && leaf.angleDeg > -180),
    'Active flipping leaves should be mid-turn'
  );
  assert.ok(
    flippingFrame.leaves.some((leaf) => leaf.motionBlurPx > 0),
    'Active fast leaves should compute subtle motion blur'
  );

  const zoomingFrame = computeIntroTimeline(4150);
  assert.equal(zoomingFrame.phase, 'zooming');
  assert.ok(zoomingFrame.bookScale > 1.03, `Expected zoom scale > 1.03, got ${zoomingFrame.bookScale}`);
  assert.ok(zoomingFrame.bookScale > flippingFrame.bookScale);
  assert.ok(Math.abs(zoomingFrame.bookTiltXDeg) < Math.abs(closedFrame.bookTiltXDeg));

  const completeFrame = computeIntroTimeline(INTRO_PHASE_WINDOWS.totalDurationMs + 100);
  assert.equal(completeFrame.phase, 'complete');
  assert.equal(completeFrame.overlayOpacity, 0);
});

test('computeIntroTimeline respects reduced motion without rapid flips or blur', () => {
  const frame = computeIntroTimeline(180, undefined, true);
  assert.equal(frame.coverAngleDeg, -176);
  assert.equal(frame.bookTiltXDeg, 0);
  assert.ok(frame.leaves.every((leaf) => leaf.motionBlurPx === 0));

  const done = computeIntroTimeline(600, undefined, true);
  assert.equal(done.phase, 'complete');
  assert.equal(done.overlayOpacity, 0);
});

test('shouldPlayBookIntroOnEntry respects unlock state, hub focus, session flag, and skip params', () => {
  assert.equal(
    shouldPlayBookIntroOnEntry({
      isUnlocked: false,
      currentSection: 'hub',
      search: '',
      pathname: '/',
      alreadyPlayedInSession: false,
    }),
    false
  );

  assert.equal(
    shouldPlayBookIntroOnEntry({
      isUnlocked: true,
      currentSection: 'hub',
      search: '',
      pathname: '/',
      alreadyPlayedInSession: false,
    }),
    true
  );

  assert.equal(
    shouldPlayBookIntroOnEntry({
      isUnlocked: true,
      currentSection: 'hub',
      search: '',
      pathname: '/',
      alreadyPlayedInSession: true,
    }),
    false
  );

  assert.equal(
    shouldPlayBookIntroOnEntry({
      isUnlocked: true,
      currentSection: 'letters',
      search: '?chapter=letters',
      pathname: '/',
      alreadyPlayedInSession: false,
    }),
    false
  );

  assert.equal(
    shouldPlayBookIntroOnEntry({
      isUnlocked: true,
      currentSection: 'hub',
      search: '?autostart=1',
      pathname: '/',
      alreadyPlayedInSession: false,
    }),
    false
  );

  assert.equal(
    shouldPlayBookIntroOnEntry({
      isUnlocked: true,
      currentSection: 'hub',
      search: '',
      pathname: '/admin',
      alreadyPlayedInSession: false,
    }),
    false
  );
});
