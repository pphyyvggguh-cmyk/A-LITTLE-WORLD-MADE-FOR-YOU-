import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchTrustedServerNowMs,
  getTrustedNowMs,
  isTrustedClockSynced,
  resetServerTimeForTests,
  setTrustedClockAnchorForTests,
} from './serverTime.ts';

test('fetchTrustedServerNowMs syncs from /api/time and anchors monotonic elapsed time', async () => {
  resetServerTimeForTests();
  assert.equal(isTrustedClockSynced(), false);

  const serverMs = Date.UTC(2027, 3, 2, 12, 0, 0);
  const fakeFetch = (async () =>
    new Response(JSON.stringify({ serverTimeMs: serverMs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch;

  const returned = await fetchTrustedServerNowMs(fakeFetch);
  assert.equal(isTrustedClockSynced(), true);
  assert.ok(returned >= serverMs);
  assert.ok(getTrustedNowMs() >= serverMs);

  // Even if system Date.now() were years ahead/behind, anchored trusted time stays anchored to serverMs
  const originalDateNow = Date.now;
  Date.now = () => Date.UTC(2099, 0, 1);
  try {
    setTrustedClockAnchorForTests(serverMs, performance.now());
    const trusted = getTrustedNowMs();
    assert.ok(trusted >= serverMs && trusted < Date.UTC(2027, 4, 1));
  } finally {
    Date.now = originalDateNow;
    resetServerTimeForTests();
  }
});

test('fetchTrustedServerNowMs falls back to HTTP Date header when JSON payload lacks serverTimeMs', async () => {
  resetServerTimeForTests();
  const headerUtc = 'Fri, 02 Apr 2027 08:30:00 GMT';
  const expectedMs = Date.parse(headerUtc);

  const fakeFetch = (async () =>
    new Response('{}', {
      status: 200,
      headers: { Date: headerUtc },
    })) as unknown as typeof fetch;

  const returned = await fetchTrustedServerNowMs(fakeFetch);
  assert.equal(isTrustedClockSynced(), true);
  assert.ok(returned >= expectedMs);
  resetServerTimeForTests();
});
