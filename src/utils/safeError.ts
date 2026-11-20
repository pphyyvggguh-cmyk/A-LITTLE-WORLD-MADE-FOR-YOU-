export const PUBLIC_JAR_SUBMIT_ERROR =
  'Something went wrong while sending your little thought. Please try again.';

const SENSITIVE_OR_RAW_MARKERS = [
  'permission-denied',
  'missing or insufficient permissions',
  'firebaseerror',
  'firebase:',
  'auth/',
  'firestore/',
  'storage/',
  '"operationtype"',
  '"authinfo"',
  '"userid"',
  '"providerinfo"',
  'unauthorized-domain',
  'bearer ',
];

interface ParsedFirestoreErrorInfo {
  error?: string;
  operationType?: string;
  path?: string | null;
}

function tryParseFirestoreErrorJson(raw: string): ParsedFirestoreErrorInfo | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  try {
    const parsed = JSON.parse(trimmed) as ParsedFirestoreErrorInfo;
    if (
      parsed &&
      typeof parsed === 'object' &&
      ('operationType' in parsed || 'error' in parsed || 'authInfo' in parsed)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function isSensitiveOrRawErrorText(text: string): boolean {
  const lower = text.toLowerCase();
  if (tryParseFirestoreErrorJson(text) !== null) return true;
  if (SENSITIVE_OR_RAW_MARKERS.some((marker) => lower.includes(marker))) return true;
  // Guard against leaking email addresses or long opaque tokens
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return true;
  if (/\beyJ[A-Za-z0-9_-]{15,}\b/.test(text)) return true;
  return false;
}

export function formatSafeUiError(
  err: unknown,
  fallbackMessage: string,
  audience: 'public' | 'admin' = 'public'
): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : '';

  const trimmed = raw.trim();
  if (!trimmed) return fallbackMessage;

  const parsed = tryParseFirestoreErrorJson(trimmed);
  if (parsed) {
    if (audience === 'public') {
      return fallbackMessage;
    }

    const inner = String(parsed.error || '').toLowerCase();
    const op = parsed.operationType ? String(parsed.operationType) : 'write';
    const safePath =
      typeof parsed.path === 'string' && parsed.path.trim()
        ? parsed.path.split('/')[0]
        : 'koleksi';

    if (
      inner.includes('permission-denied') ||
      inner.includes('missing or insufficient permissions')
    ) {
      return `Izin database ditolak untuk operasi ${op} pada ${safePath}. Pastikan akun admin aktif dan aturan firestore.rules terbaru sudah diterapkan.`;
    }
    if (
      inner.includes('unavailable') ||
      inner.includes('offline') ||
      inner.includes('network')
    ) {
      return 'Koneksi ke database sedang terganggu. Periksa jaringan lalu coba lagi.';
    }
    return fallbackMessage;
  }

  if (isSensitiveOrRawErrorText(trimmed)) {
    if (audience === 'admin') {
      const lower = trimmed.toLowerCase();
      if (
        lower.includes('permission-denied') ||
        lower.includes('missing or insufficient permissions')
      ) {
        return 'Izin akses database ditolak. Pastikan akun admin aktif dan aturan firestore.rules terbaru sudah diterapkan.';
      }
      if (lower.includes('unavailable') || lower.includes('offline')) {
        return 'Koneksi ke database sedang terganggu. Coba lagi sebentar ya.';
      }
    }
    return fallbackMessage;
  }

  return trimmed;
}
