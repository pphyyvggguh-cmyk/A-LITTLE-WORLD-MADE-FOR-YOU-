import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_JAR_SETTINGS,
  JarCooldownState,
  JarFeatureSettings,
  JarPaperStyle,
  JarPoolThought,
  JarThoughtSubmission,
} from '../data/jarOfThoughts';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { isAuthorizedAdminEmail } from './wishlist';
import {
  computeCooldownStatus,
  JarCooldownStatus,
  JarSubmissionDraft,
  normalizeJarSettings,
  pickRandomUnopenedThought,
  resolveDisplayAuthor,
  validateJarSubmissionInput,
} from './jarOfThoughts';
import { formatSafeUiError, PUBLIC_JAR_SUBMIT_ERROR } from './safeError';

function timestampToIso(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return '';
}

function timestampToMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function createThoughtId(prefix = 'thought'): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function isPermissionDeniedError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return msg.includes('permission-denied') || msg.includes('missing or insufficient permissions');
}

function requireVerifiedAdmin() {
  const user = auth.currentUser;
  if (!user || !isAuthorizedAdminEmail(user.email, user.emailVerified)) {
    throw new Error('Akses ditolak: harap masuk dengan akun admin terverifikasi.');
  }
  return user;
}

export async function fetchJarTrustedServerTimeMs(): Promise<number> {
  try {
    const res = await fetch('/api/time', { cache: 'no-store' });
    if (!res.ok) return Date.now();
    const data = (await res.json()) as { serverTimeMs?: number };
    return typeof data.serverTimeMs === 'number' && Number.isFinite(data.serverTimeMs)
      ? data.serverTimeMs
      : Date.now();
  } catch {
    return Date.now();
  }
}

export async function fetchJarSettings(): Promise<JarFeatureSettings> {
  try {
    const snap = await getDoc(doc(db, 'siteContent', 'jar'));
    if (!snap.exists()) return DEFAULT_JAR_SETTINGS;
    const rawPayload = snap.data()?.payload as Partial<JarFeatureSettings> | undefined;
    return normalizeJarSettings(rawPayload);
  } catch {
    return DEFAULT_JAR_SETTINGS;
  }
}

export async function saveJarSettings(
  nextSettings: JarFeatureSettings
): Promise<JarFeatureSettings> {
  const user = requireVerifiedAdmin();
  const normalized = normalizeJarSettings(nextSettings);
  const docRef = doc(db, 'siteContent', 'jar');
  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      await updateDoc(docRef, {
        payload: normalized,
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        sectionId: 'jar',
        payload: normalized,
        updatedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'siteContent/jar');
  }
  return normalized;
}

export async function submitPublicJarThought(draft: JarSubmissionDraft): Promise<{
  id: string;
  serverTimeMs: number;
}> {
  const validation = validateJarSubmissionInput(draft);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const settings = await fetchJarSettings();
  if (!settings.enabled) {
    throw new Error('Fitur kiriman pesan untuk toples saat ini sedang ditutup sementara.');
  }

  let cleanData = validation.data;
  let serverTimeMs = Date.now();

  try {
    const guardRes = await fetch('/api/jar/submit-guard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanData),
    });
    const contentType = guardRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = (await guardRes.json()) as {
        ok?: boolean;
        error?: string;
        sanitized?: typeof cleanData;
        serverTimeMs?: number;
      };
      if (!guardRes.ok) {
        throw new Error(payload.error || 'Pesan belum bisa dikirim saat ini.');
      }
      if (payload.sanitized) {
        cleanData = payload.sanitized;
      }
      if (typeof payload.serverTimeMs === 'number') {
        serverTimeMs = payload.serverTimeMs;
      }
    }
  } catch (err) {
    if (err instanceof Error && (err.message.includes('sama persis') || err.message.includes('beruntun') || err.message.includes('karakter') || err.message.includes('belum bisa'))) {
      throw err;
    }
  }

  const thoughtId = createThoughtId('jar');
  try {
    await setDoc(doc(db, 'jarThoughts', thoughtId), {
      id: thoughtId,
      senderInitial: cleanData.senderInitial,
      isAnonymous: cleanData.isAnonymous,
      message: cleanData.message,
      paperStyle: cleanData.paperStyle,
      status: 'pending',
      opened: false,
      source: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      try {
        handleFirestoreError(err, OperationType.CREATE, `jarThoughts/${thoughtId}`);
      } catch {
        // Diagnostic logged in DEV only; never expose raw Firebase/permission errors to public senders
      }
    }
    throw new Error(PUBLIC_JAR_SUBMIT_ERROR);
  }

  return { id: thoughtId, serverTimeMs };
}

export interface WulanJarSnapshot {
  settings: JarFeatureSettings;
  pool: JarPoolThought[];
  unopenedCount: number;
  openedKeepsakes: JarPoolThought[];
  cooldownState: JarCooldownState | null;
  cooldownStatus: JarCooldownStatus;
  serverNowMs: number;
  permissionDenied: boolean;
}

function mapPoolDoc(id: string, raw: Record<string, unknown>): JarPoolThought {
  return {
    id: String(raw.id || id),
    displayAuthor: String(raw.displayAuthor || 'Someone Special'),
    isAnonymous: Boolean(raw.isAnonymous),
    message: String(raw.message || ''),
    paperStyle: (raw.paperStyle || 'ivory-linen') as JarPaperStyle,
    isApproved: true,
    opened: Boolean(raw.opened),
    openedAt: timestampToIso(raw.openedAt),
    sortSeed: typeof raw.sortSeed === 'number' ? raw.sortSeed : 0.5,
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
  };
}

export async function fetchWulanJarSnapshot(): Promise<WulanJarSnapshot> {
  const [settings, serverNowMs] = await Promise.all([
    fetchJarSettings(),
    fetchJarTrustedServerTimeMs(),
  ]);

  let pool: JarPoolThought[] = [];
  let cooldownState: JarCooldownState | null = null;
  let permissionDenied = false;

  try {
    const [poolSnap, cooldownSnap] = await Promise.all([
      getDocs(query(collection(db, 'jarPool'), where('isApproved', '==', true))),
      getDoc(doc(db, 'jarState', 'cooldown')),
    ]);

    pool = poolSnap.docs.map((d) =>
      mapPoolDoc(d.id, d.data() as Record<string, unknown>)
    );

    if (cooldownSnap.exists()) {
      const raw = cooldownSnap.data();
      const lastOpenedMs = timestampToMs(raw.lastOpenedAt);
      cooldownState = {
        stateId: 'cooldown',
        lastOpenedAt: timestampToIso(raw.lastOpenedAt),
        lastOpenedAtMs: lastOpenedMs,
        lastOpenedThoughtId: String(raw.lastOpenedThoughtId || ''),
        totalOpenedCount:
          typeof raw.totalOpenedCount === 'number' ? raw.totalOpenedCount : 0,
        updatedAt: timestampToIso(raw.updatedAt),
      };
    }
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      permissionDenied = true;
    } else {
      throw err;
    }
  }

  const unopenedCount = pool.filter((item) => !item.opened).length;
  const openedKeepsakes = pool
    .filter((item) => item.opened)
    .sort((a, b) => (b.openedAt || '').localeCompare(a.openedAt || ''));

  const cooldownStatus = computeCooldownStatus(
    cooldownState?.lastOpenedAtMs ?? null,
    serverNowMs,
    settings.cooldownHours
  );

  return {
    settings,
    pool,
    unopenedCount,
    openedKeepsakes,
    cooldownState,
    cooldownStatus,
    serverNowMs,
    permissionDenied,
  };
}

export type RevealJarResult =
  | { status: 'revealed'; thought: JarPoolThought; serverNowMs: number }
  | { status: 'empty'; message: string }
  | { status: 'disabled'; message: string }
  | { status: 'cooldown'; cooldownStatus: JarCooldownStatus; message: string }
  | { status: 'concurrent'; message: string }
  | { status: 'error'; message: string };

export async function revealDailyJarThought(): Promise<RevealJarResult> {
  const settings = await fetchJarSettings();
  if (!settings.enabled) {
    return {
      status: 'disabled',
      message: 'Toples pesan sedang diistirahatkan sementara waktu.',
    };
  }

  // Acquire short server-side concurrency / burst lock
  let guardAcquired = false;
  let trustedNowMs = Date.now();
  try {
    const guardRes = await fetch('/api/jar/reveal-guard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cooldownHours: settings.cooldownHours }),
    });
    const contentType = guardRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await guardRes.json()) as {
        ok?: boolean;
        code?: string;
        serverTimeMs?: number;
        remainingMs?: number;
        error?: string;
      };
      if (typeof data.serverTimeMs === 'number') {
        trustedNowMs = data.serverTimeMs;
      }
      if (!guardRes.ok) {
        if (data.code === 'COOLDOWN_ACTIVE') {
          return {
            status: 'cooldown',
            cooldownStatus: computeCooldownStatus(
              trustedNowMs - (settings.cooldownHours * 3600 * 1000 - (data.remainingMs || 0)),
              trustedNowMs,
              settings.cooldownHours
            ),
            message: data.error || 'A little thought has already been opened today.',
          };
        }
        return {
          status: 'concurrent',
          message: data.error || 'Toples sedang dibuka, tunggu sebentar ya.',
        };
      }
      guardAcquired = true;
    }
  } catch {
    trustedNowMs = await fetchJarTrustedServerTimeMs();
  }

  const releaseGuard = async () => {
    if (!guardAcquired) return;
    await fetch('/api/jar/reveal-release', { method: 'POST' }).catch(() => {});
  };

  try {
    const poolSnap = await getDocs(
      query(collection(db, 'jarPool'), where('isApproved', '==', true))
    );
    const pool = poolSnap.docs.map((d) =>
      mapPoolDoc(d.id, d.data() as Record<string, unknown>)
    );

    const candidate = pickRandomUnopenedThought(pool);
    if (!candidate) {
      await releaseGuard();
      return {
        status: 'empty',
        message: 'Belum ada surat baru yang siap dibuka di dalam toples hari ini.',
      };
    }

    const picked = await runTransaction(db, async (tx) => {
      const cooldownRef = doc(db, 'jarState', 'cooldown');
      const thoughtRef = doc(db, 'jarPool', candidate.id);

      const [cooldownDoc, thoughtDoc] = await Promise.all([
        tx.get(cooldownRef),
        tx.get(thoughtRef),
      ]);

      if (cooldownDoc.exists()) {
        const lastMs = timestampToMs(cooldownDoc.data().lastOpenedAt);
        const status = computeCooldownStatus(lastMs, trustedNowMs, settings.cooldownHours);
        if (status.isCoolingDown) {
          throw new Error('__COOLDOWN_ACTIVE__');
        }
      }

      if (!thoughtDoc.exists() || thoughtDoc.data().opened === true) {
        throw new Error('__CONCURRENT_CONFLICT__');
      }

      const prevCount = cooldownDoc.exists()
        ? Number(cooldownDoc.data().totalOpenedCount || 0) || 0
        : 0;

      tx.update(thoughtRef, {
        opened: true,
        openedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (cooldownDoc.exists()) {
        tx.update(cooldownRef, {
          lastOpenedAt: serverTimestamp(),
          lastOpenedThoughtId: candidate.id,
          totalOpenedCount: prevCount + 1,
          updatedAt: serverTimestamp(),
        });
      } else {
        tx.set(cooldownRef, {
          stateId: 'cooldown',
          lastOpenedAt: serverTimestamp(),
          lastOpenedThoughtId: candidate.id,
          totalOpenedCount: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return {
        ...candidate,
        opened: true,
        openedAt: new Date(trustedNowMs).toISOString(),
      };
    });

    await fetch('/api/jar/reveal-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openedAtMs: trustedNowMs }),
    }).catch(() => {});

    return {
      status: 'revealed',
      thought: picked,
      serverNowMs: trustedNowMs,
    };
  } catch (err) {
    await releaseGuard();
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('__COOLDOWN_ACTIVE__') || isPermissionDeniedError(err)) {
      const snap = await fetchWulanJarSnapshot().catch(() => null);
      if (snap?.cooldownStatus.isCoolingDown) {
        return {
          status: 'cooldown',
          cooldownStatus: snap.cooldownStatus,
          message: 'A little thought has already been opened today.',
        };
      }
      return {
        status: 'error',
        message: isPermissionDeniedError(err)
          ? 'Toples pesan sedang disinkronkan. Coba lagi sebentar lagi ya ♡'
          : 'Pesan hari ini sedang menunggu siklus 24 jam selesai.',
      };
    }
    if (msg.includes('__CONCURRENT_CONFLICT__')) {
      return {
        status: 'concurrent',
        message: 'Pesan itu baru saja dibuka di tab atau perangkat lain. Muat ulang sebentar ya.',
      };
    }
    return {
      status: 'error',
      message: 'Gagal membuka surat dari toples. Coba lagi sebentar ya.',
    };
  }
}

// --- Admin Management APIs ---

function mapThoughtSubmissionDoc(id: string, raw: Record<string, unknown>): JarThoughtSubmission {
  return {
    id: String(raw.id || id),
    senderInitial: String(raw.senderInitial || ''),
    isAnonymous: Boolean(raw.isAnonymous),
    message: String(raw.message || ''),
    paperStyle: (raw.paperStyle || 'ivory-linen') as JarPaperStyle,
    status: (raw.status || 'pending') as JarThoughtSubmission['status'],
    opened: Boolean(raw.opened),
    openedAt: timestampToIso(raw.openedAt),
    source: (raw.source || 'public') as JarThoughtSubmission['source'],
    ownerUid: raw.ownerUid ? String(raw.ownerUid) : undefined,
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
  };
}

export function subscribeJarAdminData(
  onUpdate: (data: {
    thoughts: JarThoughtSubmission[];
    cooldownState: JarCooldownState | null;
  }) => void,
  onError: (err: Error) => void
): () => void {
  let rawThoughts: JarThoughtSubmission[] = [];
  let poolMap = new Map<string, JarPoolThought>();
  let cooldownState: JarCooldownState | null = null;

  const emitMerged = () => {
    const merged = rawThoughts
      .map((item) => {
        const poolEntry = poolMap.get(item.id);
        if (!poolEntry) return item;
        return {
          ...item,
          opened: poolEntry.opened,
          openedAt: poolEntry.openedAt || item.openedAt,
        };
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    onUpdate({ thoughts: merged, cooldownState });
  };

  const unsubThoughts = onSnapshot(
    collection(db, 'jarThoughts'),
    (snap) => {
      rawThoughts = snap.docs.map((d) =>
        mapThoughtSubmissionDoc(d.id, d.data() as Record<string, unknown>)
      );
      emitMerged();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'jarThoughts');
      } catch (wrapped) {
        onError(
          new Error(
            formatSafeUiError(
              wrapped,
              'Gagal memuat daftar kiriman pesan toples.',
              'admin'
            )
          )
        );
      }
    }
  );

  const unsubPool = onSnapshot(
    collection(db, 'jarPool'),
    (snap) => {
      const next = new Map<string, JarPoolThought>();
      for (const d of snap.docs) {
        next.set(d.id, mapPoolDoc(d.id, d.data() as Record<string, unknown>));
      }
      poolMap = next;
      emitMerged();
    },
    () => {}
  );

  const unsubCooldown = onSnapshot(
    doc(db, 'jarState', 'cooldown'),
    (snap) => {
      if (snap.exists()) {
        const raw = snap.data();
        cooldownState = {
          stateId: 'cooldown',
          lastOpenedAt: timestampToIso(raw.lastOpenedAt),
          lastOpenedAtMs: timestampToMs(raw.lastOpenedAt),
          lastOpenedThoughtId: String(raw.lastOpenedThoughtId || ''),
          totalOpenedCount:
            typeof raw.totalOpenedCount === 'number' ? raw.totalOpenedCount : 0,
          updatedAt: timestampToIso(raw.updatedAt),
        };
      } else {
        cooldownState = null;
      }
      emitMerged();
    },
    () => {}
  );

  return () => {
    unsubThoughts();
    unsubPool();
    unsubCooldown();
  };
}

export async function approveJarThought(thought: JarThoughtSubmission): Promise<void> {
  requireVerifiedAdmin();
  const displayAuthor = resolveDisplayAuthor({
    senderInitial: thought.senderInitial,
    isAnonymous: thought.isAnonymous,
  });

  const poolRef = doc(db, 'jarPool', thought.id);
  const existingPool = await getDoc(poolRef).catch(() => null);

  const batch = writeBatch(db);
  batch.update(doc(db, 'jarThoughts', thought.id), {
    status: 'approved',
    updatedAt: serverTimestamp(),
  });

  if (existingPool?.exists()) {
    batch.update(poolRef, {
      displayAuthor,
      isAnonymous: thought.isAnonymous,
      message: thought.message,
      paperStyle: thought.paperStyle,
      isApproved: true,
      opened: thought.opened,
      ...(thought.openedAt ? { openedAt: Timestamp.fromDate(new Date(thought.openedAt)) } : {}),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(poolRef, {
      id: thought.id,
      displayAuthor,
      isAnonymous: thought.isAnonymous,
      message: thought.message,
      paperStyle: thought.paperStyle,
      isApproved: true,
      opened: thought.opened,
      ...(thought.openedAt ? { openedAt: Timestamp.fromDate(new Date(thought.openedAt)) } : {}),
      sortSeed: Math.random(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `jarThoughts/${thought.id}`);
  }
}

export async function rejectJarThought(thoughtId: string): Promise<void> {
  requireVerifiedAdmin();
  const batch = writeBatch(db);
  batch.update(doc(db, 'jarThoughts', thoughtId), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
  batch.delete(doc(db, 'jarPool', thoughtId));
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `jarThoughts/${thoughtId}`);
  }
}

export async function deleteJarThought(thoughtId: string): Promise<void> {
  requireVerifiedAdmin();
  const batch = writeBatch(db);
  batch.delete(doc(db, 'jarThoughts', thoughtId));
  batch.delete(doc(db, 'jarPool', thoughtId));
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `jarThoughts/${thoughtId}`);
  }
}

export async function createAdminJarThought(draft: JarSubmissionDraft): Promise<string> {
  const user = requireVerifiedAdmin();
  const validation = validateJarSubmissionInput(draft);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const thoughtId = createThoughtId('jar-admin');
  const displayAuthor = resolveDisplayAuthor({
    senderInitial: validation.data.senderInitial,
    isAnonymous: validation.data.isAnonymous,
  });

  const batch = writeBatch(db);
  batch.set(doc(db, 'jarThoughts', thoughtId), {
    id: thoughtId,
    senderInitial: validation.data.senderInitial,
    isAnonymous: validation.data.isAnonymous,
    message: validation.data.message,
    paperStyle: validation.data.paperStyle,
    status: 'approved',
    opened: false,
    source: 'admin',
    ownerUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'jarPool', thoughtId), {
    id: thoughtId,
    displayAuthor,
    isAnonymous: validation.data.isAnonymous,
    message: validation.data.message,
    paperStyle: validation.data.paperStyle,
    isApproved: true,
    opened: false,
    sortSeed: Math.random(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `jarThoughts/${thoughtId}`);
  }

  return thoughtId;
}

export async function resetJarCooldownAdmin(): Promise<void> {
  const user = requireVerifiedAdmin();
  const idToken = await user.getIdToken();
  await fetch('/api/jar/reset-guard', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  }).catch(() => {});

  const ref = doc(db, 'jarState', 'cooldown');
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'jarState/cooldown');
  }
}
