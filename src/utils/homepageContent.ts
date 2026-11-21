import {
  DEFAULT_HOMEPAGE_CONFIG,
  HOMEPAGE_TARGET_OPTIONS,
  type HomepageChapterTarget,
  type HomepageConfig,
  type HomepageFeaturedMemory,
  type HomepageHeroFrame,
} from '../data/homepage.ts';

const VALID_TARGETS = new Set<string>(HOMEPAGE_TARGET_OPTIONS.map((t) => t.id));
const VALID_TILTS = new Set<string>(['-rotate-1', 'rotate-1', 'rotate-0']);

export function normalizeHomepageConfig(
  raw: Partial<HomepageConfig> | null | undefined
): HomepageConfig {
  const rawHero = Array.isArray(raw?.heroFrames) ? raw.heroFrames : [];
  const heroById = new Map<string, Partial<HomepageHeroFrame>>();
  for (const frame of rawHero) {
    if (frame && typeof frame.id === 'string') {
      heroById.set(frame.id, frame);
    }
  }

  const heroFrames: HomepageHeroFrame[] = DEFAULT_HOMEPAGE_CONFIG.heroFrames
    .map((fallback, idx) => {
      const override = heroById.get(fallback.id);
      const image =
        typeof override?.image === 'string' && override.image.trim()
          ? override.image.trim().slice(0, 1200)
          : fallback.image;
      const alt =
        typeof override?.alt === 'string' && override.alt.trim()
          ? override.alt.trim().slice(0, 260)
          : fallback.alt;
      const caption =
        typeof override?.caption === 'string'
          ? override.caption.trim().slice(0, 120)
          : fallback.caption;
      const badgeLabel =
        typeof override?.badgeLabel === 'string'
          ? override.badgeLabel.trim().slice(0, 32)
          : fallback.badgeLabel;
      const order =
        typeof override?.order === 'number' && Number.isFinite(override.order)
          ? override.order
          : idx + 1;

      return {
        id: fallback.id,
        role: fallback.role,
        slotLabel: fallback.slotLabel,
        image,
        alt,
        caption,
        badgeLabel,
        order,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((frame, idx) => ({ ...frame, order: idx + 1 }));

  const rawFeatured = Array.isArray(raw?.featuredMemories) ? raw.featuredMemories : [];
  const featuredMemories: HomepageFeaturedMemory[] =
    rawFeatured.length > 0
      ? rawFeatured
          .slice(0, 6)
          .map((item, idx) => {
            const fallback =
              DEFAULT_HOMEPAGE_CONFIG.featuredMemories[
                idx % DEFAULT_HOMEPAGE_CONFIG.featuredMemories.length
              ];
            const id =
              typeof item?.id === 'string' && item.id.trim()
                ? item.id.trim().slice(0, 80)
                : `featured-${idx + 1}`;
            const target: HomepageChapterTarget =
              typeof item?.target === 'string' && VALID_TARGETS.has(item.target)
                ? (item.target as HomepageChapterTarget)
                : fallback.target;
            const image =
              typeof item?.image === 'string' && item.image.trim()
                ? item.image.trim().slice(0, 1200)
                : fallback.image;
            const alt =
              typeof item?.alt === 'string' && item.alt.trim()
                ? item.alt.trim().slice(0, 260)
                : fallback.alt;
            const kicker =
              typeof item?.kicker === 'string' && item.kicker.trim()
                ? item.kicker.trim().slice(0, 80)
                : fallback.kicker;
            const title =
              typeof item?.title === 'string' && item.title.trim()
                ? item.title.trim().slice(0, 140)
                : fallback.title;
            const caption =
              typeof item?.caption === 'string'
                ? item.caption.trim().slice(0, 280)
                : fallback.caption;
            const tiltClass: HomepageFeaturedMemory['tiltClass'] =
              typeof item?.tiltClass === 'string' && VALID_TILTS.has(item.tiltClass)
                ? (item.tiltClass as HomepageFeaturedMemory['tiltClass'])
                : fallback.tiltClass;
            const order =
              typeof item?.order === 'number' && Number.isFinite(item.order)
                ? item.order
                : idx + 1;

            return {
              id,
              target,
              image,
              alt,
              kicker,
              title,
              caption,
              tiltClass,
              order,
            };
          })
          .sort((a, b) => a.order - b.order)
          .map((item, idx) => ({ ...item, order: idx + 1 }))
      : structuredClone(DEFAULT_HOMEPAGE_CONFIG.featuredMemories);

  return {
    heroFrames,
    featuredMemories,
  };
}

export function reorderFeaturedMemory(
  items: HomepageFeaturedMemory[],
  id: string,
  direction: 'up' | 'down'
): HomepageFeaturedMemory[] {
  const ordered = [...items].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((item) => item.id === id);
  if (idx < 0) return ordered;
  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= ordered.length) return ordered;

  const next = [...ordered];
  const [moved] = next.splice(idx, 1);
  next.splice(targetIdx, 0, moved);
  return next.map((item, i) => ({ ...item, order: i + 1 }));
}

export function swapHeroFrameMedia(
  frames: HomepageHeroFrame[],
  frameAId: string,
  frameBId: string
): HomepageHeroFrame[] {
  const idxA = frames.findIndex((f) => f.id === frameAId);
  const idxB = frames.findIndex((f) => f.id === frameBId);
  if (idxA < 0 || idxB < 0 || idxA === idxB) return frames;

  const copy = frames.map((f) => ({ ...f }));
  const a = copy[idxA];
  const b = copy[idxB];

  const swappedImageA = b.image;
  const swappedAltA = b.alt;
  const swappedCaptionA = b.caption;

  copy[idxA] = {
    ...a,
    image: swappedImageA,
    alt: swappedAltA,
    caption: swappedCaptionA,
  };
  copy[idxB] = {
    ...b,
    image: a.image,
    alt: a.alt,
    caption: a.caption,
  };
  return copy;
}

export function validateHomepageConfig(
  config: HomepageConfig
): { ok: true; data: HomepageConfig } | { ok: false; error: string } {
  const normalized = normalizeHomepageConfig(config);
  if (normalized.heroFrames.length < 3) {
    return {
      ok: false,
      error: 'Kolase Hero membutuhkan 3 bingkai foto (1 Hero Utama + 2 Polaroid Dekoratif).',
    };
  }
  for (const frame of normalized.heroFrames) {
    if (!frame.image.trim()) {
      return { ok: false, error: `Gambar untuk "${frame.slotLabel}" tidak boleh kosong.` };
    }
    if (!frame.caption.trim()) {
      return { ok: false, error: `Keterangan/caption untuk "${frame.slotLabel}" tidak boleh kosong.` };
    }
  }
  if (normalized.featuredMemories.length === 0) {
    return { ok: false, error: 'Minimal 1 kartu Featured Memories wajib tersedia.' };
  }
  for (const item of normalized.featuredMemories) {
    if (!item.image.trim()) {
      return { ok: false, error: `Foto Featured Memory "${item.title}" tidak boleh kosong.` };
    }
    if (!item.title.trim()) {
      return { ok: false, error: 'Setiap kartu Featured Memories wajib memiliki judul.' };
    }
  }
  return { ok: true, data: normalized };
}
