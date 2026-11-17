import type { MemoryBookPage } from '../data/memories';
import type { PostcardEnvelope } from '../data/postcards';
import type { WishlistEntry } from '../data/wishlist';
import type { AppSection } from '../store/useStore';

export type CalendarEventSource = 'special' | 'story' | 'wishlist' | 'postcard' | 'custom';

export interface CustomCalendarEventInput {
  id?: string;
  dateKey: string; // YYYY-MM-DD
  title: string;
  note: string;
}

export interface CustomCalendarEvent {
  id: string;
  dateKey: string;
  title: string;
  note: string;
  createdAt: string;
}

export interface LivingCalendarEvent {
  id: string;
  dateKey: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  day: number;
  title: string;
  subtitle: string;
  categoryLabel: string;
  source: CalendarEventSource;
  accentColor: string;
  targetSection: AppSection;
  note?: string;
  canDelete?: boolean;
}

export interface CalendarGridCell {
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}

export const CUSTOM_CALENDAR_STORAGE_KEY = 'lw_custom_calendar_events_v1';

const MONTH_NAME_MAP: Record<string, number> = {
  januari: 1,
  january: 1,
  jan: 1,
  februari: 2,
  february: 2,
  feb: 2,
  maret: 3,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  june: 6,
  jun: 6,
  juli: 7,
  july: 7,
  jul: 7,
  agustus: 8,
  august: 8,
  agu: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  october: 10,
  okt: 10,
  oct: 10,
  november: 11,
  nov: 11,
  desember: 12,
  december: 12,
  des: 12,
  dec: 12,
};

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const SPECIAL_EVENTS_SEED: Omit<LivingCalendarEvent, 'monthKey' | 'day'>[] = [
  {
    id: 'special-wulan-birthday-2026',
    dateKey: '2026-04-02',
    title: 'Hari Ulang Tahun Wulan ♡',
    subtitle: '02 April 2026 · Perayaan Utama & Pembukaan Dunia Kecil',
    categoryLabel: 'Hari Istimewa',
    source: 'special',
    accentColor: '#A6533B',
    targetSection: 'letters',
    note: 'Semua surat, bunga, suara sahabat, dan kenangan di dunia kecil ini dirangkai khusus untuk merayakan harimu.',
  },
  {
    id: 'special-first-month-echo',
    dateKey: '2026-05-02',
    title: 'Satu Bulan Setelah Hari Spesial',
    subtitle: 'Menengok kembali impian & kartu pos yang sudah tertulis',
    categoryLabel: 'Catatan Jurnal',
    source: 'special',
    accentColor: '#455342',
    targetSection: 'wishlist',
    note: 'Waktu yang hangat untuk melihat impian mana yang mulai diwujudkan satu per satu.',
  },
  {
    id: 'special-midyear-stargaze',
    dateKey: '2026-10-02',
    title: 'Setengah Tahun Menuju Ulang Tahun Berikutnya',
    subtitle: 'Pengingat untuk menambah kenangan baru di Our Story',
    categoryLabel: 'Almanak Kita',
    source: 'special',
    accentColor: '#743D4A',
    targetSection: 'story',
    note: 'Selalu ada ruang untuk foto Polaroid dan cerita sederhana baru di sepanjang perjalanan.',
  },
  {
    id: 'special-wulan-birthday-2027',
    dateKey: '2027-04-02',
    title: 'Ulang Tahun Wulan Berikutnya ♡',
    subtitle: '02 April 2027 · Bab Baru yang Menanti',
    categoryLabel: 'Hari Istimewa',
    source: 'special',
    accentColor: '#A6533B',
    targetSection: 'postcards',
    note: 'Satu putaran penuh lagi—mari lihat pesan dari masa lalu mana yang terbuka di hari ini.',
  },
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateKeyFromParts(year: number, monthOneBased: number, day: number): string {
  return `${year}-${pad2(monthOneBased)}-${pad2(day)}`;
}

export function getTodayDateKey(nowMs: number = Date.now()): string {
  const d = new Date(nowMs);
  return formatDateKeyFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Parses ISO timestamps, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, or "02 April 2026"
 * into normalized YYYY-MM-DD keys. Returns null for non-date captions (e.g. "Bab 01").
 */
export function parseFlexibleDateKey(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/·.*$/, '').trim();
  if (!cleaned) return null;

  // 1. YYYY-MM-DD or ISO timestamp
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    if (y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return formatDateKeyFromParts(y, m, d);
    }
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = Number(dmyMatch[2]);
    const y = Number(dmyMatch[3]);
    if (y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return formatDateKeyFromParts(y, m, d);
    }
  }

  // 3. "02 April 2026" / "2 Apr 2026"
  const textMatch = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (textMatch) {
    const d = Number(textMatch[1]);
    const monthNum = MONTH_NAME_MAP[textMatch[2].toLowerCase()];
    const y = Number(textMatch[3]);
    if (monthNum && y >= 1990 && y <= 2100 && d >= 1 && d <= 31) {
      return formatDateKeyFromParts(y, monthNum, d);
    }
  }

  return null;
}

export function formatIndonesianDateLabel(dateKey: string): string {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateKey;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const monthLabel = INDONESIAN_MONTHS[m - 1] ?? '';
  return `${d} ${monthLabel} ${y}`;
}

function hydrateEventMeta(
  base: Omit<LivingCalendarEvent, 'monthKey' | 'day'>
): LivingCalendarEvent {
  return {
    ...base,
    monthKey: base.dateKey.slice(0, 7),
    day: Number(base.dateKey.slice(8, 10)),
  };
}

export function buildLivingCalendarEvents(params: {
  storyPages: MemoryBookPage[];
  wishlistEntries: WishlistEntry[];
  postcardEnvelopes: PostcardEnvelope[];
  customEvents: CustomCalendarEvent[];
}): LivingCalendarEvent[] {
  const events: LivingCalendarEvent[] = [];

  for (const seed of SPECIAL_EVENTS_SEED) {
    events.push(hydrateEventMeta(seed));
  }

  // Extract dated polaroids from Our Story pages
  for (const page of params.storyPages) {
    for (const pol of page.polaroids) {
      const dateKey = parseFlexibleDateKey(pol.date);
      if (!dateKey) continue;
      events.push(
        hydrateEventMeta({
          id: `story-${page.id}-${pol.id}`,
          dateKey,
          title: pol.title || page.title,
          subtitle: `Our Story · Halaman ${page.pageNumber} (${pol.location || page.spreadTheme})`,
          categoryLabel: 'Kenangan Jurnal',
          source: 'story',
          accentColor: '#C4A574',
          targetSection: 'story',
          note: pol.caption || page.handwrittenNote,
        })
      );
    }
  }

  // Extract dated wishlist dreams / completed keepsakes
  for (const wish of params.wishlistEntries) {
    const completedKey =
      wish.status === 'completed' ? parseFlexibleDateKey(wish.completedAt) : null;
    const targetKey = parseFlexibleDateKey(wish.targetDate);
    const chosenKey = completedKey || targetKey;
    if (!chosenKey) continue;

    events.push(
      hydrateEventMeta({
        id: `wish-${wish.id}`,
        dateKey: chosenKey,
        title: wish.title,
        subtitle:
          wish.status === 'completed'
            ? `Impian Tercapai · Oleh ${wish.creatorName}`
            : `Target Impian · Oleh ${wish.creatorName}`,
        categoryLabel: wish.status === 'completed' ? 'Impian Tercapai' : 'Rencana Impian',
        source: 'wishlist',
        accentColor: '#455342',
        targetSection: 'wishlist',
        note: wish.completionStory || wish.description,
      })
    );
  }

  // Extract future postcard unlock dates
  for (const card of params.postcardEnvelopes) {
    const dateKey = parseFlexibleDateKey(card.unlockAt);
    if (!dateKey) continue;

    events.push(
      hydrateEventMeta({
        id: `postcard-${card.id}`,
        dateKey,
        title: card.title,
        subtitle: card.isOpened
          ? `Kartu Pos Terbuka · Dari ${card.senderName}`
          : `Kartu Pos Siap Dibuka · Dari ${card.senderName}`,
        categoryLabel: 'Postcard Dari Masa Depan',
        source: 'postcard',
        accentColor: '#743D4A',
        targetSection: 'postcards',
        note: card.location ? `Dikirim dari ${card.location}` : undefined,
      })
    );
  }

  // Custom locally-saved couple milestones
  for (const custom of params.customEvents) {
    if (!parseFlexibleDateKey(custom.dateKey)) continue;
    events.push(
      hydrateEventMeta({
        id: `custom-${custom.id}`,
        dateKey: custom.dateKey,
        title: custom.title,
        subtitle: 'Catatan Tanggal Pribadi',
        categoryLabel: 'Tanggal Kita',
        source: 'custom',
        accentColor: '#A6533B',
        targetSection: 'calendar',
        note: custom.note || undefined,
        canDelete: true,
      })
    );
  }

  return events.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function getMonthGridCells(year: number, monthZeroBased: number): CalendarGridCell[] {
  const firstDay = new Date(year, monthZeroBased, 1);
  // Monday-first grid: Mon=0 .. Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthZeroBased + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthZeroBased, 0).getDate();

  const totalCells = startOffset + daysInMonth > 35 ? 42 : 35;
  const cells: CalendarGridCell[] = [];

  for (let i = 0; i < totalCells; i++) {
    if (i < startOffset) {
      const dayNum = prevMonthDays - startOffset + i + 1;
      const d = new Date(year, monthZeroBased - 1, dayNum);
      cells.push({
        dateKey: formatDateKeyFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate()),
        dayNumber: dayNum,
        inCurrentMonth: false,
      });
    } else if (i < startOffset + daysInMonth) {
      const dayNum = i - startOffset + 1;
      cells.push({
        dateKey: formatDateKeyFromParts(year, monthZeroBased + 1, dayNum),
        dayNumber: dayNum,
        inCurrentMonth: true,
      });
    } else {
      const dayNum = i - (startOffset + daysInMonth) + 1;
      const d = new Date(year, monthZeroBased + 1, dayNum);
      cells.push({
        dateKey: formatDateKeyFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate()),
        dayNumber: dayNum,
        inCurrentMonth: false,
      });
    }
  }

  return cells;
}

export function getNextUpcomingEvent(
  events: LivingCalendarEvent[],
  todayKey: string
): LivingCalendarEvent | null {
  const sorted = [...events].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return sorted.find((ev) => ev.dateKey >= todayKey) ?? sorted[0] ?? null;
}

export function formatRelativeDaysLabel(dateKey: string, todayKey: string): string {
  const targetMs = Date.parse(`${dateKey}T00:00:00Z`);
  const todayMs = Date.parse(`${todayKey}T00:00:00Z`);
  if (!Number.isFinite(targetMs) || !Number.isFinite(todayMs)) {
    return dateKey;
  }
  const diffDays = Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hari ini ♡';
  if (diffDays === 1) return 'Besok';
  if (diffDays > 1) return `${diffDays} hari lagi`;
  if (diffDays === -1) return 'Kemarin';
  return `${Math.abs(diffDays)} hari yang lalu`;
}

export function validateCustomCalendarEvent(
  input: CustomCalendarEventInput
): { ok: true } | { ok: false; error: string } {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: 'Judul momen atau tanggal spesial wajib diisi.' };
  }
  if (title.length > 90) {
    return { ok: false, error: 'Judul maksimal 90 karakter.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateKey.trim())) {
    return { ok: false, error: 'Pilih tanggal kalender yang valid.' };
  }
  if (input.note.trim().length > 260) {
    return { ok: false, error: 'Catatan singkat maksimal 260 karakter.' };
  }
  return { ok: true };
}

export function loadCustomCalendarEvents(): CustomCalendarEvent[] {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(CUSTOM_CALENDAR_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CustomCalendarEvent =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as CustomCalendarEvent).id === 'string' &&
        typeof (item as CustomCalendarEvent).dateKey === 'string' &&
        typeof (item as CustomCalendarEvent).title === 'string'
    );
  } catch {
    return [];
  }
}

export function saveCustomCalendarEvents(events: CustomCalendarEvent[]): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(CUSTOM_CALENDAR_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage quota / private mode failures
  }
}
