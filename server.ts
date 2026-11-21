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
import { processMiniOktafChatRequest } from './src/server/miniOktafService.ts';
import { fetchPublicMediaBlob } from './src/server/mediaBlobService.ts';
import { verifyQuest2AnswerLocal } from './src/utils/quests.ts';
import {
  buildSubmissionFingerprint,
  computeCooldownStatus,
  evaluateSubmissionRateLimit,
  SlidingRateRecord,
  validateJarSubmissionInput,
} from './src/utils/jarOfThoughts.ts';
import {
  evaluateUnifiedContributionSubmission,
  validatePublicAudioFileMeta,
} from './src/utils/unifiedContribution.ts';
import { VOICE_SUBMISSION_LIMITS } from './src/data/voices.ts';

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
const PRIMARY_WULAN_EMAIL = 'wulanainindya92@gmail.com';
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

const publicAudioUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: VOICE_SUBMISSION_LIMITS.AUDIO_MAX_BYTES,
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
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const aiConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
    res.json({ ok: true, mode: 'firebase', uploadReady: true, aiConfigured });
  });

  app.get('/api/media', async (req: Request, res: Response) => {
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    const result = await fetchPublicMediaBlob({ id });
    if (result.status !== 200 || !result.buffer) {
      res.set('Cache-Control', 'no-store');
      res.status(result.status).json({ ok: false, error: result.error || 'Media unavailable.' });
      return;
    }
    res.set('Content-Type', result.mimeType);
    res.set('Cache-Control', result.cacheControl || 'public, max-age=31536000, immutable');
    res.set('X-Content-Type-Options', 'nosniff');
    res.status(200).send(result.buffer);
  });

  app.get('/api/time', (_req, res) => {
    const nowMs = Date.now();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
      serverTimeMs: nowMs,
      iso: new Date(nowMs).toISOString(),
    });
  });

  // --- A Jar Full of Thoughts: Server Rate-Limiting, Sanitization & Concurrency Guards ---
  const jarRateLimitStore = new Map<string, SlidingRateRecord>();
  let jarRevealLockUntilMs = 0;
  let jarServerLastOpenedMs: number | null = null;

  function getClientIpKey(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const rawIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress || 'local';
    return crypto.createHash('sha256').update(rawIp).digest('hex').slice(0, 24);
  }

  app.post('/api/jar/submit-guard', (req: Request, res: Response) => {
    const nowMs = Date.now();
    const validation = validateJarSubmissionInput({
      senderInitial: String(req.body?.senderInitial ?? ''),
      message: String(req.body?.message ?? ''),
      paperStyle: String(req.body?.paperStyle ?? ''),
      isAnonymous: Boolean(req.body?.isAnonymous),
    });

    if (!validation.ok) {
      res.status(400).json({
        ok: false,
        code: 'INVALID_INPUT',
        error: validation.error,
      });
      return;
    }

    const ipKey = getClientIpKey(req);
    const fingerprint = buildSubmissionFingerprint(
      validation.data.senderInitial,
      validation.data.message,
      validation.data.isAnonymous
    );
    const rateDecision = evaluateSubmissionRateLimit(
      jarRateLimitStore.get(ipKey),
      fingerprint,
      nowMs
    );

    if (!rateDecision.ok) {
      res.status(429).json({
        ok: false,
        code: rateDecision.code,
        retryAfterSec: rateDecision.retryAfterSec,
        error: rateDecision.error,
      });
      return;
    }

    jarRateLimitStore.set(ipKey, rateDecision.nextRecord);
    res.set('Cache-Control', 'no-store');
    res.json({
      ok: true,
      sanitized: validation.data,
      serverTimeMs: nowMs,
    });
  });

  app.post('/api/jar/reveal-guard', (req: Request, res: Response) => {
    const nowMs = Date.now();
    res.set('Cache-Control', 'no-store');

    const cooldownHours = Math.max(
      1,
      Math.min(168, Number(req.body?.cooldownHours ?? 24) || 24)
    );

    if (jarServerLastOpenedMs !== null) {
      const cooldownCheck = computeCooldownStatus(jarServerLastOpenedMs, nowMs, cooldownHours);
      if (cooldownCheck.isCoolingDown) {
        res.status(429).json({
          ok: false,
          code: 'COOLDOWN_ACTIVE',
          serverTimeMs: nowMs,
          remainingMs: cooldownCheck.remainingMs,
          error:
            'Satu pesan sudah dibuka dalam 24 jam terakhir. Tunggu sebentar lagi ya.',
        });
        return;
      }
    }

    if (jarRevealLockUntilMs > nowMs) {
      res.status(429).json({
        ok: false,
        code: 'CONCURRENT_REVEAL',
        serverTimeMs: nowMs,
        error: 'Toples sedang dibuka, tunggu sebentar ya.',
      });
      return;
    }

    jarRevealLockUntilMs = nowMs + 8000;
    res.json({
      ok: true,
      serverTimeMs: nowMs,
    });
  });

  app.post('/api/jar/reveal-confirm', (req: Request, res: Response) => {
    const nowMs = Date.now();
    jarRevealLockUntilMs = 0;
    const confirmedAt = Number(req.body?.openedAtMs);
    jarServerLastOpenedMs =
      Number.isFinite(confirmedAt) && confirmedAt > 0 && confirmedAt <= nowMs + 60_000
        ? confirmedAt
        : nowMs;
    res.json({ ok: true, serverTimeMs: nowMs });
  });

  app.post('/api/jar/reveal-release', (_req: Request, res: Response) => {
    jarRevealLockUntilMs = 0;
    res.json({ ok: true, serverTimeMs: Date.now() });
  });

  app.post('/api/jar/reset-guard', async (req: Request, res: Response) => {
    const verified = await verifyFirebaseBearerToken(
      req.headers.authorization,
      firebaseCfg.apiKey
    );
    if (!verified || !verified.emailVerified || verified.email !== PRIMARY_ADMIN_EMAIL) {
      res.status(403).json({ ok: false, error: 'Akses ditolak.' });
      return;
    }
    jarRevealLockUntilMs = 0;
    jarServerLastOpenedMs = null;
    res.json({ ok: true, serverTimeMs: Date.now() });
  });

  // --- Unified Contribution (/leave-a-thought): Public Audio Upload & Text Screening ---
  const audioUploadRateMap = new Map<string, number[]>();

  app.post('/api/contributions/upload-audio', (req: Request, res: Response, next: NextFunction) => {
    publicAudioUploadMiddleware.single('file')(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({
            ok: false,
            error: 'Ukuran rekaman audio maksimal 15 MB agar tetap cepat diputar.',
          });
          return;
        }
        res.status(400).json({
          ok: false,
          error: err instanceof Error ? err.message : 'Gagal membaca file audio.',
        });
        return;
      }
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      const nowMs = Date.now();
      const ipKey = getClientIpKey(req);
      const recentUploads = (audioUploadRateMap.get(ipKey) || []).filter(
        (ts) => nowMs - ts < 15 * 60 * 1000
      );
      if (recentUploads.length >= 10) {
        res.status(429).json({
          ok: false,
          error: 'Terlalu banyak unggahan audio beruntun. Tunggu beberapa menit sebelum mencoba lagi.',
        });
        return;
      }

      const file = req.file;
      if (!file || !file.buffer || file.size <= 0) {
        res.status(400).json({
          ok: false,
          error: 'File audio tidak ditemukan atau kosong.',
        });
        return;
      }

      const check = validatePublicAudioFileMeta(
        file.originalname || 'voice-note.webm',
        file.mimetype || '',
        file.size
      );
      if (!check.ok) {
        res.status(400).json({ ok: false, error: check.error });
        return;
      }

      const stamp = nowMs.toString(36);
      const rand = crypto.randomBytes(6).toString('hex');
      const storedFilename = `voice-${stamp}-${rand}${check.ext}`;
      const targetDir = path.resolve(UPLOADS_DIR, 'voices-pending');
      await fsp.mkdir(targetDir, { recursive: true });

      const targetFile = path.resolve(targetDir, storedFilename);
      if (!targetFile.startsWith(targetDir + path.sep)) {
        res.status(400).json({ ok: false, error: 'Nama file audio tidak valid.' });
        return;
      }

      await fsp.writeFile(targetFile, file.buffer);
      recentUploads.push(nowMs);
      audioUploadRateMap.set(ipKey, recentUploads);

      const publicUrl = `/assets/uploads/voices-pending/${storedFilename}`;
      const storagePath = `app-server/uploads/voices-pending/${storedFilename}`;

      res.status(201).json({
        ok: true,
        url: publicUrl,
        storagePath,
        filename: storedFilename,
        sizeBytes: file.size,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Gagal menyimpan file audio kontribusi.',
      });
    }
  });

  app.post('/api/contributions/screen', (req: Request, res: Response) => {
    const nowMs = Date.now();
    const consentRaw = req.body?.consent;
    const consent = consentRaw === 'YA' || consentRaw === 'TIDAK' ? consentRaw : null;

    const decision = evaluateUnifiedContributionSubmission({
      jarDraft: {
        senderInitial: String(req.body?.jarDraft?.senderInitial ?? ''),
        message: String(req.body?.jarDraft?.message ?? ''),
        paperStyle: String(req.body?.jarDraft?.paperStyle ?? ''),
        isAnonymous: Boolean(req.body?.jarDraft?.isAnonymous),
      },
      voiceDraft: {
        senderName: String(req.body?.voiceDraft?.senderName ?? ''),
        flowerType: String(req.body?.voiceDraft?.flowerType ?? ''),
        flowerQuantity: Number(req.body?.voiceDraft?.flowerQuantity ?? 1),
        caption: String(req.body?.voiceDraft?.caption ?? ''),
        hasAudio: Boolean(req.body?.voiceDraft?.hasAudio),
        audioFileName: String(req.body?.voiceDraft?.audioFileName ?? 'voice-note.webm'),
        audioDurationSec: Number(req.body?.voiceDraft?.audioDurationSec ?? 0),
      },
      consent,
    });

    if (!decision.shouldSubmit) {
      res.status(decision.reason === 'declined' ? 200 : 400).json({
        ok: false,
        reason: decision.reason,
        section: decision.section,
        field: decision.field,
        error: decision.error || 'Kontribusi tidak dikirim.',
      });
      return;
    }

    const ipKey = getClientIpKey(req);
    const fingerprint = buildSubmissionFingerprint(
      `${decision.jarData.senderInitial}|${decision.voiceData.senderName}`,
      `${decision.jarData.message}|${decision.voiceData.caption}`,
      decision.jarData.isAnonymous
    );
    const rateDecision = evaluateSubmissionRateLimit(
      jarRateLimitStore.get(ipKey),
      fingerprint,
      nowMs
    );

    if (!rateDecision.ok) {
      res.status(429).json({
        ok: false,
        code: rateDecision.code,
        retryAfterSec: rateDecision.retryAfterSec,
        error: rateDecision.error,
      });
      return;
    }

    jarRateLimitStore.set(ipKey, rateDecision.nextRecord);
    res.set('Cache-Control', 'no-store');
    res.json({
      ok: true,
      jarData: decision.jarData,
      voiceData: decision.voiceData,
      screening: decision.screening,
      serverTimeMs: nowMs,
    });
  });

  app.delete('/api/contributions/audio', async (req: Request, res: Response) => {
    try {
      const verified = await verifyFirebaseBearerToken(
        req.headers.authorization,
        firebaseCfg.apiKey
      );
      if (!verified || !verified.emailVerified || verified.email !== PRIMARY_ADMIN_EMAIL) {
        res.status(403).json({
          ok: false,
          error: 'Hanya administrator terverifikasi yang dapat menghapus audio kontribusi.',
        });
        return;
      }

      const rawStoragePath = String(
        req.body?.storagePath || req.query?.storagePath || ''
      ).trim();
      if (!rawStoragePath.startsWith('app-server/uploads/voices-pending/')) {
        res.json({ ok: true, skipped: true });
        return;
      }

      const relative = rawStoragePath.slice('app-server/uploads/'.length);
      const targetFile = path.resolve(UPLOADS_DIR, relative);
      const allowedRoot = path.resolve(UPLOADS_DIR, 'voices-pending');
      if (!targetFile.startsWith(allowedRoot + path.sep)) {
        res.status(400).json({ ok: false, error: 'Path audio tidak valid.' });
        return;
      }

      await fsp.unlink(targetFile).catch(() => {});
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Gagal menghapus file audio kontribusi.',
      });
    }
  });

  app.post('/api/quests/validate', (req: Request, res: Response) => {
    const stepIndex = Number(req.body?.stepIndex);
    const answer = String(req.body?.answer ?? '');
    if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > 2) {
      res.status(400).json({ ok: false, correct: false, error: 'Pertanyaan tidak valid.' });
      return;
    }
    if (!answer.trim()) {
      res.json({ ok: true, correct: false, empty: true });
      return;
    }
    const correct = verifyQuest2AnswerLocal(stepIndex, answer);
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, correct });
  });

  app.post('/api/mini-oktaf/chat', async (req: Request, res: Response) => {
    const result = await processMiniOktafChatRequest({
      apiKey: process.env.GEMINI_API_KEY,
      body: req.body as Record<string, unknown>,
    });
    res.set('Cache-Control', 'no-store');
    res.status(result.status).json(result.json);
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

      if (
        scope !== 'site-media' &&
        verified.email !== PRIMARY_ADMIN_EMAIL &&
        verified.email !== PRIMARY_WULAN_EMAIL
      ) {
        res.status(403).json({
          ok: false,
          error: 'Akun Google tidak memiliki izin mengunggah foto pada halaman ini.',
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
