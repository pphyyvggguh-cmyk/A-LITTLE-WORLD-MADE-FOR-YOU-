import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOTAL_FLOWERS,
  validatePassword,
  addCollectedFlower,
  isFlowerQuestComplete,
  serializeState,
  deserializeState,
} from './storage';

test('validatePassword accepts new 19022009 code with trim and rejects old 02042026 code', () => {
  assert.equal(validatePassword('19022009'), true);
  assert.equal(validatePassword(' 19022009 '), true);
  assert.equal(validatePassword('02042026'), false);
  assert.equal(validatePassword(' 02042026 '), false);
  assert.equal(validatePassword('19022008'), false);
  assert.equal(validatePassword(''), false);
});

test('addCollectedFlower prevents duplicate collection and rejects unknown IDs', () => {
  const valid = new Set(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7']);
  let list: string[] = [];

  const first = addCollectedFlower(list, 'f1', valid);
  assert.equal(first.added, true);
  list = first.next;

  const dup = addCollectedFlower(list, 'f1', valid);
  assert.equal(dup.added, false);
  assert.equal(dup.next.length, 1);

  const invalid = addCollectedFlower(list, 'unknown', valid);
  assert.equal(invalid.added, false);
  assert.equal(invalid.next.length, 1);
});

test('isFlowerQuestComplete triggers exactly at 7 flowers', () => {
  assert.equal(TOTAL_FLOWERS, 7);
  assert.equal(isFlowerQuestComplete(['1', '2', '3', '4', '5', '6']), false);
  assert.equal(isFlowerQuestComplete(['1', '2', '3', '4', '5', '6', '7']), true);
});

test('serializeState and deserializeState preserve progress and deduplicate', () => {
  const serialized = serializeState({
    isUnlocked: true,
    collectedFlowers: ['f1', 'f2'],
    questDiscovered: true,
    rewardClaimed: false,
    visitedSections: ['hub', 'story'],
  });
  const parsed = deserializeState(serialized);
  assert.equal(parsed.isUnlocked, true);
  assert.deepEqual(parsed.collectedFlowers, ['f1', 'f2']);
  assert.equal(parsed.questDiscovered, true);

  const corrupted = deserializeState('{bad json');
  assert.equal(corrupted.isUnlocked, false);
  assert.deepEqual(corrupted.collectedFlowers, []);
});
