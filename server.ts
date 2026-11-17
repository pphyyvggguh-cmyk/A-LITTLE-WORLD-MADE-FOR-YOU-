import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import {
  sanitizeUploadBasename,
  validateMediaFilenameAndType,
} from './src/utils/adminContent.ts';

dotenv.config();

const IS_PROD = process.env.NODE_ENV === 'production';
const rawPort = process.env.NGINX_PORT
  ? process.env.DEFAULT_APP_PORT || 3000
  : process.env.PORT || 3000;
const parsedPort = Number(rawPort);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'assets', 'uploads');
const PRIMARY_ADMIN_EMAIL = 'oktafmbul0@gmail.com';
const MAX_SITE_MEDIA_BYTES = 55 * 1024 * 1024;
const MAX_IMAGE_ONLY_BYTES = 15 * 1024 * 1024;

interface FirebaseConfigLite {
  apiKey?: string;
  projectId?: string;
}

function loadFirebaseConfig(): FirebaseConfigLite {
  try {
    const raw = fs.readFileSync(path.join(ROOT_DIR, 'firebase-applet-config.json'), 'utf8');
    return JSON.parse(raw) as FirebaseConfigLite;
  } catch {
    return {};
  }
}

interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

const tokenCache = new Map<string, { user: VerifiedFirebaseUser; expiresAt: number }>();

async function verifyFirebaseBearerToken(
  authHeader: string | undefined,
  apiKey: string | undefined
): Promise<VerifiedFirebaseUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ') || !apiKey) {
    return null;
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken || idToken.length < 20) {
    return null;
  }

  const hash = crypto.createHash('sha256').update(idToken).digest('hex');
  const now = Date.now();
  const cached = tokenCache.get(hash);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
      }>;
    };
    const account = data.users?.[0];
    if (!account?.localId || !account?.email) {
      return null;
    }
    const verifiedUser: VerifiedFirebaseUser = {
      uid: String(account.localId),
      email: String(account.email).toLowerCase(),
      emailVerified: Boolean(account.emailVerified),
    };
    tokenCache.set(hash, { user: verifiedUser, expiresAt: now + 30_000 });
    return verifiedUser;
  } catch {
    return null;
  }
}

function sanitizePathSegment(raw: string, fallback: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return cleaned || fallback;
}

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SITE_MEDIA_BYTES,
    files: 1,
  },
});

async function startServer() {
  await fsp.mkdir(UPLOADS_DIR, { recursive: true });
  const firebaseCfg = loadFirebaseConfig();

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // Static public assets with clean byte-range support (audio/video/photos/uploads)
  app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets')));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, mode: 'firebase', uploadReady: true });
  });

  app.get('/api/time', (_req, res) => {
    const nowMs = Date.now();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      serverTimeMs: nowMs,
      iso: new Date(nowMs).toISOString(),
    });
  });

  app.post('/api/upload', (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware.single('file')(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({
            ok: false,
            error: 'Ukuran file melebihi batas maksimal 55 MB.',
          });
          return;
        }
        res.status(400).json({
          ok: false,
          error: err instanceof Error ? err.message : 'Gagal membaca file unggahan.',
        });
        return;
      }
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      const verified = await verifyFirebaseBearerToken(
        req.headers.authorization,
        firebaseCfg.apiKey
      );
      if (!verified) {
        res.status(401).json({
          ok: false,
          error: 'Sesi Google tidak valid atau sudah kedaluwarsa. Silakan masuk ulang.',
        });
        return;
      }
      if (!verified.emailVerified) {
        res.status(403).json({
          ok: false,
          error: 'Akun Google harus terverifikasi sebelum mengunggah file.',
        });
        return;
      }

      const file = req.file;
      if (!file || !file.buffer || file.size <= 0) {
        res.status(400).json({
          ok: false,
          error: 'File unggahan tidak ditemukan atau kosong.',
        });
        return;
      }

      const rawScope = String(req.body?.scope || 'site-media').trim();
      const scope =
        rawScope === 'wishlist-media' || rawScope === 'postcard-media'
          ? rawScope
          : 'site-media';

      if (scope === 'site-media' && verified.email !== PRIMARY_ADMIN_EMAIL) {
        res.status(403).json({
          ok: false,
          error: 'Hanya administrator terverifikasi yang dapat mengunggah aset situs.',
        });
        return;
      }

      if (scope !== 'site-media' && file.size > MAX_IMAGE_ONLY_BYTES) {
        res.status(413).json({
          ok: false,
          error: 'Ukuran foto maksimal 15 MB.',
        });
        return;
      }

      const expectedKind = scope === 'site-media' ? undefined : 'image';
      const check = validateMediaFilenameAndType(
        file.originalname || 'upload',
        file.mimetype || '',
        expectedKind
      );
      if (!check.ok) {
        res.status(400).json({ ok: false, error: check.error });
        return;
      }

      const subFolder =
        scope === 'site-media'
          ? sanitizePathSegment(
              String(req.body?.folder || ''),
              check.kind === 'image'
                ? 'images'
                : check.kind === 'audio'
                  ? 'audio'
                  : 'videos'
            )
          : sanitizePathSegment(String(req.body?.targetId || ''), 'shared');

      const requestedFilename = String(req.body?.preferredFilename || '').trim();
      let storedFilename: string;
      if (
        requestedFilename &&
        /^[a-z0-9][a-z0-9._-]{1,120}$/i.test(requestedFilename) &&
        requestedFilename.toLowerCase().endsWith(check.ext)
      ) {
        storedFilename = requestedFilename;
      } else {
        const safeBase = sanitizeUploadBasename(file.originalname || 'asset');
        const stamp = Date.now().toString(36);
        const rand = crypto.randomBytes(2).toString('hex');
        storedFilename = `${safeBase}-${stamp}-${rand}${check.ext}`;
      }

      const targetDir = path.resolve(UPLOADS_DIR, scope, subFolder);
      if (!targetDir.startsWith(UPLOADS_DIR + path.sep)) {
        res.status(400).json({ ok: false, error: 'Lokasi penyimpanan tidak valid.' });
        return;
      }
      await fsp.mkdir(targetDir, { recursive: true });

      const targetFile = path.resolve(targetDir, storedFilename);
      if (!targetFile.startsWith(targetDir + path.sep)) {
        res.status(400).json({ ok: false, error: 'Nama file unggahan tidak valid.' });
        return;
      }

      await fsp.writeFile(targetFile, file.buffer);

      const publicUrl = `/assets/uploads/${scope}/${subFolder}/${storedFilename}`;
      const storagePath = `app-server/uploads/${scope}/${subFolder}/${storedFilename}`;

      res.status(201).json({
        ok: true,
        url: publicUrl,
        storagePath,
        filename: storedFilename,
        kind: check.kind,
        sizeBytes: file.size,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan unggahan.',
      });
    }
  });

  app.delete('/api/upload', async (req: Request, res: Response) => {
    try {
      const verified = await verifyFirebaseBearerToken(
        req.headers.authorization,
        firebaseCfg.apiKey
      );
      if (!verified || !verified.emailVerified || verified.email !== PRIMARY_ADMIN_EMAIL) {
        res.status(403).json({
          ok: false,
          error: 'Hanya administrator terverifikasi yang dapat menghapus file.',
        });
        return;
      }

      const rawStoragePath = String(
        req.body?.storagePath || req.query?.storagePath || ''
      ).trim();
      if (!rawStoragePath.startsWith('app-server/uploads/')) {
        res.json({ ok: true, skipped: true });
        return;
      }

      const relative = rawStoragePath.slice('app-server/uploads/'.length);
      const targetFile = path.resolve(UPLOADS_DIR, relative);
      if (!targetFile.startsWith(UPLOADS_DIR + path.sep)) {
        res.status(400).json({ ok: false, error: 'Path file tidak valid.' });
        return;
      }

      await fsp.unlink(targetFile).catch(() => {});
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Gagal menghapus file.',
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`A Little World server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
