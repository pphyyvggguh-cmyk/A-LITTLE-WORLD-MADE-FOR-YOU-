import test from 'node:test';
import assert from 'node:assert/strict';
import { MEMORY_BOOK_PAGES } from '../data/memories';
import type { PostcardEnvelope } from '../data/postcards';
import type { WishlistEntry } from '../data/wishlist';
import {
  buildLivingCalendarEvents,
  formatRelativeDaysLabel,
  getMonthGridCells,
  getNextUpcomingEvent,
  parseFlexibleDateKey,
  validateCustomCalendarEvent,
} from './livingCalendar';

test('parseFlexibleDateKey parses ISO, YYYY-MM-DD, DD/MM/YYYY, and Indonesian month captions safely', () => {
  assert.equal(parseFlexibleDateKey('2026-04-02'), '2026-04-02');
  assert.equal(parseFlexibleDateKey('2026-04-02T09:30:00.000Z'), '2026-04-02');
  assert.equal(parseFlexibleDateKey('02/04/2026'), '2026-04-02');
  assert.equal(parseFlexibleDateKey('02 April 2026 · ∞'), '2026-04-02');
  assert.equal(parseFlexibleDateKey('14 Februari 2027'), '2027-02-14');
  assert.equal(parseFlexibleDateKey('Bab 01 · Awal Cerita'), null);
  assert.equal(parseFlexibleDateKey(''), null);
});

test('getMonthGridCells builds Monday-first 7-column cells covering April 2026 accurately', () => {
  // April 2026 starts on Wednesday (offset 2 in Mon-first grid) and has 30 days -> 35 cells
  const cells = getMonthGridCells(2026, 3); // 0-indexed: 3 = April
  assert.equal(cells.length, 35);
  assert.equal(cells[2].dateKey, '2026-04-01');
  assert.equal(cells[2].inCurrentMonth, true);
  assert.equal(cells[3].dateKey, '2026-04-02');
  assert.equal(cells[31].dateKey, '2026-04-30');
  assert.equal(cells[31].inCurrentMonth, true);
});

test('buildLivingCalendarEvents aggregates story dates, wishlist dates, postcards, and custom dates', () => {
  const sampleWish: WishlistEntry = {
    id: 'wish-tokyo',
    title: 'Menonton Bunga Sakura di Tokyo',
    description: 'Jalan santai di Ueno Park',
    category: 'our',
    creatorUid: 'u1',
    creatorEmail: 'oktaf@example.com',
    creatorRole: 'oktaf',
    creatorName: 'Oktaf',
    targetDate: '2027-03-28',
    status: 'planned',
    photos: [],
    completionStory: '',
    allowedEmails: ['oktaf@example.com'],
    visibility: 'public',
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  };

  const samplePostcard: PostcardEnvelope = {
    id: 'pc-anniv',
    title: 'Surat Tahun Depan',
    senderUid: 'u1',
    senderEmail: 'oktaf@example.com',
    senderRole: 'oktaf',
    senderName: 'Oktaf',
    recipient: 'wulan',
    visibility: 'public',
    unlockAt: '2027-04-02T00:00:00.000Z',
    unlockDateLabel: '2 April 2027',
    createdDateLabel: '2 April 2026',
    location: 'Bandung',
    stampStyle: 'par_avion',
    designTheme: 'vintage_cream',
    isOpened: false,
    order: 1,
    allowedEmails: ['oktaf@example.com'],
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-02T00:00:00Z',
  };

  const events = buildLivingCalendarEvents({
    storyPages: MEMORY_BOOK_PAGES,
    wishlistEntries: [sampleWish],
    postcardEnvelopes: [samplePostcard],
    customEvents: [
      {
        id: 'c1',
        dateKey: '2026-06-15',
        title: 'Piknik Sore Berdua',
        note: 'Bawa teh hangat dan buku gambar',
        createdAt: '2026-04-02T00:00:00Z',
      },
    ],
  });

  assert.ok(events.some((e) => e.id === 'special-wulan-birthday-2026'));
  assert.ok(events.some((e) => e.source === 'story' && e.dateKey === '2026-04-02'));
  assert.ok(events.some((e) => e.id === 'wish-wish-tokyo' && e.dateKey === '2027-03-28'));
  assert.ok(events.some((e) => e.id === 'postcard-pc-anniv' && e.dateKey === '2027-04-02'));
  assert.ok(events.some((e) => e.id === 'custom-c1' && e.canDelete === true));

  const next = getNextUpcomingEvent(events, '2026-04-03');
  assert.equal(next?.dateKey, '2026-05-02');
  assert.equal(formatRelativeDaysLabel('2026-04-02', '2026-04-02'), 'Hari ini ♡');
  assert.equal(formatRelativeDaysLabel('2026-04-05', '2026-04-02'), '3 hari lagi');
});

test('validateCustomCalendarEvent enforces title and valid date format', () => {
  assert.equal(
    validateCustomCalendarEvent({ dateKey: '2026-06-15', title: '', note: '' }).ok,
    false
  );
  assert.equal(
    validateCustomCalendarEvent({ dateKey: 'not-a-date', title: 'Hari Spesial', note: '' }).ok,
    false
  );
  assert.equal(
    validateCustomCalendarEvent({
      dateKey: '2026-06-15',
      title: 'Makan Malam Ulang Tahun',
      note: 'Tempat favorit kita',
    }).ok,
    true
  );
});
