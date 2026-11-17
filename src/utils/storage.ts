const PASSCODE_DIGEST = '9cf4c6cd:59a74f1d';
export const TOTAL_FLOWERS = 7;
export const STORAGE_KEY = 'wulan_little_world_state_v1';

export interface PersistedWorldState {
  isUnlocked: boolean;
  collectedFlowers: string[];
  questDiscovered: boolean;
  rewardClaimed: boolean;
  visitedSections: string[];
}

export const DEFAULT_PERSISTED_STATE: PersistedWorldState = {
  isUnlocked: false,
  collectedFlowers: [],
  questDiscovered: false,
  rewardClaimed: false,
  visitedSections: [],
};

function digestPasscode(raw: string): string {
  const input = `lw-wulan-2026::${raw}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let r = 0; r < 8; r++) {
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i);
      h1 ^= (c + r) & 0xff;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 = (Math.imul(h2 ^ c, 0x85ebca6b) + r) >>> 0;
    }
  }
  return `${h1.toString(16).padStart(8, '0')}:${h2.toString(16).padStart(8, '0')}`;
}

export function validatePassword(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  return digestPasscode(trimmed) === PASSCODE_DIGEST;
}

export function addCollectedFlower(
  current: string[],
  flowerId: string,
  validIds?: Set<string>
): { next: string[]; added: boolean } {
  if (validIds && !validIds.has(flowerId)) {
    return { next: current, added: false };
  }
  if (current.includes(flowerId)) {
    return { next: current, added: false };
  }
  return { next: [...current, flowerId], added: true };
}

export function isFlowerQuestComplete(collected: string[]): boolean {
  return collected.length >= TOTAL_FLOWERS;
}

export function serializeState(state: PersistedWorldState): string {
  return JSON.stringify(state);
}

export function deserializeState(raw: string | null): PersistedWorldState {
  if (!raw) return { ...DEFAULT_PERSISTED_STATE };
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedWorldState>;
    const uniqueFlowers = Array.isArray(parsed.collectedFlowers)
      ? Array.from(new Set(parsed.collectedFlowers.filter((id): id is string => typeof id === 'string')))
      : [];
    const visited = Array.isArray(parsed.visitedSections)
      ? Array.from(new Set(parsed.visitedSections.filter((s): s is string => typeof s === 'string')))
      : [];
    return {
      isUnlocked: Boolean(parsed.isUnlocked),
      collectedFlowers: uniqueFlowers,
      questDiscovered: Boolean(parsed.questDiscovered) || uniqueFlowers.length > 0,
      rewardClaimed: Boolean(parsed.rewardClaimed),
      visitedSections: visited,
    };
  } catch {
    return { ...DEFAULT_PERSISTED_STATE };
  }
}

export function loadPersistedState(): PersistedWorldState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_PERSISTED_STATE };
  }
  return deserializeState(window.localStorage.getItem(STORAGE_KEY));
}

export function savePersistedState(state: PersistedWorldState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeState(state));
  } catch {
    // Ignore quota / privacy mode storage errors gracefully
  }
}
