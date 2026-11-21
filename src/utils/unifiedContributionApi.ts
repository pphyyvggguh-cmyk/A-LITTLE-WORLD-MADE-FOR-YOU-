import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import type { JarPaperStyle, JarThoughtSubmission } from '../data/jarOfThoughts';
import {
  VOICE_SUBMISSION_LIMITS,
  type UnifiedContributionBatch,
  type VoiceFlowerType,
  type VoiceSubmissionRecord,
} from '../data/voices';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { resolveDisplayAuthor, type JarSubmissionDraft } from './jarOfThoughts';
import { fetchJarSettings } from './jarApi';
import { formatSafeUiError, PUBLIC_JAR_SUBMIT_ERROR } from './safeError';
import {
  buildApprovedVoicePayloadFromSubmission,
  clampFlowerQuantity,
  evaluateUnifiedContributionSubmission,
  validatePublicAudioFileMeta,
  type ConsentChoice,
  type VoiceContributionDraft,
} from './unifiedContribution';
import { isAuthorizedAdminEmail } from './wishlist';

export interface UnifiedContributionBundle {
  batch: UnifiedContributionBatch;
  jarThought: JarThoughtSubmission | null;
  voiceSubmission: VoiceSubmissionRecord | null;
}

export interface UploadedPublicAudioResult {
  url: string;
  storagePath: string;
  filename: string;
  sizeBytes: number;
}

function timestampToIso(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return '';
}

function createId(prefix: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function requireVerifiedAdmin() {
  const user = auth.currentUser;
  if (!user || !isAuthorizedAdminEmail(user.email, user.emailVerified)) {
    throw new Error('Akses ditolak: harap masuk dengan akun admin terverifikasi.');
  }
  return user;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.startsWith('data:')) {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal memproses berkas audio.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca data audio lokal.'));
    reader.readAsDataURL(blob);
  });
}

export async function uploadPublicVoiceAudio(
  audioBlob: Blob,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<UploadedPublicAudioResult> {
  const cleanName = (fileName || 'voice-note.webm').trim() || 'voice-note.webm';
  const check = validatePublicAudioFileMeta(cleanName, audioBlob.type || '', audioBlob.size);
  if (!check.ok) {
    throw new Error(check.error);
  }

  // Try server endpoint first (handles up to 15 MB across MP3/OGG/WEBM/M4A/WAV)
  try {
    const serverUpload = await new Promise<UploadedPublicAudioResult | null>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', audioBlob, cleanName);

      xhr.open('POST', '/api/contributions/upload-audio');
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && onProgress) {
          const pct = Math.min(96, Math.round((ev.loaded / ev.total) * 100));
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        const contentType = (xhr.getResponseHeader('content-type') || '').toLowerCase();
        if (!contentType.includes('application/json')) {
          resolve(null);
          return;
        }
        try {
          const payload = JSON.parse(xhr.responseText) as {
            ok?: boolean;
            url?: string;
            storagePath?: string;
            filename?: string;
            sizeBytes?: number;
            error?: string;
          };
          if (xhr.status >= 200 && xhr.status < 300 && payload.ok && payload.url) {
            onProgress?.(100);
            resolve({
              url: payload.url,
              storagePath: payload.storagePath || '',
              filename: payload.filename || cleanName,
              sizeBytes: payload.sizeBytes || audioBlob.size,
            });
            return;
          }
          if (xhr.status === 400 || xhr.status === 413 || xhr.status === 429) {
            reject(new Error(payload.error || 'Gagal mengunggah rekaman suara.'));
            return;
          }
          resolve(null);
        } catch {
          resolve(null);
        }
      };

      xhr.onerror = () => resolve(null);
      xhr.send(formData);
    });

    if (serverUpload) {
      return serverUpload;
    }
  } catch (err) {
    if (err instanceof Error && (err.message.includes('maksimal') || err.message.includes('Format') || err.message.includes('Terlalu banyak'))) {
      throw err;
    }
  }

  // Graceful fallback for static serverless deployments without /api/*:
  // Embed compact recording inside admin-only voiceSubmissions doc (max 650 KB binary -> <= 900 KB base64)
  if (audioBlob.size <= VOICE_SUBMISSION_LIMITS.AUDIO_STATIC_FALLBACK_MAX_BYTES) {
    onProgress?.(60);
    const dataUrl = await blobToDataUrl(audioBlob);
    if (dataUrl.length <= 940000) {
      onProgress?.(100);
      return {
        url: dataUrl,
        storagePath: '',
        filename: cleanName.slice(0, 180),
        sizeBytes: audioBlob.size,
      };
    }
  }

  throw new Error(
    'Server unggahan audio sedang tidak terjangkau dan ukuran file melebihi batas cadangan (650 KB). Rekam ulang singkat (maks. ~45 detik) atau kompres audio terlebih dahulu ya.'
  );
}

export async function submitUnifiedContribution(input: {
  jarDraft: JarSubmissionDraft;
  voiceDraft: VoiceContributionDraft;
  audioBlob: Blob | null;
  consent: ConsentChoice;
  onAudioProgress?: (percent: number) => void;
}): Promise<
  | { submitted: false; reason: 'declined' }
  | {
      submitted: true;
      submissionId: string;
      jarThoughtId: string;
      voiceSubmissionId: string;
      serverTimeMs: number;
    }
> {
  const decision = evaluateUnifiedContributionSubmission({
    jarDraft: input.jarDraft,
    voiceDraft: input.voiceDraft,
    consent: input.consent,
  });

  if (!decision.shouldSubmit) {
    if (decision.reason === 'declined') {
      return { submitted: false, reason: 'declined' };
    }
    throw new Error(decision.error || 'Lengkapi kedua bagian formulir terlebih dahulu.');
  }

  if (!input.audioBlob || input.audioBlob.size <= 0) {
    throw new Error('Rekaman suara atau file audio belum dipilih untuk Voices of Love.');
  }

  const settings = await fetchJarSettings();
  if (!settings.enabled) {
    throw new Error('Halaman kiriman pesan & suara untuk Wulan saat ini sedang ditutup sementara.');
  }

  let jarData = decision.jarData;
  let voiceData = decision.voiceData;
  let screening = decision.screening;
  let serverTimeMs = Date.now();

  try {
    const screenRes = await fetch('/api/contributions/screen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jarDraft: input.jarDraft,
        voiceDraft: input.voiceDraft,
        consent: input.consent,
      }),
    });
    const contentType = screenRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = (await screenRes.json()) as {
        ok?: boolean;
        error?: string;
        jarData?: typeof jarData;
        voiceData?: typeof voiceData;
        screening?: typeof screening;
        serverTimeMs?: number;
      };
      if (!screenRes.ok) {
        throw new Error(payload.error || 'Kontribusi belum dapat dikirim saat ini.');
      }
      if (payload.jarData) jarData = payload.jarData;
      if (payload.voiceData) voiceData = payload.voiceData;
      if (payload.screening) screening = payload.screening;
      if (typeof payload.serverTimeMs === 'number') serverTimeMs = payload.serverTimeMs;
    }
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes('sama persis') ||
        err.message.includes('beruntun') ||
        err.message.includes('tidak pantas') ||
        err.message.includes('tidak diizinkan') ||
        err.message.includes('Kontribusi belum'))
    ) {
      throw err;
    }
  }

  const uploadedAudio = await uploadPublicVoiceAudio(
    input.audioBlob,
    voiceData.audioFileName,
    input.onAudioProgress
  );

  const submissionId = createId('sub');
  const jarThoughtId = createId('jar');
  const screeningStatus: 'clean' | 'flagged' = screening.severity === 'flagged' ? 'flagged' : 'clean';
  const screeningFlags = screening.flags.slice(0, 12);

  try {
    const batch = writeBatch(db);

    batch.set(doc(db, 'jarThoughts', jarThoughtId), {
      id: jarThoughtId,
      senderInitial: jarData.senderInitial,
      isAnonymous: jarData.isAnonymous,
      message: jarData.message,
      paperStyle: jarData.paperStyle,
      status: 'pending',
      opened: false,
      source: 'public',
      submissionId,
      consentConfirmed: true,
      screeningStatus,
      screeningFlags,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'voiceSubmissions', submissionId), {
      id: submissionId,
      submissionId,
      senderName: voiceData.senderName,
      flowerType: voiceData.flowerType,
      flowerQuantity: clampFlowerQuantity(voiceData.flowerQuantity),
      caption: voiceData.caption,
      audioUrl: uploadedAudio.url,
      ...(uploadedAudio.storagePath ? { audioStoragePath: uploadedAudio.storagePath } : {}),
      audioFileName: uploadedAudio.filename || voiceData.audioFileName,
      audioDurationSec: voiceData.audioDurationSec,
      status: 'pending',
      consentConfirmed: true,
      screeningStatus,
      screeningFlags,
      source: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'contributionBatches', submissionId), {
      id: submissionId,
      submissionId,
      jarThoughtId,
      voiceSubmissionId: submissionId,
      contributorLabel: voiceData.senderName,
      consentConfirmed: true,
      screeningStatus,
      screeningFlags,
      source: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (err) {
    if (import.meta.env.DEV) {
      try {
        handleFirestoreError(err, OperationType.CREATE, `contributionBatches/${submissionId}`);
      } catch {
        // Logged in dev only
      }
    }
    throw new Error(PUBLIC_JAR_SUBMIT_ERROR);
  }

  return {
    submitted: true,
    submissionId,
    jarThoughtId,
    voiceSubmissionId: submissionId,
    serverTimeMs,
  };
}

// --- Control Room Moderation API ---

function mapThoughtDoc(id: string, raw: Record<string, unknown>): JarThoughtSubmission {
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
    submissionId: raw.submissionId ? String(raw.submissionId) : undefined,
    consentConfirmed: raw.consentConfirmed !== undefined ? Boolean(raw.consentConfirmed) : undefined,
    screeningStatus: raw.screeningStatus === 'flagged' ? 'flagged' : 'clean',
    screeningFlags: Array.isArray(raw.screeningFlags) ? (raw.screeningFlags as string[]) : [],
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
  };
}

function mapVoiceSubmissionDoc(id: string, raw: Record<string, unknown>): VoiceSubmissionRecord {
  return {
    id: String(raw.id || id),
    submissionId: String(raw.submissionId || id),
    senderName: String(raw.senderName || ''),
    flowerType: (raw.flowerType || 'sakura') as VoiceFlowerType,
    flowerQuantity: clampFlowerQuantity(raw.flowerQuantity),
    caption: String(raw.caption || ''),
    audioUrl: String(raw.audioUrl || ''),
    audioStoragePath: raw.audioStoragePath ? String(raw.audioStoragePath) : '',
    audioFileName: String(raw.audioFileName || 'voice-note.webm'),
    audioDurationSec: typeof raw.audioDurationSec === 'number' ? raw.audioDurationSec : 0,
    status: (raw.status || 'pending') as VoiceSubmissionRecord['status'],
    consentConfirmed: Boolean(raw.consentConfirmed),
    screeningStatus: raw.screeningStatus === 'flagged' ? 'flagged' : 'clean',
    screeningFlags: Array.isArray(raw.screeningFlags) ? (raw.screeningFlags as string[]) : [],
    publishedVoiceId: raw.publishedVoiceId ? String(raw.publishedVoiceId) : undefined,
    source: 'public',
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
  };
}

function mapBatchDoc(id: string, raw: Record<string, unknown>): UnifiedContributionBatch {
  return {
    id: String(raw.id || id),
    submissionId: String(raw.submissionId || id),
    jarThoughtId: String(raw.jarThoughtId || ''),
    voiceSubmissionId: String(raw.voiceSubmissionId || ''),
    contributorLabel: String(raw.contributorLabel || ''),
    consentConfirmed: Boolean(raw.consentConfirmed),
    screeningStatus: raw.screeningStatus === 'flagged' ? 'flagged' : 'clean',
    screeningFlags: Array.isArray(raw.screeningFlags) ? (raw.screeningFlags as string[]) : [],
    source: 'public',
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
  };
}

export function subscribeUnifiedContributions(
  onUpdate: (bundles: UnifiedContributionBundle[]) => void,
  onError: (err: Error) => void
): () => void {
  let batches: UnifiedContributionBatch[] = [];
  let thoughtsMap = new Map<string, JarThoughtSubmission>();
  let voicesMap = new Map<string, VoiceSubmissionRecord>();

  const emitMerged = () => {
    const merged: UnifiedContributionBundle[] = batches
      .map((batch) => ({
        batch,
        jarThought: thoughtsMap.get(batch.jarThoughtId) || null,
        voiceSubmission: voicesMap.get(batch.voiceSubmissionId) || null,
      }))
      .sort((a, b) => (b.batch.createdAt || '').localeCompare(a.batch.createdAt || ''));

    onUpdate(merged);
  };

  const unsubBatches = onSnapshot(
    collection(db, 'contributionBatches'),
    (snap) => {
      batches = snap.docs.map((d) => mapBatchDoc(d.id, d.data() as Record<string, unknown>));
      emitMerged();
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'contributionBatches');
      } catch (wrapped) {
        onError(new Error(formatSafeUiError(wrapped, 'Gagal memuat daftar kontribusi gabungan.', 'admin')));
      }
    }
  );

  const unsubThoughts = onSnapshot(
    collection(db, 'jarThoughts'),
    (snap) => {
      const next = new Map<string, JarThoughtSubmission>();
      for (const d of snap.docs) {
        next.set(d.id, mapThoughtDoc(d.id, d.data() as Record<string, unknown>));
      }
      thoughtsMap = next;
      emitMerged();
    },
    () => {}
  );

  const unsubVoices = onSnapshot(
    collection(db, 'voiceSubmissions'),
    (snap) => {
      const next = new Map<string, VoiceSubmissionRecord>();
      for (const d of snap.docs) {
        next.set(d.id, mapVoiceSubmissionDoc(d.id, d.data() as Record<string, unknown>));
      }
      voicesMap = next;
      emitMerged();
    },
    () => {}
  );

  return () => {
    unsubBatches();
    unsubThoughts();
    unsubVoices();
  };
}

async function getNextVoiceOrder(): Promise<number> {
  const snap = await getDocs(collection(db, 'voices'));
  let maxOrder = 0;
  for (const d of snap.docs) {
    const ord = Number(d.data()?.order || 0);
    if (Number.isFinite(ord) && ord > maxOrder) maxOrder = ord;
  }
  return maxOrder + 1;
}

export async function approveVoiceSubmissionAdmin(sub: VoiceSubmissionRecord): Promise<string> {
  const user = requireVerifiedAdmin();
  const publishedId = sub.publishedVoiceId || `voice-${sub.submissionId}`;
  const voiceRef = doc(db, 'voices', publishedId);
  const existingVoice = await getDoc(voiceRef).catch(() => null);
  const nextOrder = existingVoice?.exists()
    ? Number(existingVoice.data()?.order || 1)
    : await getNextVoiceOrder();

  const voicePayload = buildApprovedVoicePayloadFromSubmission(sub, nextOrder, publishedId);
  const batch = writeBatch(db);

  if (existingVoice?.exists()) {
    batch.update(voiceRef, {
      name: voicePayload.name,
      flowerType: voicePayload.flowerType,
      flowerQuantity: voicePayload.flowerQuantity,
      audioUrl: voicePayload.audioUrl,
      audioFileName: voicePayload.audioFileName,
      message: voicePayload.message,
      order: voicePayload.order,
      permissionConfirmed: true,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(voiceRef, {
      ...voicePayload,
      ownerUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  batch.update(doc(db, 'voiceSubmissions', sub.id), {
    status: 'approved',
    publishedVoiceId: publishedId,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `voiceSubmissions/${sub.id}`);
  }
  return publishedId;
}

export async function rejectVoiceSubmissionAdmin(sub: VoiceSubmissionRecord): Promise<void> {
  requireVerifiedAdmin();
  const batch = writeBatch(db);
  batch.update(doc(db, 'voiceSubmissions', sub.id), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
  if (sub.publishedVoiceId) {
    batch.delete(doc(db, 'voices', sub.publishedVoiceId));
  }
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `voiceSubmissions/${sub.id}`);
  }
}

export async function approveUnifiedBundleAdmin(bundle: UnifiedContributionBundle): Promise<void> {
  const user = requireVerifiedAdmin();
  const batch = writeBatch(db);

  if (bundle.jarThought) {
    const thought = bundle.jarThought;
    const displayAuthor = resolveDisplayAuthor({
      senderInitial: thought.senderInitial,
      isAnonymous: thought.isAnonymous,
    });
    const poolRef = doc(db, 'jarPool', thought.id);
    const existingPool = await getDoc(poolRef).catch(() => null);

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
        sortSeed: Math.random(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  if (bundle.voiceSubmission) {
    const sub = bundle.voiceSubmission;
    const publishedId = sub.publishedVoiceId || `voice-${sub.submissionId}`;
    const voiceRef = doc(db, 'voices', publishedId);
    const existingVoice = await getDoc(voiceRef).catch(() => null);
    const nextOrder = existingVoice?.exists()
      ? Number(existingVoice.data()?.order || 1)
      : await getNextVoiceOrder();
    const voicePayload = buildApprovedVoicePayloadFromSubmission(sub, nextOrder, publishedId);

    if (existingVoice?.exists()) {
      batch.update(voiceRef, {
        name: voicePayload.name,
        flowerType: voicePayload.flowerType,
        flowerQuantity: voicePayload.flowerQuantity,
        audioUrl: voicePayload.audioUrl,
        audioFileName: voicePayload.audioFileName,
        message: voicePayload.message,
        order: voicePayload.order,
        permissionConfirmed: true,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(voiceRef, {
        ...voicePayload,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.update(doc(db, 'voiceSubmissions', sub.id), {
      status: 'approved',
      publishedVoiceId: publishedId,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `contributionBatches/${bundle.batch.id}`);
  }
}

export async function rejectUnifiedBundleAdmin(bundle: UnifiedContributionBundle): Promise<void> {
  requireVerifiedAdmin();
  const batch = writeBatch(db);

  if (bundle.jarThought) {
    batch.update(doc(db, 'jarThoughts', bundle.jarThought.id), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
    batch.delete(doc(db, 'jarPool', bundle.jarThought.id));
  }

  if (bundle.voiceSubmission) {
    batch.update(doc(db, 'voiceSubmissions', bundle.voiceSubmission.id), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
    if (bundle.voiceSubmission.publishedVoiceId) {
      batch.delete(doc(db, 'voices', bundle.voiceSubmission.publishedVoiceId));
    }
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `contributionBatches/${bundle.batch.id}`);
  }
}

export async function deleteUnifiedBundleAdmin(bundle: UnifiedContributionBundle): Promise<void> {
  const user = requireVerifiedAdmin();
  const batch = writeBatch(db);

  if (bundle.batch.jarThoughtId) {
    batch.delete(doc(db, 'jarThoughts', bundle.batch.jarThoughtId));
    batch.delete(doc(db, 'jarPool', bundle.batch.jarThoughtId));
  }
  if (bundle.batch.voiceSubmissionId) {
    batch.delete(doc(db, 'voiceSubmissions', bundle.batch.voiceSubmissionId));
  }
  if (bundle.voiceSubmission?.publishedVoiceId) {
    batch.delete(doc(db, 'voices', bundle.voiceSubmission.publishedVoiceId));
  }
  batch.delete(doc(db, 'contributionBatches', bundle.batch.id));

  try {
    await batch.commit();
    const storagePath = bundle.voiceSubmission?.audioStoragePath || '';
    if (storagePath.startsWith('app-server/uploads/voices-pending/')) {
      const idToken = await user.getIdToken();
      await fetch(`/api/contributions/audio?storagePath=${encodeURIComponent(storagePath)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      }).catch(() => {});
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `contributionBatches/${bundle.batch.id}`);
  }
}
