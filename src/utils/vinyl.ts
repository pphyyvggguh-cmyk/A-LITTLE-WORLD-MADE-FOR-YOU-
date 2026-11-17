import type { VinylTrack } from '../data/vinyl.ts';

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts a canonical 11-character YouTube video ID from standard watch URLs,
 * short youtu.be links, music.youtube.com links, /shorts/, /embed/, or a raw ID.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'youtu.be') {
    const candidate = parsed.pathname.split('/').filter(Boolean)[0] || '';
    return YOUTUBE_ID_REGEX.test(candidate) ? candidate : null;
  }

  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    const vParam = parsed.searchParams.get('v') || '';
    if (YOUTUBE_ID_REGEX.test(vParam)) {
      return vParam;
    }
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
      const candidate = parts[1];
      return YOUTUBE_ID_REGEX.test(candidate) ? candidate : null;
    }
  }

  return null;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  if (!YOUTUBE_ID_REGEX.test(videoId)) return '';
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function normalizeVinylOrder(tracks: VinylTrack[]): VinylTrack[] {
  return [...tracks]
    .sort((a, b) => a.order - b.order)
    .map((track, idx) => ({
      ...track,
      order: idx + 1,
    }));
}

export function reorderVinylTrack(
  tracks: VinylTrack[],
  id: string,
  direction: 'up' | 'down'
): VinylTrack[] {
  const ordered = normalizeVinylOrder(tracks);
  const index = ordered.findIndex((t) => t.id === id);
  if (index < 0) return ordered;

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return ordered;

  const copy = [...ordered];
  const [moved] = copy.splice(index, 1);
  copy.splice(target, 0, moved);

  return copy.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
}

export function validateVinylTrackInput(input: {
  youtubeUrl: string;
  title: string;
  artist?: string;
  thumbnailUrl?: string;
}):
  | {
      ok: true;
      youtubeVideoId: string;
      youtubeUrl: string;
      title: string;
      artist: string;
      thumbnailUrl: string;
    }
  | { ok: false; error: string } {
  const videoId = extractYouTubeVideoId(input.youtubeUrl);
  if (!videoId) {
    return {
      ok: false,
      error: 'Masukkan URL YouTube atau Video ID 11 karakter yang valid (contoh: youtube.com/watch?v=... atau youtu.be/...).',
    };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: 'Judul lagu wajib diisi.' };
  }
  if (title.length > 140) {
    return { ok: false, error: 'Judul lagu maksimal 140 karakter.' };
  }

  const artist = (input.artist || '').trim();
  if (artist.length > 120) {
    return { ok: false, error: 'Nama artis maksimal 120 karakter.' };
  }

  const customThumb = (input.thumbnailUrl || '').trim();
  if (customThumb.length > 1000) {
    return { ok: false, error: 'URL thumbnail maksimal 1000 karakter.' };
  }

  return {
    ok: true,
    youtubeVideoId: videoId,
    youtubeUrl: input.youtubeUrl.trim().slice(0, 500),
    title,
    artist,
    thumbnailUrl: customThumb || getYouTubeThumbnailUrl(videoId),
  };
}

export function formatPlayerClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
