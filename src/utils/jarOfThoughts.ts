import {
  ANONYMOUS_AUTHOR_LABEL,
  JAR_LIMITS,
  JarFeatureSettings,
  JarPaperStyle,
  JarPoolThought,
  JarThoughtSubmission,
  VALID_JAR_PAPER_STYLES,
} from '../data/jarOfThoughts';

export interface JarSubmissionDraft {
  senderInitial: string;
  message: string;
  paperStyle: string;
  isAnonymous: boolean;
}

export type JarValidationResult =
  | {
      ok: true;
      data: {
        senderInitial: string;
        message: string;
        paperStyle: JarPaperStyle;
        isAnonymous: boolean;
      };
    }
  | {
      ok: false;
      error: string;
      field?: 'senderInitial' | 'message' | 'paperStyle';
    };

export interface JarCooldownStatus {
  isCoolingDown: boolean;
  remainingMs: number;
  nextAvailableAtMs: number | null;
  formattedCountdown: string;
  hours: number;
  minutes: number;
  seconds: number;
}

export interface JarStatsSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  opened: number;
  availableInPool: number;
}

const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeJarText(raw: string, preserveNewlines = false): string {
  if (typeof raw !== 'string') return '';
  let cleaned = raw.replace(CONTROL_CHARS_RE, '');
  // Strip basic angle-bracket HTML tags to keep plain human messages clean
  cleaned = cleaned.replace(/<\/?[^>]+>/g, '');
  if (preserveNewlines) {
    cleaned = cleaned
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } else {
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
  }
  return cleaned;
}

export function isValidJarPaperStyle(value: string): value is JarPaperStyle {
  return (VALID_JAR_PAPER_STYLES as readonly string[]).includes(value);
}

export function validateJarSubmissionInput(draft: JarSubmissionDraft): JarValidationResult {
  const senderInitial = sanitizeJarText(draft.senderInitial, false);
  const message = sanitizeJarText(draft.message, true);
  const styleRaw = typeof draft.paperStyle === 'string' ? draft.paperStyle.trim() : '';

  if (senderInitial.length < JAR_LIMITS.SENDER_INITIAL_MIN) {
    return {
      ok: false,
      field: 'senderInitial',
      error: 'Isi inisial pengirim terlebih dahulu (contoh: R, A.N, atau Sahabat).',
    };
  }
  if (senderInitial.length > JAR_LIMITS.SENDER_INITIAL_MAX) {
    return {
      ok: false,
      field: 'senderInitial',
      error: `Inisial maksimal ${JAR_LIMITS.SENDER_INITIAL_MAX} karakter saja ya.`,
    };
  }

  if (message.length < JAR_LIMITS.MESSAGE_MIN) {
    return {
      ok: false,
      field: 'message',
      error: 'Tuliskan sedikit pesan atau doa untuk Wulan sebelum mengirim.',
    };
  }
  if (message.length > JAR_LIMITS.MESSAGE_MAX) {
    return {
      ok: false,
      field: 'message',
      error: `Pesan maksimal ${JAR_LIMITS.MESSAGE_MAX} karakter.`,
    };
  }

  if (!isValidJarPaperStyle(styleRaw)) {
    return {
      ok: false,
      field: 'paperStyle',
      error: 'Pilih salah satu gaya kertas surat yang tersedia.',
    };
  }

  return {
    ok: true,
    data: {
      senderInitial,
      message,
      paperStyle: styleRaw,
      isAnonymous: Boolean(draft.isAnonymous),
    },
  };
}

/**
 * Ensures anonymous submissions NEVER reveal the sender initial in Wulan's UI or public pool.
 */
export function resolveDisplayAuthor(input: {
  senderInitial?: string;
  displayAuthor?: string;
  isAnonymous: boolean;
}): string {
  if (input.isAnonymous) {
    return ANONYMOUS_AUTHOR_LABEL;
  }
  const candidate = sanitizeJarText(
    input.displayAuthor || input.senderInitial || '',
    false
  );
  return candidate.slice(0, JAR_LIMITS.SENDER_INITIAL_MAX) || ANONYMOUS_AUTHOR_LABEL;
}

/**
 * Selects one unopened approved message at random.
 * Returns null if the pool has zero eligible unopened thoughts (never consumes daily reveal!).
 */
export function pickRandomUnopenedThought(
  pool: readonly JarPoolThought[],
  rng: () => number = Math.random
): JarPoolThought | null {
  const eligible = pool.filter(
    (item) => item.isApproved && !item.opened && item.message.trim().length > 0
  );
  if (eligible.length === 0) return null;
  const rawRoll = rng();
  const normalizedRoll = Number.isFinite(rawRoll)
    ? Math.max(0, Math.min(0.999999999, rawRoll))
    : 0;
  const index = Math.floor(normalizedRoll * eligible.length);
  return eligible[index] ?? eligible[0];
}

export function formatCooldownCountdown(remainingMs: number): {
  formattedCountdown: string;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const clampedMs = Math.max(0, Math.ceil(remainingMs / 1000) * 1000);
  const totalSeconds = Math.floor(clampedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    formattedCountdown: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Computes cooldown strictly using a server-trusted timestamp in milliseconds.
 */
export function computeCooldownStatus(
  lastOpenedAtMs: number | null | undefined,
  trustedNowMs: number,
  cooldownHours: number = JAR_LIMITS.COOLDOWN_HOURS_DEFAULT
): JarCooldownStatus {
  if (
    typeof lastOpenedAtMs !== 'number' ||
    !Number.isFinite(lastOpenedAtMs) ||
    lastOpenedAtMs <= 0
  ) {
    return {
      isCoolingDown: false,
      remainingMs: 0,
      nextAvailableAtMs: null,
      formattedCountdown: '00:00:00',
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const safeHours = Math.max(1, Math.min(168, Number(cooldownHours) || 24));
  const cooldownDurationMs = safeHours * 3600 * 1000;
  const nextAvailableAtMs = lastOpenedAtMs + cooldownDurationMs;
  const remainingMs = Math.max(0, nextAvailableAtMs - trustedNowMs);

  if (remainingMs <= 0) {
    return {
      isCoolingDown: false,
      remainingMs: 0,
      nextAvailableAtMs: null,
      formattedCountdown: '00:00:00',
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const formatted = formatCooldownCountdown(remainingMs);
  return {
    isCoolingDown: true,
    remainingMs,
    nextAvailableAtMs,
    ...formatted,
  };
}

export function buildSubmissionFingerprint(
  senderInitial: string,
  message: string,
  isAnonymous: boolean
): string {
  const normInitial = sanitizeJarText(senderInitial, false).toLowerCase();
  const normMsg = sanitizeJarText(message, false).toLowerCase();
  return `${isAnonymous ? 'anon' : normInitial}::${normMsg}`;
}

export interface SlidingRateRecord {
  timestamps: number[];
  fingerprints: Array<{ hash: string; at: number }>;
}

export function evaluateSubmissionRateLimit(
  record: SlidingRateRecord | undefined,
  fingerprint: string,
  nowMs: number,
  opts?: {
    windowMs?: number;
    maxSubmissions?: number;
    duplicateWindowMs?: number;
  }
):
  | { ok: true; nextRecord: SlidingRateRecord }
  | { ok: false; code: 'DUPLICATE' | 'RATE_LIMITED'; error: string; retryAfterSec: number } {
  const windowMs = opts?.windowMs ?? JAR_LIMITS.RATE_LIMIT_WINDOW_MS;
  const maxSubmissions = opts?.maxSubmissions ?? JAR_LIMITS.RATE_LIMIT_MAX_SUBMISSIONS;
  const duplicateWindowMs = opts?.duplicateWindowMs ?? JAR_LIMITS.DUPLICATE_WINDOW_MS;

  const prevTimestamps = (record?.timestamps ?? []).filter((ts) => nowMs - ts < windowMs);
  const prevFingerprints = (record?.fingerprints ?? []).filter(
    (entry) => nowMs - entry.at < duplicateWindowMs
  );

  const dup = prevFingerprints.find((entry) => entry.hash === fingerprint);
  if (dup) {
    const retryAfterSec = Math.max(1, Math.ceil((duplicateWindowMs - (nowMs - dup.at)) / 1000));
    return {
      ok: false,
      code: 'DUPLICATE',
      retryAfterSec,
      error:
        'Pesan yang sama persis baru saja terkirim. Tunggu sebentar atau tulis pesan baru ya.',
    };
  }

  if (prevTimestamps.length >= maxSubmissions) {
    const oldest = prevTimestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (nowMs - oldest)) / 1000));
    const waitMinutes = Math.max(1, Math.ceil(retryAfterSec / 60));
    return {
      ok: false,
      code: 'RATE_LIMITED',
      retryAfterSec,
      error: `Kamu sudah mengirim beberapa pesan beruntun. Coba lagi dalam sekitar ${waitMinutes} menit ya.`,
    };
  }

  return {
    ok: true,
    nextRecord: {
      timestamps: [...prevTimestamps, nowMs],
      fingerprints: [...prevFingerprints, { hash: fingerprint, at: nowMs }],
    },
  };
}

export function summarizeJarStats(thoughts: readonly JarThoughtSubmission[]): JarStatsSummary {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let opened = 0;
  let availableInPool = 0;

  for (const item of thoughts) {
    if (item.status === 'pending') pending += 1;
    else if (item.status === 'approved') {
      approved += 1;
      if (item.opened) opened += 1;
      else availableInPool += 1;
    } else if (item.status === 'rejected') {
      rejected += 1;
    }
  }

  return {
    total: thoughts.length,
    pending,
    approved,
    rejected,
    opened,
    availableInPool,
  };
}

export function normalizeJarSettings(raw: Partial<JarFeatureSettings> | null | undefined): JarFeatureSettings {
  return {
    enabled: raw?.enabled !== false,
    publicRoute:
      typeof raw?.publicRoute === 'string' && raw.publicRoute.trim()
        ? raw.publicRoute.trim()
        : '#/leave-a-thought',
    wulanRoute:
      typeof raw?.wulanRoute === 'string' && raw.wulanRoute.trim()
        ? raw.wulanRoute.trim()
        : '#/jar-of-thoughts',
    cooldownHours:
      typeof raw?.cooldownHours === 'number' && raw.cooldownHours >= 1 && raw.cooldownHours <= 168
        ? Math.round(raw.cooldownHours)
        : JAR_LIMITS.COOLDOWN_HOURS_DEFAULT,
    introTitle:
      typeof raw?.introTitle === 'string' && raw.introTitle.trim()
        ? sanitizeJarText(raw.introTitle, false).slice(0, 120)
        : 'A Jar Full of Thoughts ♡',
    introSubtitle:
      typeof raw?.introSubtitle === 'string' && raw.introSubtitle.trim()
        ? sanitizeJarText(raw.introSubtitle, false).slice(0, 260)
        : 'Sebuah toples kaca kecil tempat pesan-pesan baik menunggu giliran untuk dibuka, satu surat setiap 24 jam.',
  };
}
