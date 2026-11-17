import test from 'node:test';
import assert from 'node:assert/strict';
import { DESTINATIONS_DATA } from '../data/destinations.ts';
import { MEMORY_BOOK_PAGES } from '../data/memories.ts';
import { DEFAULT_VIDEO_CONFIG } from '../data/video.ts';
import { VoiceOfLoveEntry } from '../data/voices.ts';
import {
  collectMediaUsageMap,
  formatAudioTime,
  normalizeVoicesOrder,
  reorderVoiceEntry,
  sanitizeUploadBasename,
  validateMediaFilenameAndType,
  validateStoryBookPages,
} from './adminContent.ts';

test('validateMediaFilenameAndType enforces supported image, audio, and video types', () => {
  const jpg = validateMediaFilenameAndType('Wulan Photo.JPG', 'image/jpeg', 'image');
  assert.equal(jpg.ok, true);
  if (jpg.ok) assert.equal(jpg.kind, 'image');

  const mp3 = validateMediaFilenameAndType('ucapan-rani.mp3', 'audio/mpeg', 'audio');
  assert.equal(mp3.ok, true);
  if (mp3.ok) assert.equal(mp3.kind, 'audio');

  const ogg = validateMediaFilenameAndType('ucapan-budi.ogg', 'audio/ogg', 'audio');
  assert.equal(ogg.ok, true);

  const androidExtensionless = validateMediaFilenameAndType('1000048291', 'image/jpeg', 'image');
  assert.equal(androidExtensionless.ok, true);
  if (androidExtensionless.ok) {
    assert.equal(androidExtensionless.kind, 'image');
    assert.equal(androidExtensionless.ext, '.jpg');
  }

  const badImg = validateMediaFilenameAndType('script.svg', 'image/svg+xml', 'image');
  assert.equal(badImg.ok, false);

  const mismatch = validateMediaFilenameAndType('song.mp3', 'audio/mpeg', 'image');
  assert.equal(mismatch.ok, false);
});

test('validateStoryBookPages requires strictly 17 sequential pages', () => {
  const valid = validateStoryBookPages(MEMORY_BOOK_PAGES);
  assert.equal(valid.ok, true);

  const tooFew = validateStoryBookPages(MEMORY_BOOK_PAGES.slice(0, 16));
  assert.equal(tooFew.ok, false);

  const tooMany = validateStoryBookPages([...MEMORY_BOOK_PAGES, MEMORY_BOOK_PAGES[0]]);
  assert.equal(tooMany.ok, false);
});

test('normalizeVoicesOrder and reorderVoiceEntry maintain clean 1..N ordering', () => {
  const sample: VoiceOfLoveEntry[] = [
    {
      id: 'v1',
      name: 'Rani',
      flowerType: 'sakura',
      audioUrl: '/assets/audio/friends/rani.mp3',
      audioFileName: 'rani.mp3',
      order: 5,
      permissionConfirmed: true,
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
    {
      id: 'v2',
      name: 'Dina',
      flowerType: 'sunflower',
      audioUrl: '/assets/audio/friends/dina.mp3',
      audioFileName: 'dina.mp3',
      order: 10,
      permissionConfirmed: true,
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
    {
      id: 'v3',
      name: 'Sari',
      flowerType: 'daisy',
      audioUrl: '/assets/audio/friends/sari.mp3',
      audioFileName: 'sari.mp3',
      order: 2,
      permissionConfirmed: true,
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
  ];

  const normalized = normalizeVoicesOrder(sample);
  assert.deepEqual(
    normalized.map((v) => `${v.id}:${v.order}`),
    ['v3:1', 'v1:2', 'v2:3']
  );

  const movedUp = reorderVoiceEntry(normalized, 'v2', 'up');
  assert.deepEqual(
    movedUp.map((v) => `${v.id}:${v.order}`),
    ['v3:1', 'v2:2', 'v1:3']
  );
});

test('collectMediaUsageMap maps story, world, video, and voices asset references', () => {
  const usage = collectMediaUsageMap({
    storyPages: MEMORY_BOOK_PAGES,
    destinations: DESTINATIONS_DATA,
    videoConfig: DEFAULT_VIDEO_CONFIG,
    voices: [
      {
        id: 'v1',
        name: 'Rani',
        flowerType: 'sakura',
        audioUrl: '/assets/audio/friends/rani.mp3',
        audioFileName: 'rani.mp3',
        photoUrl: '/assets/uploads/images/rani.jpg',
        order: 1,
        permissionConfirmed: true,
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      },
    ],
  });

  assert.ok(usage['/assets/photos/memories/memory-01.svg']?.[0].includes('Our Story'));
  assert.ok(usage['/assets/photos/destinations/dest-01.svg']?.[0].includes('Our World'));
  assert.deepEqual(usage['/assets/audio/friends/rani.mp3'], ['Voices of Love · Rani (Audio)']);
  assert.deepEqual(usage['/assets/uploads/images/rani.jpg'], ['Voices of Love · Rani (Foto)']);
});

test('formatAudioTime & sanitizeUploadBasename behave safely', () => {
  assert.equal(formatAudioTime(0), '0:00');
  assert.equal(formatAudioTime(75.8), '1:15');
  assert.equal(formatAudioTime(Number.NaN), '0:00');
  assert.equal(sanitizeUploadBasename('Foto Wulan (2026)!.JPG'), 'foto-wulan-2026');
});
