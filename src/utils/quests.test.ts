import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_HEART_GALLERY_PHOTOS,
  POLAROIDS_QUEST_DATA,
  VALID_POLAROID_IDS,
} from '../data/quests';
import {
  TOTAL_POLAROIDS,
  TOTAL_QUEST2_QUESTIONS,
  addCollectedPolaroid,
  computeHeartLayout,
  isPolaroidQuestComplete,
  normalizeQuest2Answer,
  reorderHeartGalleryPhoto,
  sanitizeHeartTheme,
  verifyQuest2AnswerLocal,
} from './quests';

test('normalizeQuest2Answer handles whitespace, dashes, punctuation, and case flexibly', () => {
  assert.equal(normalizeQuest2Answer('  02 - 05 - 2026  '), '02-05-2026');
  assert.equal(
    normalizeQuest2Answer('  Ingin   Membawa Keliling Dunia!! '),
    'ingin membawa keliling dunia'
  );
  assert.equal(normalizeQuest2Answer('Mengukur Tangan.'), 'mengukur tangan');
});

test('verifyQuest2AnswerLocal validates all 3 Quest 2 answers without exposing plaintext', () => {
  assert.equal(TOTAL_QUEST2_QUESTIONS, 3);

  assert.equal(verifyQuest2AnswerLocal(0, '02-05-2026'), true);
  assert.equal(verifyQuest2AnswerLocal(0, ' 02 - 05 - 2026 '), true);
  assert.equal(verifyQuest2AnswerLocal(0, '19-02-2009'), false);

  assert.equal(verifyQuest2AnswerLocal(1, 'Ingin membawa keliling dunia'), true);
  assert.equal(verifyQuest2AnswerLocal(1, 'ingin   membawa  keliling dunia!'), true);
  assert.equal(verifyQuest2AnswerLocal(1, 'ingin makan mie ayam'), false);

  assert.equal(verifyQuest2AnswerLocal(2, 'mengukur tangan'), true);
  assert.equal(verifyQuest2AnswerLocal(2, 'Mengukur Tangan.'), true);
  assert.equal(verifyQuest2AnswerLocal(2, 'pinjam jaket'), false);

  assert.equal(verifyQuest2AnswerLocal(3, 'mengukur tangan'), false);

  // Security check: client Quest 2 modules must never embed plaintext answers
  const utilsSrc = readFileSync('src/utils/quests.ts', 'utf8').toLowerCase();
  const dataSrc = readFileSync('src/data/quests.ts', 'utf8').toLowerCase();
  for (const secretAnswer of [
    '02-05-2026',
    'ingin membawa keliling dunia',
    'mengukur tangan',
  ]) {
    assert.equal(utilsSrc.includes(secretAnswer), false);
    assert.equal(dataSrc.includes(secretAnswer), false);
  }
});

test('addCollectedPolaroid deduplicates, rejects invalid IDs, and triggers completion at 5/5', () => {
  assert.equal(TOTAL_POLAROIDS, 5);
  assert.equal(POLAROIDS_QUEST_DATA.length, 5);

  let collected: string[] = [];
  for (const p of POLAROIDS_QUEST_DATA) {
    const res = addCollectedPolaroid(collected, p.id, VALID_POLAROID_IDS);
    assert.equal(res.added, true);
    collected = res.next;
  }

  const dup = addCollectedPolaroid(collected, 'polaroid-story', VALID_POLAROID_IDS);
  assert.equal(dup.added, false);
  assert.equal(dup.next.length, 5);

  const invalid = addCollectedPolaroid(collected, 'polaroid-fake', VALID_POLAROID_IDS);
  assert.equal(invalid.added, false);
  assert.equal(invalid.next.length, 5);

  assert.equal(isPolaroidQuestComplete(collected), true);
  assert.equal(isPolaroidQuestComplete(collected.slice(0, 4)), false);
});

test('computeHeartLayout produces bounded symmetrical coordinates for 1..25 photos', () => {
  assert.deepEqual(computeHeartLayout(0), []);

  for (const count of [1, 8, 16, 20, 25]) {
    const pts = computeHeartLayout(count);
    assert.equal(pts.length, count);
    for (const pt of pts) {
      assert.ok(pt.xPercent >= 10 && pt.xPercent <= 90, `xPercent out of bounds: ${pt.xPercent}`);
      assert.ok(pt.yPercent >= 12 && pt.yPercent <= 88, `yPercent out of bounds: ${pt.yPercent}`);
    }
  }

  // Verify 20-photo heart layout uses both left & right lobes symmetrically and avoids collisions
  const layout20 = computeHeartLayout(20);
  const leftCount = layout20.filter((p) => p.xPercent < 49).length;
  const rightCount = layout20.filter((p) => p.xPercent > 51).length;
  assert.ok(leftCount >= 6 && rightCount >= 6);

  let minDistance = Infinity;
  for (let i = 0; i < layout20.length; i++) {
    for (let j = i + 1; j < layout20.length; j++) {
      const dist = Math.hypot(
        layout20[i].xPercent - layout20[j].xPercent,
        layout20[i].yPercent - layout20[j].yPercent
      );
      if (dist < minDistance) minDistance = dist;
    }
  }
  assert.ok(minDistance >= 11.5, `Expected minDistance >= 11.5%, got ${minDistance.toFixed(2)}%`);
});

test('reorderHeartGalleryPhoto and sanitizeHeartTheme preserve order and theme safety', () => {
  assert.equal(sanitizeHeartTheme('flowers'), 'flowers');
  assert.equal(sanitizeHeartTheme('unknown-theme'), 'scrapbook');

  const sample = DEFAULT_HEART_GALLERY_PHOTOS.slice(0, 3);
  const movedDown = reorderHeartGalleryPhoto(sample, sample[0].id, 'down');
  assert.equal(movedDown[0].id, sample[1].id);
  assert.equal(movedDown[1].id, sample[0].id);
  assert.deepEqual(
    movedDown.map((item) => item.order),
    [1, 2, 3]
  );
});
