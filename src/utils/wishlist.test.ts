import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ACCESS_CONFIG, WishlistEntry, normalizeWishlistVisibility } from '../data/wishlist.ts';
import {
  buildAllowedEmailsList,
  canDeleteWishlistEntry,
  canEditWishlistEntry,
  canViewWishlistEntry,
  filterWishlistEntries,
  isAuthorizedAdminEmail,
  resolveCoupleRole,
  validateWishlistFormInput,
} from './wishlist.ts';

const baseConfig = {
  ...DEFAULT_ACCESS_CONFIG,
  wulanEmail: 'wulan.lover@gmail.com',
};

const sampleEntries: WishlistEntry[] = [
  {
    id: 'w1',
    title: 'Jalan Pagi di Kyoto',
    description: 'Jalan santai di Fushimi Inari sambil minum matcha hangat.',
    category: 'our',
    creatorUid: 'uid-oktaf',
    creatorEmail: 'oktafmbul0@gmail.com',
    creatorRole: 'oktaf',
    creatorName: 'Oktaf',
    targetDate: '2027-04-02',
    status: 'planned',
    photos: [],
    completionStory: '',
    allowedEmails: ['oktafmbul0@gmail.com', 'wulan.lover@gmail.com'],
    visibility: 'public',
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-02T00:00:00Z',
  },
  {
    id: 'w2',
    title: 'Kejutan Bunga Sakura',
    description: 'Catatan pribadi kejutan dari Oktaf.',
    category: 'your',
    creatorUid: 'uid-oktaf',
    creatorEmail: 'oktafmbul0@gmail.com',
    creatorRole: 'oktaf',
    creatorName: 'Oktaf',
    status: 'dreaming',
    photos: [],
    completionStory: '',
    allowedEmails: ['oktafmbul0@gmail.com', 'wulan.lover@gmail.com'],
    visibility: 'couple', // legacy compatibility
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-02T00:00:00Z',
  },
  {
    id: 'w3',
    title: 'Kelas Membuat Keramik Berdua',
    description: 'Mau bikin gelas couple dari tanah liat.',
    category: 'her',
    creatorUid: 'uid-wulan',
    creatorEmail: 'wulan.lover@gmail.com',
    creatorRole: 'wulan',
    creatorName: 'Wulan',
    status: 'completed',
    photos: ['https://example.com/pottery.jpg'],
    completionStory: 'Gelasnya agak miring tapi seru sekali!',
    completedAt: '2026-05-01T10:00:00Z',
    allowedEmails: ['oktafmbul0@gmail.com', 'wulan.lover@gmail.com'],
    visibility: 'shared',
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  },
];

test('resolveCoupleRole and isAuthorizedAdminEmail verify case-insensitively and require verified emails', () => {
  assert.equal(isAuthorizedAdminEmail('OKTAFMBUL0@gmail.com', true), true);
  assert.equal(isAuthorizedAdminEmail('oktafmbul0@gmail.com', false), false);

  assert.equal(resolveCoupleRole('oktafmbul0@gmail.com', baseConfig, true), 'oktaf');
  assert.equal(resolveCoupleRole('Wulan.Lover@gmail.com', baseConfig, true), 'wulan');
  assert.equal(resolveCoupleRole('stranger@gmail.com', baseConfig, true), null);
  assert.equal(
    resolveCoupleRole(
      'wulan.lover@gmail.com',
      { ...baseConfig, wishlistPrivacyMode: 'admin-only' },
      true
    ),
    null
  );
});

test('wishlist visibility distinguishes public, private/couple legacy, and shared couple modes', () => {
  assert.equal(normalizeWishlistVisibility('couple'), 'private');
  assert.equal(normalizeWishlistVisibility('public'), 'public');
  assert.equal(normalizeWishlistVisibility('shared'), 'shared');

  // Public item visible to unauthenticated visitors
  assert.equal(canViewWishlistEntry(sampleEntries[0], null, null), true);
  // Private/legacy couple item hidden from visitors & third parties
  assert.equal(canViewWishlistEntry(sampleEntries[1], null, null), false);
  assert.equal(canViewWishlistEntry(sampleEntries[1], 'stranger@gmail.com', null), false);
  assert.equal(canViewWishlistEntry(sampleEntries[1], 'wulan.lover@gmail.com', 'wulan'), true);
  assert.equal(canViewWishlistEntry(sampleEntries[2], 'oktafmbul0@gmail.com', 'oktaf'), true);
});

test('couple permissions restrict Wulan from editing/deleting Oktaf private items while allowing shared/own items', () => {
  assert.equal(canEditWishlistEntry(sampleEntries[0], 'wulan.lover@gmail.com', 'wulan'), true);
  assert.equal(canEditWishlistEntry(sampleEntries[1], 'wulan.lover@gmail.com', 'wulan'), false);
  assert.equal(canEditWishlistEntry(sampleEntries[2], 'wulan.lover@gmail.com', 'wulan'), true);
  assert.equal(canDeleteWishlistEntry(sampleEntries[1], 'wulan.lover@gmail.com', 'wulan'), false);
  assert.equal(canDeleteWishlistEntry(sampleEntries[1], 'oktafmbul0@gmail.com', 'oktaf'), true);
});

test('filterWishlistEntries, buildAllowedEmailsList, and validateWishlistFormInput enforce schema bounds', () => {
  assert.equal(filterWishlistEntries(sampleEntries, 'our', 'all').length, 1);
  assert.equal(filterWishlistEntries(sampleEntries, 'all', 'completed').length, 1);
  assert.equal(
    filterWishlistEntries(sampleEntries, 'all', 'all', { visibility: 'private' }).length,
    1
  );
  assert.equal(
    filterWishlistEntries(sampleEntries, 'all', 'all', { creatorRole: 'wulan' }).length,
    1
  );
  assert.deepEqual(buildAllowedEmailsList(baseConfig), [
    'oktafmbul0@gmail.com',
    'wulan.lover@gmail.com',
  ]);

  assert.equal(
    validateWishlistFormInput({
      title: 'Test Wish',
      description: 'Notes',
      category: 'our',
      status: 'dreaming',
      photos: [],
      completionStory: '',
      visibility: 'public',
    }).ok,
    true
  );

  assert.equal(
    validateWishlistFormInput({
      title: '',
      description: 'Notes',
      category: 'our',
      status: 'dreaming',
      photos: [],
      completionStory: '',
      visibility: 'private',
    }).ok,
    false
  );

  assert.equal(
    validateWishlistFormInput({
      title: 'Too many photos',
      description: 'Notes',
      category: 'our',
      status: 'completed',
      photos: ['1', '2', '3', '4', '5', '6', '7'],
      completionStory: 'Done',
      visibility: 'shared',
    }).ok,
    false
  );
});
