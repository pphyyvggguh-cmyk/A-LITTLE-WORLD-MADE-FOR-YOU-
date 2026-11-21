import type { JarPaperStyle } from '../data/jarOfThoughts.ts';
import {
  VOICE_FLOWER_OPTIONS,
  VOICE_SUBMISSION_LIMITS,
  type VoiceFlowerType,
  type VoiceOfLoveEntry,
  type VoiceSubmissionRecord,
} from '../data/voices.ts';
import { sanitizeJarText, validateJarSubmissionInput, type JarSubmissionDraft } from './jarOfThoughts.ts';
import { screenUnifiedContributionText, type TextScreeningResult } from './textScreening.ts';

export const CONTRIBUTION_CONSENT_PROMPT =
  'Apakah kamu bersedia jika pesan dan suaramu dibagikan di website ini sebagai bagian dari hadiah untuk Wulan?';

export type ConsentChoice = 'YA' | 'TIDAK' | null;

export interface VoiceContributionDraft {
  senderName: string;
  flowerType: string;
  flowerQuantity: number;
  caption: string;
  hasAudio: boolean;
  audioFileName?: string;
  audioDurationSec?: number;
}

export type VoiceValidationResult =
  | {
      ok: true;
      data: {
        senderName: string;
        flowerType: VoiceFlowerType;
        flowerQuantity: number;
        caption: string;
        audioFileName: string;
        audioDurationSec: number;
      };
    }
  | {
      ok: false;
      error: string;
      field: 'senderName' | 'flowerType' | 'flowerQuantity' | 'caption' | 'audio';
    };

const VALID_FLOWERS = new Set<string>(VOICE_FLOWER_OPTIONS.map((opt) => opt.id));

const PUBLIC_AUDIO_EXTS = new Set(['.mp3', '.ogg', '.webm', '.m4a', '.aac', '.wav']);
const PUBLIC_AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/x-mp3',
  'audio/x-mpeg',
  'audio/ogg',
  'application/ogg',
  'audio/webm',
  'video/webm', // MediaRecorder audio-only blobs sometimes report video/webm in older browsers
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
]);

export function isValidVoiceFlowerType(value: string): value is VoiceFlowerType {
  return VALID_FLOWERS.has(value);
}

export function clampFlowerQuantity(raw: unknown): number {
  const num = Number(raw);
  if (!Number.isFinite(num)) return VOICE_SUBMISSION_LIMITS.FLOWER_QUANTITY_MIN;
  return Math.max(
    VOICE_SUBMISSION_LIMITS.FLOWER_QUANTITY_MIN,
    Math.min(VOICE_SUBMISSION_LIMITS.FLOWER_QUANTITY_MAX, Math.round(num))
  );
}

export function validatePublicAudioFileMeta(
  filename: string,
  mimeType: string,
  sizeBytes: number
): { ok: true; ext: string } | { ok: false; error: string } {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, error: 'File audio kosong atau belum direkam dengan benar.' };
  }
  if (sizeBytes > VOICE_SUBMISSION_LIMITS.AUDIO_MAX_BYTES) {
    return {
      ok: false,
      error: 'Ukuran rekaman audio maksimal 15 MB agar tetap cepat diputar.',
    };
  }

  const lowerName = filename.trim().toLowerCase();
  const dot = lowerName.lastIndexOf('.');
  const ext = dot >= 0 ? lowerName.slice(dot) : '';
  const cleanMime = mimeType.split(';')[0].trim().toLowerCase();

  const extOk = ext ? PUBLIC_AUDIO_EXTS.has(ext) : false;
  const mimeOk = cleanMime ? PUBLIC_AUDIO_MIMES.has(cleanMime) : false;

  if (!extOk && !mimeOk) {
    return {
      ok: false,
      error: 'Format audio tidak didukung. Gunakan MP3, OGG, WEBM, M4A, atau WAV, atau rekam langsung di halaman ini.',
    };
  }

  const resolvedExt =
    ext && PUBLIC_AUDIO_EXTS.has(ext)
      ? ext
      : cleanMime.includes('ogg')
        ? '.ogg'
        : cleanMime.includes('mp4') || cleanMime.includes('m4a') || cleanMime.includes('aac')
          ? '.m4a'
          : cleanMime.includes('wav')
            ? '.wav'
            : cleanMime.includes('webm')
              ? '.webm'
              : '.mp3';

  return { ok: true, ext: resolvedExt };
}

export function validateVoiceContributionInput(
  draft: VoiceContributionDraft
): VoiceValidationResult {
  const senderName = sanitizeJarText(draft.senderName, false);
  const caption = sanitizeJarText(draft.caption || '', true).slice(
    0,
    VOICE_SUBMISSION_LIMITS.CAPTION_MAX
  );

  // Anonymity is explicitly NOT allowed in Voices of Love
  if (senderName.length < VOICE_SUBMISSION_LIMITS.SENDER_NAME_MIN) {
    return {
      ok: false,
      field: 'senderName',
      error:
        'Isi nama atau inisial pengirim untuk Voices of Love (bagian suara tidak boleh anonim).',
    };
  }
  if (
    senderName.toLowerCase() === 'anonim' ||
    senderName.toLowerCase() === 'anonymous' ||
    senderName.toLowerCase() === 'someone special'
  ) {
    return {
      ok: false,
      field: 'senderName',
      error:
        'Bagian Voices of Love mewajibkan nama asli atau inisialmu (tidak bisa menggunakan label anonim).',
    };
  }
  if (senderName.length > VOICE_SUBMISSION_LIMITS.SENDER_NAME_MAX) {
    return {
      ok: false,
      field: 'senderName',
      error: `Nama/inisial maksimal ${VOICE_SUBMISSION_LIMITS.SENDER_NAME_MAX} karakter.`,
    };
  }

  if (!isValidVoiceFlowerType(draft.flowerType)) {
    return {
      ok: false,
      field: 'flowerType',
      error: 'Pilih salah satu desain bunga untuk ucapan suaramu.',
    };
  }

  const qtyRaw = Number(draft.flowerQuantity);
  if (
    !Number.isInteger(qtyRaw) ||
    qtyRaw < VOICE_SUBMISSION_LIMITS.FLOWER_QUANTITY_MIN ||
    qtyRaw > VOICE_SUBMISSION_LIMITS.FLOWER_QUANTITY_MAX
  ) {
    return {
      ok: false,
      field: 'flowerQuantity',
      error: `Pilih jumlah bunga antara ${VOICE_SUBMISSION_LIMITS.FLOWER_QUANTITY_MIN} sampai ${VOICE_SUBMISSION_LIMITS.FLOWER_QUANTITY_MAX}.`,
    };
  }

  if (!draft.hasAudio) {
    return {
      ok: false,
      field: 'audio',
      error: 'Rekam suara langsung atau unggah file audio untuk melengkapi bagian Voices of Love.',
    };
  }

  const audioFileName = sanitizeJarText(draft.audioFileName || 'voice-note.webm', false).slice(
    0,
    180
  );
  const audioDurationSec = Math.max(
    0,
    Math.min(600, Math.round(Number(draft.audioDurationSec || 0)))
  );

  return {
    ok: true,
    data: {
      senderName,
      flowerType: draft.flowerType,
      flowerQuantity: qtyRaw,
      caption,
      audioFileName: audioFileName || 'voice-note.webm',
      audioDurationSec,
    },
  };
}

export type UnifiedContributionDecision =
  | {
      shouldSubmit: false;
      reason: 'declined' | 'invalid';
      error?: string;
      section?: 'jar' | 'voices' | 'consent';
      field?: string;
    }
  | {
      shouldSubmit: true;
      jarData: {
        senderInitial: string;
        message: string;
        paperStyle: JarPaperStyle;
        isAnonymous: boolean;
      };
      voiceData: {
        senderName: string;
        flowerType: VoiceFlowerType;
        flowerQuantity: number;
        caption: string;
        audioFileName: string;
        audioDurationSec: number;
      };
      screening: TextScreeningResult;
    };

export function evaluateUnifiedContributionSubmission(input: {
  jarDraft: JarSubmissionDraft;
  voiceDraft: VoiceContributionDraft;
  consent: ConsentChoice;
}): UnifiedContributionDecision {
  if (input.consent === 'TIDAK') {
    return {
      shouldSubmit: false,
      reason: 'declined',
    };
  }

  const jarCheck = validateJarSubmissionInput(input.jarDraft);
  if (!jarCheck.ok) {
    return {
      shouldSubmit: false,
      reason: 'invalid',
      section: 'jar',
      field: jarCheck.field,
      error: jarCheck.error,
    };
  }

  const voiceCheck = validateVoiceContributionInput(input.voiceDraft);
  if (!voiceCheck.ok) {
    return {
      shouldSubmit: false,
      reason: 'invalid',
      section: 'voices',
      field: voiceCheck.field,
      error: voiceCheck.error,
    };
  }

  const screening = screenUnifiedContributionText({
    jarSenderInitial: jarCheck.data.senderInitial,
    jarMessage: jarCheck.data.message,
    voiceSenderName: voiceCheck.data.senderName,
    voiceCaption: voiceCheck.data.caption,
  });

  if (!screening.passed) {
    return {
      shouldSubmit: false,
      reason: 'invalid',
      section: 'jar',
      error: screening.reason || 'Konten teks tidak lolos pemeriksaan otomatis.',
    };
  }

  if (input.consent !== 'YA') {
    return {
      shouldSubmit: false,
      reason: 'invalid',
      section: 'consent',
      error: 'Pilih persetujuan YA atau TIDAK terlebih dahulu sebelum melanjutkan.',
    };
  }

  return {
    shouldSubmit: true,
    jarData: jarCheck.data,
    voiceData: voiceCheck.data,
    screening,
  };
}

/**
 * Builds the public VoiceOfLoveEntry upon admin approval, strictly preserving the
 * contributor's original flower design, quantity, non-anonymous name, caption, and audio.
 */
export function buildApprovedVoicePayloadFromSubmission(
  sub: VoiceSubmissionRecord,
  nextOrder: number,
  voiceId?: string
): Omit<VoiceOfLoveEntry, 'createdAt' | 'updatedAt'> {
  return {
    id: voiceId || `voice-${sub.submissionId}`,
    name: sub.senderName.trim().slice(0, 120),
    flowerType: sub.flowerType,
    flowerQuantity: clampFlowerQuantity(sub.flowerQuantity),
    audioUrl: sub.audioUrl.trim(),
    audioFileName: sub.audioFileName.trim().slice(0, 200),
    photoUrl: '',
    message: sub.caption.trim().slice(0, 1500),
    order: Math.max(1, Math.min(1000, Math.round(nextOrder))),
    permissionConfirmed: true,
    submissionId: sub.submissionId,
    source: 'public',
  };
}
