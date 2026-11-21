import fs from 'node:fs';
import path from 'node:path';

export interface FirebaseRestConfig {
  apiKey?: string;
  projectId?: string;
  firestoreDatabaseId?: string;
}

const VALID_BLOB_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
const ALLOWED_SERVED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/ogg',
]);

export function loadFirebaseRestConfig(): FirebaseRestConfig {
  const candidates = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    new URL('../../firebase-applet-config.json', import.meta.url).pathname,
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return JSON.parse(fs.readFileSync(candidate, 'utf8')) as FirebaseRestConfig;
      }
    } catch {
      // Try next candidate
    }
  }
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID || 'hazel-star-k6gf7',
    firestoreDatabaseId:
      process.env.FIREBASE_DATABASE_ID ||
      'ai-studio-alittleworldmade-6e487d0e-75d1-415f-bae0-c4143ab96438',
  };
}

export interface MediaBlobServeResult {
  status: number;
  mimeType: string;
  buffer?: Buffer;
  cacheControl?: string;
  error?: string;
}

export async function fetchPublicMediaBlob(input: {
  id: string;
  fetchImpl?: typeof fetch;
  config?: FirebaseRestConfig;
}): Promise<MediaBlobServeResult> {
  const cleanId = String(input.id || '').trim();
  if (!VALID_BLOB_ID_RE.test(cleanId)) {
    return { status: 400, mimeType: 'application/json', error: 'Invalid media ID.' };
  }

  const cfg = input.config ?? loadFirebaseRestConfig();
  const projectId = String(cfg.projectId || '').trim();
  const databaseId = String(cfg.firestoreDatabaseId || '(default)').trim();
  const apiKey = String(cfg.apiKey || '').trim();

  if (!projectId || !apiKey) {
    return {
      status: 500,
      mimeType: 'application/json',
      error: 'Firebase configuration missing on server.',
    };
  }

  const fetchFn = input.fetchImpl ?? fetch;
  const endpoint =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/databases/${encodeURIComponent(databaseId)}/documents/mediaBlobs/${encodeURIComponent(cleanId)}` +
    `?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetchFn(endpoint, { method: 'GET' });
    if (res.status === 404) {
      return { status: 404, mimeType: 'application/json', error: 'Media not found.' };
    }
    if (res.status === 403 || res.status === 401) {
      return { status: 403, mimeType: 'application/json', error: 'Media is private.' };
    }
    if (!res.ok) {
      return {
        status: 502,
        mimeType: 'application/json',
        error: `Upstream Firestore returned HTTP ${res.status}.`,
      };
    }

    const doc = (await res.json()) as {
      fields?: {
        isPublic?: { booleanValue?: boolean };
        mimeType?: { stringValue?: string };
        dataBase64?: { stringValue?: string };
      };
    };

    const isPublic = doc.fields?.isPublic?.booleanValue === true;
    if (!isPublic) {
      return { status: 403, mimeType: 'application/json', error: 'Media is private.' };
    }

    const mimeType = String(doc.fields?.mimeType?.stringValue || '').toLowerCase();
    const b64 = String(doc.fields?.dataBase64?.stringValue || '');

    if (!ALLOWED_SERVED_MIMES.has(mimeType) || !b64) {
      return {
        status: 422,
        mimeType: 'application/json',
        error: 'Stored media payload is invalid or unsupported.',
      };
    }

    const buffer = Buffer.from(b64, 'base64');
    if (buffer.length === 0) {
      return {
        status: 422,
        mimeType: 'application/json',
        error: 'Stored media buffer is empty.',
      };
    }

    return {
      status: 200,
      mimeType,
      buffer,
      cacheControl: 'public, max-age=31536000, immutable',
    };
  } catch {
    return {
      status: 502,
      mimeType: 'application/json',
      error: 'Failed to retrieve media from cloud storage.',
    };
  }
}
