import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RULES_PATH = path.resolve(process.cwd(), 'firestore.rules');
const BLUEPRINT_PATH = path.resolve(process.cwd(), 'firebase-blueprint.json');
const STORAGE_RULES_PATH = path.resolve(process.cwd(), 'storage.rules');

const rulesText = fs.readFileSync(RULES_PATH, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf8'));
const storageRulesText = fs.readFileSync(STORAGE_RULES_PATH, 'utf8');

test('firestore.rules covers every collection and subcollection defined in firebase-blueprint.json', () => {
  assert.ok(rulesText.includes("rules_version = '2';"));
  assert.ok(rulesText.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));

  const blueprintCollections = Object.keys(blueprint.firestore);
  for (const colPath of blueprintCollections) {
    if (colPath === '/postcards/{postcardId}/secret/{secretId}') {
      assert.ok(
        rulesText.includes('match /postcards/{postcardId}') &&
          rulesText.includes('match /secret/{secretId}'),
        `Missing nested subcollection match block for blueprint path: ${colPath}`
      );
    } else {
      assert.ok(
        rulesText.includes(`match ${colPath}`),
        `Missing match block for blueprint path: ${colPath}`
      );
    }
  }
});

test('firestore.rules enforces email_verified, request.time, ID validation, and no get/exists inside allow list', () => {
  assert.ok(rulesText.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesText.includes('request.time'));
  assert.ok(rulesText.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"));

  // Check allow list blocks do not call get( or exists(
  const listMatches = rulesText.match(/allow list:[\s\S]*?;/g) || [];
  assert.ok(listMatches.length >= 7);
  for (const rule of listMatches) {
    assert.equal(rule.includes('get('), false, `allow list must not use get(): ${rule}`);
    assert.equal(rule.includes('exists('), false, `allow list must not use exists(): ${rule}`);
  }
});

test('wishlist security guards support public/private/shared visibility while protecting private items and terminal state', () => {
  const wishlistStart = rulesText.indexOf('match /wishlist/{wishId}');
  const postcardsStart = rulesText.indexOf('match /postcards/{postcardId}');
  assert.ok(wishlistStart > 0 && postcardsStart > wishlistStart);
  const wishlistSection = rulesText.slice(wishlistStart, postcardsStart);

  // Never unconditionally allow public read/list
  assert.equal(wishlistSection.includes('allow get: if true'), false);
  assert.equal(wishlistSection.includes('allow list: if true'), false);
  // Public access strictly scoped by visibility == 'public'
  assert.ok(wishlistSection.includes("visibility == 'public'"));
  // Enforces allowedEmails, creatorUid, terminal lock, and couple membership
  assert.ok(wishlistSection.includes('isValidWishlistEntry(incoming(), wishId)'));
  assert.ok(wishlistSection.includes('incoming().creatorUid == request.auth.uid'));
  assert.ok(wishlistSection.includes('resource.data.creatorEmail == userEmailLower()'));
  assert.ok(wishlistSection.includes("existing().status == 'completed'"));
  assert.ok(wishlistSection.includes("incoming().status == 'completed'"));
  assert.ok(wishlistSection.includes('isCoupleMember()'));
  assert.ok(rulesText.includes('function isBootstrappedWulan()'));
  assert.ok(rulesText.includes("userEmailLower() == 'wulanainindya92@gmail.com'"));
});

test('postcards security guards separate envelope from secret content and enforce server request.time >= unlockAt', () => {
  const postcardsStart = rulesText.indexOf('match /postcards/{postcardId}');
  const mediaStart = rulesText.indexOf('match /mediaAssets/{assetId}');
  assert.ok(postcardsStart > 0 && mediaStart > postcardsStart);
  const postcardsSection = rulesText.slice(postcardsStart, mediaStart);

  // Secret subcollection disallows list queries and gates reads by request.time >= env.unlockAt
  assert.ok(postcardsSection.includes('match /secret/{secretId}'));
  assert.ok(postcardsSection.includes('allow list: if false;'));
  assert.ok(postcardsSection.includes('canReadPostcardSecretDoc(postcardId)'));
  assert.ok(rulesText.includes('request.time >= env.unlockAt'));

  // Marking opened requires server request.time >= existing().unlockAt & server timestamp openedAt
  assert.ok(postcardsSection.includes('request.time >= existing().unlockAt'));
  assert.ok(postcardsSection.includes('incoming().openedAt == request.time'));
  assert.ok(postcardsSection.includes('existsAfter(/databases/$(database)/documents/postcards/$(postcardId)/secret/content)'));

  // Envelope blueprint must NOT allow message or photoUrl fields to leak early
  const envelopeFnStart = rulesText.indexOf('function isValidPostcardEnvelope');
  const secretFnStart = rulesText.indexOf('function isValidPostcardSecret');
  const envelopeFn = rulesText.slice(envelopeFnStart, secretFnStart);
  assert.equal(envelopeFn.includes("'message'"), false);
  assert.equal(envelopeFn.includes("'photoUrl'"), false);
});

test('storage.rules covers site-media, wishlist-media, and postcard-media with couple-only protection', () => {
  assert.ok(storageRulesText.includes('match /site-media/{folder}/{fileName}'));
  assert.ok(storageRulesText.includes('match /wishlist-media/{wishId}/{fileName}'));
  assert.ok(storageRulesText.includes('match /postcard-media/{postcardId}/{fileName}'));
  assert.ok(storageRulesText.includes('function isCoupleMember()'));
  assert.ok(storageRulesText.includes('allow read: if isCoupleMember();'));
  assert.ok(storageRulesText.includes('allow read, write: if false;'));
});

test('secretNotes security guards expose only enabled notes publicly and restrict mutations to admin', () => {
  const secretNotesStart = rulesText.indexOf('match /secretNotes/{noteId}');
  const jarThoughtsStart = rulesText.indexOf('match /jarThoughts/{thoughtId}');
  assert.ok(secretNotesStart > 0 && jarThoughtsStart > secretNotesStart);
  const secretNotesSection = rulesText.slice(secretNotesStart, jarThoughtsStart);

  assert.equal(secretNotesSection.includes('allow get: if true'), false);
  assert.equal(secretNotesSection.includes('allow list: if true'), false);
  assert.ok(secretNotesSection.includes('existing().enabled == true || isAdmin()'));
  assert.ok(secretNotesSection.includes('resource.data.enabled == true || isBootstrappedAdmin()'));
  assert.ok(secretNotesSection.includes('isValidSecretNote(incoming(), noteId)'));
  assert.ok(
    secretNotesSection.includes('data.pageNumber >= 1 && data.pageNumber <= 17') ||
      rulesText.includes('data.pageNumber >= 1 && data.pageNumber <= 17')
  );
});

test('jarThoughts, jarPool, and jarState enforce strict privacy, anonymity masking, and atomic 24h server cooldown', () => {
  const jarThoughtsStart = rulesText.indexOf('match /jarThoughts/{thoughtId}');
  const jarPoolStart = rulesText.indexOf('match /jarPool/{thoughtId}');
  const jarStateStart = rulesText.indexOf('match /jarState/{stateId}');
  assert.ok(jarThoughtsStart > 0 && jarPoolStart > jarThoughtsStart && jarStateStart > jarPoolStart);

  const jarThoughtsSection = rulesText.slice(jarThoughtsStart, jarPoolStart);
  const jarPoolSection = rulesText.slice(jarPoolStart, jarStateStart);
  const jarStateSection = rulesText.slice(jarStateStart);

  // Friends cannot read or list any submitted thoughts
  assert.ok(jarThoughtsSection.includes('allow get: if isValidId(thoughtId) && isAdmin();'));
  assert.ok(jarThoughtsSection.includes('allow list: if isBootstrappedAdmin();'));
  assert.ok(jarThoughtsSection.includes("incoming().status == 'pending'"));
  assert.ok(jarThoughtsSection.includes('incoming().opened == false'));

  // Anonymous messages in jarPool strictly enforce displayAuthor == 'Someone Special'
  assert.ok(rulesText.includes("(!data.isAnonymous || data.displayAuthor == 'Someone Special')"));
  assert.ok(jarPoolSection.includes('existing().opened == false'));
  assert.ok(jarPoolSection.includes('incoming().opened == true'));
  assert.ok(jarPoolSection.includes('getAfter(/databases/$(database)/documents/jarState/cooldown)'));

  // 24h cooldown enforces server request.time and atomic pairing with jarPool
  assert.ok(jarStateSection.includes("duration.value(24, 'h')"));
  assert.ok(jarStateSection.includes('request.time >= existing().lastOpenedAt'));
  assert.ok(jarStateSection.includes('getAfter(/databases/$(database)/documents/jarPool/$(incoming().lastOpenedThoughtId))'));
});

test('heartGallery exposes only published photos publicly and restricts writes to admin with valid theme schema', () => {
  const hgStart = rulesText.indexOf('match /heartGallery/{photoId}');
  assert.ok(hgStart > 0);
  const hgSection = rulesText.slice(hgStart);

  assert.equal(hgSection.includes('allow get: if true'), false);
  assert.equal(hgSection.includes('allow list: if true'), false);
  assert.ok(hgSection.includes('existing().isPublished == true || isAdmin()'));
  assert.ok(hgSection.includes('resource.data.isPublished == true || isBootstrappedAdmin()'));
  assert.ok(hgSection.includes('isValidHeartGalleryPhoto(incoming(), photoId)'));
  assert.ok(rulesText.includes("'flowers', 'butterflies', 'stars', 'notes', 'stamps', 'scrapbook'"));
});

test('unified contribution queues (voiceSubmissions & contributionBatches) enforce admin-only reads, non-anonymous voices, consent, and atomic pairing', () => {
  const vsStart = rulesText.indexOf('match /voiceSubmissions/{submissionId}');
  const cbStart = rulesText.indexOf('match /contributionBatches/{batchId}');
  assert.ok(vsStart > 0 && cbStart > vsStart);

  const vsSection = rulesText.slice(vsStart, cbStart);
  const cbSection = rulesText.slice(cbStart);

  assert.equal(vsSection.includes('allow get: if true'), false);
  assert.equal(vsSection.includes('allow list: if true'), false);
  assert.ok(vsSection.includes('allow get: if isValidId(submissionId) && isAdmin();'));
  assert.ok(vsSection.includes('allow list: if isBootstrappedAdmin();'));
  assert.ok(vsSection.includes("incoming().status == 'pending'"));
  assert.ok(vsSection.includes('incoming().consentConfirmed == true'));
  assert.ok(vsSection.includes('existsAfter(/databases/$(database)/documents/contributionBatches/$(submissionId))'));

  assert.ok(cbSection.includes('allow get: if isValidId(batchId) && isAdmin();'));
  assert.ok(cbSection.includes('allow list: if isBootstrappedAdmin();'));
  assert.ok(cbSection.includes('existsAfter(/databases/$(database)/documents/jarThoughts/$(incoming().jarThoughtId))'));
  assert.ok(cbSection.includes('existsAfter(/databases/$(database)/documents/voiceSubmissions/$(incoming().voiceSubmissionId))'));

  // Non-anonymous enforcement on voiceSubmissions
  assert.ok(rulesText.includes("!(data.senderName.lower() in ['anonim', 'anonymous', 'someone special'])"));
  assert.ok(rulesText.includes('data.flowerQuantity is number && data.flowerQuantity >= 1 && data.flowerQuantity <= 5'));
  assert.ok(rulesText.includes("'homepage'"));
});

test('mediaBlobs enforces public-site-only get, couple privacy for private scopes, strict MIME/size bounds, and uploaderUid', () => {
  const mbStart = rulesText.indexOf('match /mediaBlobs/{blobId}');
  assert.ok(mbStart > 0);
  const mbSection = rulesText.slice(mbStart);

  assert.equal(mbSection.includes('allow get: if true'), false);
  assert.equal(mbSection.includes('allow list: if true'), false);
  assert.ok(mbSection.includes('existing().isPublic == true || isCoupleMember()'));
  assert.ok(mbSection.includes('isValidMediaBlob(incoming(), blobId)'));
  assert.ok(mbSection.includes('incoming().uploaderUid == request.auth.uid'));
  assert.ok(rulesText.includes('data.dataBase64.size() <= 920000'));
  assert.ok(rulesText.includes("((data.scope == 'site-media' && data.isPublic == true) || (data.scope != 'site-media' && data.isPublic == false))"));
});


