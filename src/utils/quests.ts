import type { HeartGalleryPhoto, HeartGalleryTheme } from '../data/quests.ts';

export const TOTAL_QUEST2_QUESTIONS = 3;
export const TOTAL_POLAROIDS = 5;

const QUEST2_DIGESTS: readonly string[] = [
  '29ba46b4:a735604a',
  '6ffc1b0a:6d2d1e2a',
  'b099328f:fdf14051',
];

export function normalizeQuest2Answer(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .replace(/[.!]+$/g, '')
    .toLowerCase();
}

export function digestQuest2Answer(stepIndex: number, normalizedAnswer: string): string {
  const input = `lw-q2-step${stepIndex}::${normalizedAnswer}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let r = 0; r < 10; r++) {
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i);
      h1 ^= (c + r) & 0xff;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 = (Math.imul(h2 ^ c, 0x85ebca6b) + r) >>> 0;
    }
  }
  return `${h1.toString(16).padStart(8, '0')}:${h2.toString(16).padStart(8, '0')}`;
}

export function verifyQuest2AnswerLocal(stepIndex: number, rawAnswer: string): boolean {
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= TOTAL_QUEST2_QUESTIONS) {
    return false;
  }
  const normalized = normalizeQuest2Answer(rawAnswer);
  if (!normalized) return false;
  return digestQuest2Answer(stepIndex, normalized) === QUEST2_DIGESTS[stepIndex];
}

export function addCollectedPolaroid(
  current: string[],
  polaroidId: string,
  validIds?: Set<string>
): { next: string[]; added: boolean } {
  if (validIds && !validIds.has(polaroidId)) {
    return { next: current, added: false };
  }
  if (current.includes(polaroidId)) {
    return { next: current, added: false };
  }
  return { next: [...current, polaroidId], added: true };
}

export function isPolaroidQuestComplete(collected: string[]): boolean {
  return collected.length >= TOTAL_POLAROIDS;
}

export interface HeartLayoutPoint {
  index: number;
  xPercent: number;
  yPercent: number;
  rotationDeg: number;
  scale: number;
  ring: 'outer' | 'inner';
}

/**
 * Generates balanced polaroid positions arranged in an iconic Heart Shape.
 * Supports arbitrary photo counts (e.g., 1..30) by placing an outer heart contour
 * and a cozy inner heart cluster when count exceeds 16.
 */
export function computeHeartLayout(count: number): HeartLayoutPoint[] {
  if (!Number.isFinite(count) || count <= 0) return [];

  const total = Math.floor(count);

  const rawHeart = (t: number) => {
    const sinT = Math.sin(t);
    const xRaw = 16 * sinT * sinT * sinT;
    const yRaw = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    );
    return { xRaw, yRaw };
  };

  // True bounding box of classic parametric heart:
  // xRaw in [-16, 16], yRaw in [-11.94, 17] -> midpoint yMid = 2.53, halfHeight = 14.47
  const Y_MID = 2.53;
  const Y_HALF = 14.47;

  const normalizeHeart = (xRaw: number, yRaw: number, radialScale: number, centerY: number) => {
    const xPercent = Math.max(9, Math.min(91, 50 + (xRaw / 16) * 39 * radialScale));
    const yPercent = Math.max(12, Math.min(88, centerY + ((yRaw - Y_MID) / Y_HALF) * 35 * radialScale));
    return { xPercent, yPercent };
  };

  // Sample densely to parameterize by equal Euclidean arc length
  const SAMPLES = 720;
  const arcTable: Array<{ t: number; xRaw: number; yRaw: number; s: number }> = [];
  let totalLen = 0;
  let prev = rawHeart(0);
  arcTable.push({ t: 0, xRaw: prev.xRaw, yRaw: prev.yRaw, s: 0 });
  for (let i = 1; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * Math.PI * 2;
    const cur = rawHeart(t);
    const dx = cur.xRaw - prev.xRaw;
    const dy = cur.yRaw - prev.yRaw;
    totalLen += Math.hypot(dx, dy);
    arcTable.push({ t, xRaw: cur.xRaw, yRaw: cur.yRaw, s: totalLen });
    prev = cur;
  }

  const sampleAtFraction = (fraction: number, radialScale: number, centerY: number) => {
    const targetS = (((fraction % 1) + 1) % 1) * totalLen;
    let lo = 0;
    let hi = arcTable.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arcTable[mid].s < targetS) lo = mid + 1;
      else hi = mid;
    }
    const entry = arcTable[lo];
    return normalizeHeart(entry.xRaw, entry.yRaw, radialScale, centerY);
  };

  // Even outer count places one Polaroid symmetrically at top cleft (frac=0)
  // and one at bottom point (frac=0.5). For 20 photos: 16 outer + 4 inner lobe accents.
  const evenOuter =
    total <= 16 ? total : Math.min(18, Math.max(14, Math.floor((total * 0.8) / 2) * 2));
  const innerCount = Math.max(0, total - evenOuter);

  const points: HeartLayoutPoint[] = [];

  for (let i = 0; i < evenOuter; i++) {
    const frac = i / evenOuter;
    const pos = sampleAtFraction(frac, 1, 50);
    const rotationDeg = i === 0 || i * 2 === evenOuter ? 0 : ((i % 5) - 2) * 2.8;
    points.push({
      index: points.length,
      xPercent: Number(pos.xPercent.toFixed(2)),
      yPercent: Number(pos.yPercent.toFixed(2)),
      rotationDeg: Number(rotationDeg.toFixed(1)),
      scale: 1,
      ring: 'outer',
    });
  }

  // Place inner Polaroids cleanly inside the open left & right heart lobes
  // (avoiding the tight top cleft [0] and narrow bottom tip [0.5])
  const rightCount = Math.ceil(innerCount / 2);
  const leftCount = innerCount - rightCount;
  const innerFractions: number[] = [];
  for (let r = 0; r < rightCount; r++) {
    innerFractions.push(0.11 + ((r + 0.5) / Math.max(1, rightCount)) * 0.2);
  }
  for (let l = 0; l < leftCount; l++) {
    innerFractions.push(0.69 + ((l + 0.5) / Math.max(1, leftCount)) * 0.2);
  }

  for (let j = 0; j < innerCount; j++) {
    const pos = sampleAtFraction(innerFractions[j] ?? 0.2, 0.54, 48.5);
    const rotationDeg = ((j % 3) - 1) * 3.8;
    points.push({
      index: points.length,
      xPercent: Number(pos.xPercent.toFixed(2)),
      yPercent: Number(pos.yPercent.toFixed(2)),
      rotationDeg: Number(rotationDeg.toFixed(1)),
      scale: 0.9,
      ring: 'inner',
    });
  }

  return points;
}

export function computeHeartContourSvgPath(): string {
  const Y_MID = 2.53;
  const Y_HALF = 14.47;
  const commands: string[] = [];
  const STEPS = 96;
  for (let i = 0; i <= STEPS; i++) {
    const t = (i / STEPS) * Math.PI * 2;
    const sinT = Math.sin(t);
    const xRaw = 16 * sinT * sinT * sinT;
    const yRaw = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    );
    const x = (50 + (xRaw / 16) * 39).toFixed(2);
    const y = (50 + ((yRaw - Y_MID) / Y_HALF) * 35).toFixed(2);
    commands.push(`${i === 0 ? 'M' : 'L'}${x} ${y}`);
  }
  return `${commands.join(' ')} Z`;
}

const VALID_HEART_THEMES = new Set<HeartGalleryTheme>([
  'flowers',
  'butterflies',
  'stars',
  'notes',
  'stamps',
  'scrapbook',
]);

export function sanitizeHeartTheme(raw: unknown): HeartGalleryTheme {
  if (typeof raw === 'string' && VALID_HEART_THEMES.has(raw as HeartGalleryTheme)) {
    return raw as HeartGalleryTheme;
  }
  return 'scrapbook';
}

export function normalizeHeartGalleryOrder(items: HeartGalleryPhoto[]): HeartGalleryPhoto[] {
  return [...items]
    .sort((a, b) => a.order - b.order)
    .map((item, idx) => ({
      ...item,
      theme: sanitizeHeartTheme(item.theme),
      isPublished: item.isPublished !== false,
      order: idx + 1,
    }));
}

export function reorderHeartGalleryPhoto(
  items: HeartGalleryPhoto[],
  id: string,
  direction: 'up' | 'down'
): HeartGalleryPhoto[] {
  const ordered = normalizeHeartGalleryOrder(items);
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

export function validateHeartGalleryPhotoInput(input: {
  imageUrl?: string;
  caption?: string;
  dateLabel?: string;
}): { ok: true } | { ok: false; error: string } {
  const imageUrl = String(input.imageUrl || '').trim();
  const caption = String(input.caption || '').trim();
  const dateLabel = String(input.dateLabel || '').trim();

  if (!imageUrl || imageUrl.length > 1200) {
    return { ok: false, error: 'Foto untuk Heart Gallery wajib dipilih atau diunggah.' };
  }
  if (!caption || caption.length > 180) {
    return { ok: false, error: 'Caption foto wajib diisi (maksimal 180 karakter).' };
  }
  if (dateLabel.length > 60) {
    return { ok: false, error: 'Label tanggal maksimal 60 karakter.' };
  }
  return { ok: true };
}
