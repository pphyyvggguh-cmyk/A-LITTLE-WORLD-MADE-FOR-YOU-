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
  assert.ok(wishlistSection.includes("existing().status == 'completed'"));
  assert.ok(wishlistSection.includes("incoming().status == 'completed'"));
  assert.ok(wishlistSection.includes('isCoupleMember()'));
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

test('storage.rules covers site-media, wishlist-media, and postcard-media', () => {
  assert.ok(storageRulesText.includes('match /site-media/{folder}/{fileName}'));
  assert.ok(storageRulesText.includes('match /wishlist-media/{wishId}/{fileName}'));
  assert.ok(storageRulesText.includes('match /postcard-media/{postcardId}/{fileName}'));
  assert.ok(storageRulesText.includes('allow read, write: if false;'));
});

test('secretNotes security guards expose only enabled notes publicly and restrict mutations to admin', () => {
  const secretNotesStart = rulesText.indexOf('match /secretNotes/{noteId}');
  assert.ok(secretNotesStart > 0);
  const secretNotesSection = rulesText.slice(secretNotesStart);

  assert.equal(secretNotesSection.includes('allow get: if true'), false);
  assert.equal(secretNotesSection.includes('allow list: if true'), false);
  assert.ok(secretNotesSection.includes('existing().enabled == true || isAdmin()'));
  assert.ok(secretNotesSection.includes('resource.data.enabled == true || isBootstrappedAdmin()'));
  assert.ok(secretNotesSection.includes('isValidSecretNote(incoming(), noteId)'));
  assert.ok(secretNotesSection.includes('data.pageNumber >= 1 && data.pageNumber <= 17') || rulesText.includes('data.pageNumber >= 1 && data.pageNumber <= 17'));
});
