import type { FirebaseStorage } from 'firebase/storage';
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';

export type UploadScope = 'site-media' | 'wishlist-media' | 'postcard-media';

export interface SharedUploadOptions {
  file: File;
  scope: UploadScope;
  folderOrTargetId: string;
  firebaseStoragePath: string;
  preferredFilename?: string;
  idToken: string;
  storage?: FirebaseStorage;
  storageBucket?: string;
  onProgress?: (percent: number) => void;
  timeoutMs?: number;
  maxRetries?: number;
  // Dependency injection hooks for unit testing
  fetchFn?: typeof fetch;
  xhrFactory?: () => XMLHttpRequest;
  firebaseUploader?: (args: {
    file: File;
    storagePath: string;
    onProgress: (percent: number) => void;
  }) => Promise<string>;
}

export interface SharedUploadResponse {
  url: string;
  storagePath: string;
  filename: string;
  provider: 'firebase-storage' | 'app-server';
}

interface BucketProbeEntry {
  available: boolean;
  checkedAt: number;
}

const bucketProbeCache = new Map<string, BucketProbeEntry>();
const PROBE_CACHE_TTL_MS = 180_000;

export function clearBucketProbeCache(): void {
  bucketProbeCache.clear();
}

export function isFirebaseBucketMissingError(err: unknown): boolean {
  const code = String((err as { code?: string } | null)?.code || '').toLowerCase();
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  return (
    code === 'storage/bucket-not-found' ||
    code === 'storage/project-not-found' ||
    msg.includes('bucket-not-found') ||
    msg.includes('not found') ||
    msg.includes('404') ||
    msg.includes('cors') ||
    msg.includes('preflight') ||
    msg.includes('stall') ||
    msg.includes('retry-limit-exceeded')
  );
}

export function mapUploadErrorMessage(err: unknown, contextLabel = 'file'): string {
  const code = String((err as { code?: string } | null)?.code || '').toLowerCase();
  const msg = err instanceof Error ? err.message : String(err || '');

  if (code === 'storage/unauthorized') {
    return `Akses ditolak oleh aturan Firebase Storage saat mengunggah ${contextLabel}. Pastikan akun Google sudah masuk dan terverifikasi.`;
  }
  if (code === 'storage/unauthenticated') {
    return `Sesi login Google berakhir. Silakan masuk ulang sebelum mengunggah ${contextLabel}.`;
  }
  if (code === 'storage/canceled') {
    return `Unggahan ${contextLabel} dibatalkan.`;
  }
  if (code === 'storage/quota-exceeded') {
    return 'Kuota penyimpanan penuh. Silakan hubungi administrator.';
  }
  if (code === 'storage/retry-limit-exceeded') {
    return `Koneksi unggahan ${contextLabel} melebihi batas waktu. Coba periksa jaringan lalu ulangi.`;
  }

  return msg || `Gagal mengunggah ${contextLabel}.`;
}

export async function probeFirebaseStorageAvailability(
  bucket: string | undefined,
  fetchFn: typeof fetch = fetch
): Promise<{ available: boolean; reason?: string }> {
  const cleanBucket = String(bucket || '').trim();
  if (!cleanBucket) {
    return { available: false, reason: 'missing-bucket-config' };
  }

  const cached = bucketProbeCache.get(cleanBucket);
  if (cached && Date.now() - cached.checkedAt < PROBE_CACHE_TTL_MS) {
    return { available: cached.available, reason: cached.available ? undefined : 'cached-404' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetchFn(
      `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(cleanBucket)}/o?maxResults=1`,
      { method: 'GET', signal: controller.signal }
    );
    // 404 specifically means the Firebase Storage bucket has not been created/enabled.
    // 200, 401, or 403 mean the bucket exists and is reachable.
    const available = res.status !== 404;
    bucketProbeCache.set(cleanBucket, { available, checkedAt: Date.now() });
    return { available, reason: available ? undefined : `http-${res.status}` };
  } catch {
    return { available: false, reason: 'probe-network-error' };
  } finally {
    clearTimeout(timer);
  }
}

export class NonRetryableUploadError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'NonRetryableUploadError';
    this.status = status;
  }
}

async function uploadOnceViaXhr(opts: {
  file: File;
  scope: UploadScope;
  folderOrTargetId: string;
  preferredFilename?: string;
  idToken: string;
  onProgress?: (percent: number) => void;
  timeoutMs: number;
  xhrFactory: () => XMLHttpRequest;
}): Promise<SharedUploadResponse> {
  const form = new FormData();
  form.append('scope', opts.scope);
  if (opts.scope === 'site-media') {
    form.append('folder', opts.folderOrTargetId);
  } else {
    form.append('targetId', opts.folderOrTargetId);
  }
  if (opts.preferredFilename) {
    form.append('preferredFilename', opts.preferredFilename);
  }
  // Append file last so text metadata fields are parsed before file payload
  form.append('file', opts.file, opts.file.name || 'upload.jpg');

  return new Promise<SharedUploadResponse>((resolve, reject) => {
    const xhr = opts.xhrFactory();
    xhr.open('POST', '/api/upload', true);
    xhr.timeout = opts.timeoutMs;
    xhr.setRequestHeader('Authorization', `Bearer ${opts.idToken}`);
    // Do NOT set Content-Type manually: the browser adds multipart/form-data + boundary automatically.

    if (xhr.upload) {
      xhr.upload.onprogress = (event: ProgressEvent) => {
        if (!opts.onProgress) return;
        const total =
          event.lengthComputable && event.total > 0 ? event.total : opts.file.size;
        if (total > 0) {
          const pct = Math.min(99, Math.max(0, Math.round((event.loaded / total) * 100)));
          opts.onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      let parsed: {
        ok?: boolean;
        url?: string;
        storagePath?: string;
        filename?: string;
        error?: string;
      } = {};
      try {
        parsed = JSON.parse(xhr.responseText || '{}');
      } catch {
        parsed = {};
      }

      if (xhr.status >= 200 && xhr.status < 300 && parsed.ok && parsed.url) {
        opts.onProgress?.(100);
        resolve({
          url: parsed.url,
          storagePath: parsed.storagePath || '',
          filename: parsed.filename || opts.file.name,
          provider: 'app-server',
        });
        return;
      }

      const serverMsg =
        parsed.error || `Server menolak unggahan (HTTP ${xhr.status}).`;
      if (xhr.status >= 400 && xhr.status < 500 && xhr.status !== 408 && xhr.status !== 429) {
        reject(new NonRetryableUploadError(serverMsg, xhr.status));
        return;
      }
      reject(new Error(serverMsg));
    };

    xhr.onerror = () => {
      reject(new Error('Koneksi jaringan terputus saat mengunggah file.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Waktu unggahan habis. Coba ulangi pada koneksi yang lebih stabil.'));
    };

    xhr.send(form);
  });
}

export async function uploadViaExpressEndpoint(opts: {
  file: File;
  scope: UploadScope;
  folderOrTargetId: string;
  preferredFilename?: string;
  idToken: string;
  onProgress?: (percent: number) => void;
  timeoutMs?: number;
  maxRetries?: number;
  xhrFactory?: () => XMLHttpRequest;
}): Promise<SharedUploadResponse> {
  const defaultTimeout = opts.file.size > 15 * 1024 * 1024 ? 300_000 : 120_000;
  const timeoutMs = opts.timeoutMs ?? defaultTimeout;
  const maxRetries = opts.maxRetries ?? 2;
  const xhrFactory = opts.xhrFactory ?? (() => new XMLHttpRequest());

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        opts.onProgress?.(0);
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
      return await uploadOnceViaXhr({
        file: opts.file,
        scope: opts.scope,
        folderOrTargetId: opts.folderOrTargetId,
        preferredFilename: opts.preferredFilename,
        idToken: opts.idToken,
        onProgress: opts.onProgress,
        timeoutMs,
        xhrFactory,
      });
    } catch (err) {
      lastErr = err;
      if (err instanceof NonRetryableUploadError) {
        throw err;
      }
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error('Gagal mengunggah file setelah beberapa percobaan.');
}

async function uploadViaFirebaseWithWatchdog(opts: {
  storage: FirebaseStorage;
  storagePath: string;
  file: File;
  onProgress?: (percent: number) => void;
  stallTimeoutMs?: number;
}): Promise<string> {
  // Prevent Firebase SDK from hanging 10 minutes on CORS/404 network failures
  opts.storage.maxUploadRetryTime = 20_000;
  opts.storage.maxOperationRetryTime = 15_000;

  const ref = storageRef(opts.storage, opts.storagePath);
  const task = uploadBytesResumable(ref, opts.file, {
    contentType: opts.file.type || undefined,
  });

  const stallMs = opts.stallTimeoutMs ?? 20_000;

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let lastBytes = 0;
    let watchdog = setTimeout(() => {
      if (settled) return;
      settled = true;
      task.cancel();
      reject(new Error('Upload Firebase Storage stalled at 0% (timeout).'));
    }, stallMs);

    const resetWatchdog = (nextMs: number) => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        if (settled) return;
        settled = true;
        task.cancel();
        reject(new Error('Upload Firebase Storage stalled (timeout).'));
      }, nextMs);
    };

    task.on(
      'state_changed',
      (snap) => {
        if (snap.bytesTransferred > lastBytes) {
          lastBytes = snap.bytesTransferred;
          resetWatchdog(45_000);
        }
        if (opts.onProgress && snap.totalBytes > 0) {
          opts.onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        reject(error);
      },
      async () => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          opts.onProgress?.(100);
          resolve(url);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Gagal mengambil URL unduhan.'));
        }
      }
    );
  });
}

export async function executeSharedUpload(
  opts: SharedUploadOptions
): Promise<SharedUploadResponse> {
  const fetchFn = opts.fetchFn ?? fetch;
  opts.onProgress?.(0);

  // 1. Check whether Firebase Storage bucket is actually provisioned & reachable
  const probe = opts.firebaseUploader
    ? { available: true }
    : await probeFirebaseStorageAvailability(opts.storageBucket, fetchFn);

  if (probe.available && (opts.firebaseUploader || opts.storage)) {
    try {
      const url = opts.firebaseUploader
        ? await opts.firebaseUploader({
            file: opts.file,
            storagePath: opts.firebaseStoragePath,
            onProgress: (pct) => opts.onProgress?.(pct),
          })
        : await uploadViaFirebaseWithWatchdog({
            storage: opts.storage!,
            storagePath: opts.firebaseStoragePath,
            file: opts.file,
            onProgress: opts.onProgress,
          });

      const filename =
        opts.firebaseStoragePath.split('/').pop() || opts.file.name || 'upload';
      return {
        url,
        storagePath: opts.firebaseStoragePath,
        filename,
        provider: 'firebase-storage',
      };
    } catch (err) {
      // Only fall back to /api/upload when Firebase Storage bucket is missing/blocked;
      // surface real permission/auth errors directly.
      if (!isFirebaseBucketMissingError(err)) {
        throw new Error(mapUploadErrorMessage(err));
      }
    }
  }

  // 2. Fallback / Active App Server Upload Route (/api/upload)
  return uploadViaExpressEndpoint({
    file: opts.file,
    scope: opts.scope,
    folderOrTargetId: opts.folderOrTargetId,
    preferredFilename: opts.preferredFilename,
    idToken: opts.idToken,
    onProgress: opts.onProgress,
    timeoutMs: opts.timeoutMs,
    maxRetries: opts.maxRetries,
    xhrFactory: opts.xhrFactory,
  });
}
