export interface TrustedServerClockState {
  synced: boolean;
  serverAnchorMs: number | null;
  perfAnchorMs: number | null;
  lastSyncedAtIso: string;
}

const clockState: TrustedServerClockState = {
  synced: false,
  serverAnchorMs: null,
  perfAnchorMs: null,
  lastSyncedAtIso: '',
};

function currentPerfNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/**
 * Queries server-authoritative UTC time from GET /api/time (with HTTP Date header fallback).
 * Stores a monotonic performance.now() offset so changing the local OS clock after sync
 * cannot spoof the UI countdown/unlock check. Firestore Security Rules independently enforce
 * `request.time >= parent.unlockAt` on every read and mutation.
 */
export async function fetchTrustedServerNowMs(
  fetchImpl: typeof fetch = fetch
): Promise<number> {
  const perfBefore = currentPerfNow();
  try {
    const res = await fetchImpl('/api/time', {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    const perfAfter = currentPerfNow();
    const rttHalf = Math.max(0, (perfAfter - perfBefore) / 2);

    if (res.ok) {
      const json = (await res.json()) as { serverTimeMs?: unknown };
      if (typeof json.serverTimeMs === 'number' && Number.isFinite(json.serverTimeMs)) {
        const estimatedNow = Math.round(json.serverTimeMs + rttHalf);
        clockState.synced = true;
        clockState.serverAnchorMs = estimatedNow;
        clockState.perfAnchorMs = perfAfter;
        clockState.lastSyncedAtIso = new Date(estimatedNow).toISOString();
        return estimatedNow;
      }
    }

    const headerDate = res.headers?.get('date');
    if (headerDate) {
      const parsed = Date.parse(headerDate);
      if (Number.isFinite(parsed)) {
        const estimatedNow = Math.round(parsed + rttHalf);
        clockState.synced = true;
        clockState.serverAnchorMs = estimatedNow;
        clockState.perfAnchorMs = perfAfter;
        clockState.lastSyncedAtIso = new Date(estimatedNow).toISOString();
        return estimatedNow;
      }
    }
  } catch {
    // Offline fallback only when server is unreachable; Firestore request.time still protects locked payloads
  }

  return getTrustedNowMs();
}

export function getTrustedNowMs(): number {
  if (
    clockState.synced &&
    clockState.serverAnchorMs !== null &&
    clockState.perfAnchorMs !== null
  ) {
    const elapsed = Math.max(0, currentPerfNow() - clockState.perfAnchorMs);
    return Math.round(clockState.serverAnchorMs + elapsed);
  }
  return Date.now();
}

export function isTrustedClockSynced(): boolean {
  return clockState.synced;
}

export function setTrustedClockAnchorForTests(
  serverAnchorMs: number,
  perfAnchorMs = currentPerfNow()
): void {
  clockState.synced = true;
  clockState.serverAnchorMs = serverAnchorMs;
  clockState.perfAnchorMs = perfAnchorMs;
  clockState.lastSyncedAtIso = new Date(serverAnchorMs).toISOString();
}

export function resetServerTimeForTests(): void {
  clockState.synced = false;
  clockState.serverAnchorMs = null;
  clockState.perfAnchorMs = null;
  clockState.lastSyncedAtIso = '';
}
