import type { WorldDestination } from '../data/destinations.ts';
import type { BirthdayLetter } from '../data/letters.ts';
import type { MemoryBookPage } from '../data/memories.ts';
import type { OktafDialogueEntry } from '../data/miniOktaf.ts';
import type { VinylPlayerConfig, VinylTrack } from '../data/vinyl.ts';
import type { BirthdayVideoConfig } from '../data/video.ts';
import type { VoiceOfLoveEntry } from '../data/voices.ts';
import type { StorySecretNote } from '../data/hiddenMessages.ts';

export type MediaKind = 'image' | 'audio' | 'video';

export interface MiniOktafContentConfig {
  sectionDialogues: Record<string, OktafDialogueEntry>;
  hubCardReactions: Record<string, OktafDialogueEntry>;
  curiousTapReactions: OktafDialogueEntry[];
}

export interface SiteContentPayload {
  storyPages: MemoryBookPage[];
  destinations: WorldDestination[];
  letters: BirthdayLetter[];
  videoConfig: BirthdayVideoConfig;
  miniOktaf: MiniOktafContentConfig;
  voices: VoiceOfLoveEntry[];
  secretNotes?: StorySecretNote[];
  vinylConfig?: VinylPlayerConfig;
  vinylPlaylist?: VinylTrack[];
  updatedAt: string;
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.ogg']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm']);

const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp']);
const AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/x-mp3',
  'audio/ogg',
  'application/ogg',
  'audio/x-mpeg',
]);
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm']);

const MIME_TO_DEFAULT_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/pjpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/x-mp3': '.mp3',
  'audio/x-mpeg': '.mp3',
  'audio/ogg': '.ogg',
  'application/ogg': '.ogg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot < 0) return '';
  return filename.slice(dot).toLowerCase();
}

export function validateMediaFilenameAndType(
  filename: string,
  mimeType: string,
  expectedKind?: MediaKind
): { ok: true; kind: MediaKind; ext: string } | { ok: false; error: string } {
  const rawExt = getFileExtension(filename.trim());
  const mime = mimeType.trim().toLowerCase();
  const ext = rawExt || MIME_TO_DEFAULT_EXT[mime] || '';

  const isImg = IMAGE_EXTENSIONS.has(ext) && (!mime || IMAGE_MIMES.has(mime));
  const isAudio = AUDIO_EXTENSIONS.has(ext) && (!mime || AUDIO_MIMES.has(mime));
  const isVideo = VIDEO_EXTENSIONS.has(ext) && (!mime || VIDEO_MIMES.has(mime));

  let detected: MediaKind | null = null;
  if (isImg) detected = 'image';
  else if (isAudio) detected = 'audio';
  else if (isVideo) detected = 'video';

  if (!detected) {
    if (expectedKind === 'image') {
      return { ok: false, error: 'Format gambar harus JPG, JPEG, PNG, atau WEBP.' };
    }
    if (expectedKind === 'audio') {
      return { ok: false, error: 'Format audio harus MP3 atau OGG.' };
    }
    if (expectedKind === 'video') {
      return { ok: false, error: 'Format video harus MP4 atau WEBM.' };
    }
    return {
      ok: false,
      error: 'Format file tidak didukung. Gunakan JPG/PNG/WEBP untuk gambar, MP3/OGG untuk audio, atau MP4/WEBM untuk video.',
    };
  }

  if (expectedKind && detected !== expectedKind) {
    return {
      ok: false,
      error: `Jenis file tidak sesuai (dibutuhkan ${expectedKind}, diterima ${detected}).`,
    };
  }

  return { ok: true, kind: detected, ext };
}

export function validateStoryBookPages(
  pages: unknown
): { ok: true; pages: MemoryBookPage[] } | { ok: false; error: string } {
  if (!Array.isArray(pages) || pages.length !== 17) {
    return {
      ok: false,
      error: 'Our Story harus tetap memiliki tepat 17 halaman (9 spread).',
    };
  }

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i] as Partial<MemoryBookPage>;
    if (!p || typeof p.id !== 'string' || p.pageNumber !== i + 1) {
      return {
        ok: false,
        error: `Struktur halaman ${i + 1} tidak valid.`,
      };
    }
  }

  return { ok: true, pages: pages as MemoryBookPage[] };
}

export function normalizeVoicesOrder(entries: VoiceOfLoveEntry[]): VoiceOfLoveEntry[] {
  return [...entries]
    .sort((a, b) => a.order - b.order)
    .map((entry, idx) => ({
      ...entry,
      order: idx + 1,
    }));
}

export function reorderVoiceEntry(
  entries: VoiceOfLoveEntry[],
  id: string,
  direction: 'up' | 'down'
): VoiceOfLoveEntry[] {
  const ordered = normalizeVoicesOrder(entries);
  const index = ordered.findIndex((item) => item.id === id);
  if (index < 0) return ordered;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= ordered.length) return ordered;

  const copy = [...ordered];
  const [moved] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, moved);

  return copy.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
}

export function collectMediaUsageMap(
  content: Pick<SiteContentPayload, 'storyPages' | 'destinations' | 'videoConfig' | 'voices'> & {
    vinylPlaylist?: VinylTrack[];
  }
): Record<string, string[]> {
  const usage: Record<string, string[]> = {};

  const track = (url: string | undefined, label: string) => {
    if (!url || !url.trim()) return;
    const key = url.trim();
    if (!usage[key]) usage[key] = [];
    if (!usage[key].includes(label)) {
      usage[key].push(label);
    }
  };

  for (const page of content.storyPages) {
    for (const pol of page.polaroids) {
      track(pol.image, `Our Story · Hal. ${page.pageNumber} (${pol.title})`);
    }
  }

  for (const dest of content.destinations) {
    track(dest.image, `Our World · ${dest.city}`);
  }

  track(content.videoConfig.videoSrc, 'Birthday Video (Video)');
  track(content.videoConfig.thumbnailSrc, 'Birthday Video (Thumbnail)');

  for (const voice of content.voices) {
    track(voice.audioUrl, `Voices of Love · ${voice.name} (Audio)`);
    track(voice.photoUrl, `Voices of Love · ${voice.name} (Foto)`);
  }

  for (const trackItem of content.vinylPlaylist || []) {
    track(trackItem.thumbnailUrl, `Vinyl Player · ${trackItem.title} (Cover)`);
  }

  return usage;
}

export function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function sanitizeUploadBasename(originalName: string): string {
  const dot = originalName.lastIndexOf('.');
  const rawBase = dot >= 0 ? originalName.slice(0, dot) : originalName;
  const cleaned = rawBase
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return cleaned || 'asset';
}
