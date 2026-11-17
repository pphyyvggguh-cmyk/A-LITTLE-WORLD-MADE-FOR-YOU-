import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_VINYL_PLAYLIST } from '../data/vinyl.ts';
import {
  extractYouTubeVideoId,
  formatPlayerClock,
  getYouTubeThumbnailUrl,
  normalizeVinylOrder,
  reorderVinylTrack,
  validateVinylTrackInput,
} from './vinyl.ts';

test('extractYouTubeVideoId parses watch, short, shorts, embed, music, and raw IDs', () => {
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeVideoId('https://youtu.be/jfKfPfyJRdk?si=abc'), 'jfKfPfyJRdk');
  assert.equal(extractYouTubeVideoId('https://youtube.com/shorts/abcDEF12345'), 'abcDEF12345');
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/embed/5qap5aO4i9A'), '5qap5aO4i9A');
  assert.equal(extractYouTubeVideoId('https://music.youtube.com/watch?v=jfKfPfyJRdk'), 'jfKfPfyJRdk');
  assert.equal(extractYouTubeVideoId('jfKfPfyJRdk'), 'jfKfPfyJRdk');

  assert.equal(extractYouTubeVideoId('https://vimeo.com/123456'), null);
  assert.equal(extractYouTubeVideoId('not-a-valid-id'), null);
});

test('validateVinylTrackInput builds default thumbnail and rejects bad inputs', () => {
  const valid = validateVinylTrackInput({
    youtubeUrl: 'https://youtu.be/jfKfPfyJRdk',
    title: 'Lagu Sore Kita',
    artist: 'Acoustic Session',
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.youtubeVideoId, 'jfKfPfyJRdk');
    assert.equal(valid.thumbnailUrl, getYouTubeThumbnailUrl('jfKfPfyJRdk'));
  }

  const missingTitle = validateVinylTrackInput({
    youtubeUrl: 'https://youtu.be/jfKfPfyJRdk',
    title: '   ',
  });
  assert.equal(missingTitle.ok, false);

  const badUrl = validateVinylTrackInput({
    youtubeUrl: 'https://example.com/song.mp3',
    title: 'Test',
  });
  assert.equal(badUrl.ok, false);
});

test('normalizeVinylOrder and reorderVinylTrack move tracks deterministically', () => {
  const normalized = normalizeVinylOrder([
    { ...DEFAULT_VINYL_PLAYLIST[1], order: 9 },
    { ...DEFAULT_VINYL_PLAYLIST[0], order: 2 },
  ]);
  assert.deepEqual(
    normalized.map((t) => `${t.id}:${t.order}`),
    ['vinyl-track-1:1', 'vinyl-track-2:2']
  );

  const moved = reorderVinylTrack(normalized, 'vinyl-track-2', 'up');
  assert.deepEqual(
    moved.map((t) => `${t.id}:${t.order}`),
    ['vinyl-track-2:1', 'vinyl-track-1:2']
  );
});

test('formatPlayerClock renders mm:ss safely', () => {
  assert.equal(formatPlayerClock(0), '0:00');
  assert.equal(formatPlayerClock(185.9), '3:05');
  assert.equal(formatPlayerClock(-5), '0:00');
});
