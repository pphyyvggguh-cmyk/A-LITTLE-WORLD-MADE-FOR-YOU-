import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHomepageConfig,
  reorderFeaturedMemory,
  swapHeroFrameMedia,
  validateHomepageConfig,
} from './homepageContent';

test('normalizeHomepageConfig fills defaults and clamps orders cleanly', () => {
  const normalized = normalizeHomepageConfig({
    heroFrames: [
      {
        id: 'hero-main',
        role: 'hero-main',
        slotLabel: 'Hero',
        image: 'https://example.com/custom-hero.jpg',
        alt: 'Custom hero alt',
        caption: 'Kenangan baru',
        badgeLabel: 'Vol. 02',
        order: 1,
      },
    ],
    featuredMemories: [
      {
        id: 'm1',
        target: 'voices',
        image: 'https://example.com/m1.jpg',
        alt: 'Alt 1',
        kicker: 'Suara',
        title: 'Taman Suara',
        caption: 'Doa sahabat',
        tiltClass: 'rotate-1',
        order: 2,
      },
      {
        id: 'm2',
        target: 'story',
        image: 'https://example.com/m2.jpg',
        alt: 'Alt 2',
        kicker: 'Cerita',
        title: 'Awal Kisah',
        caption: 'Halaman pertama',
        tiltClass: '-rotate-1',
        order: 1,
      },
    ],
  });

  assert.equal(normalized.heroFrames.length, 3);
  assert.equal(normalized.heroFrames[0].image, 'https://example.com/custom-hero.jpg');
  assert.equal(normalized.heroFrames[0].badgeLabel, 'Vol. 02');
  assert.equal(normalized.featuredMemories.length, 2);
  assert.equal(normalized.featuredMemories[0].id, 'm2');
  assert.equal(normalized.featuredMemories[0].order, 1);
  assert.equal(normalized.featuredMemories[1].id, 'm1');
  assert.equal(normalized.featuredMemories[1].order, 2);
});

test('swapHeroFrameMedia swaps images, alt, and captions between Polaroid slots', () => {
  const base = normalizeHomepageConfig(undefined);
  const topBefore = base.heroFrames.find((f) => f.id === 'polaroid-top')!;
  const bottomBefore = base.heroFrames.find((f) => f.id === 'polaroid-bottom')!;

  const swapped = swapHeroFrameMedia(base.heroFrames, 'polaroid-top', 'polaroid-bottom');
  const topAfter = swapped.find((f) => f.id === 'polaroid-top')!;
  const bottomAfter = swapped.find((f) => f.id === 'polaroid-bottom')!;

  assert.equal(topAfter.image, bottomBefore.image);
  assert.equal(topAfter.caption, bottomBefore.caption);
  assert.equal(bottomAfter.image, topBefore.image);
  assert.equal(bottomAfter.caption, topBefore.caption);
});

test('reorderFeaturedMemory moves cards up and down while renumbering orders 1..N', () => {
  const base = normalizeHomepageConfig(undefined);
  const movedDown = reorderFeaturedMemory(base.featuredMemories, 'featured-story', 'down');
  assert.equal(movedDown[0].id, 'featured-world');
  assert.equal(movedDown[0].order, 1);
  assert.equal(movedDown[1].id, 'featured-story');
  assert.equal(movedDown[1].order, 2);
  assert.equal(movedDown[2].id, 'featured-letters');
  assert.equal(movedDown[2].order, 3);
});

test('validateHomepageConfig rejects missing captions or titles', () => {
  const base = normalizeHomepageConfig(undefined);
  base.heroFrames[0].caption = '   ';
  const badCaption = validateHomepageConfig(base);
  assert.equal(badCaption.ok, false);

  const valid = normalizeHomepageConfig(undefined);
  const okRes = validateHomepageConfig(valid);
  assert.equal(okRes.ok, true);
});
