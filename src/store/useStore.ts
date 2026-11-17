import { create } from 'zustand';
import {
  CURIOUS_TAP_REACTIONS,
  OktafExpression,
  OktafPose,
  QUEST_DIALOGUES,
  SECTION_DIALOGUES,
} from '../data/miniOktaf';
import { FLOWERS_DATA, VALID_FLOWER_IDS } from '../data/flowers';
import {
  addCollectedFlower,
  isFlowerQuestComplete,
  loadPersistedState,
  savePersistedState,
  validatePassword,
} from '../utils/storage';

import { useContentStore } from './useContentStore';

export type AppSection =
  | 'password'
  | 'welcome'
  | 'hub'
  | 'story'
  | 'world'
  | 'letters'
  | 'video'
  | 'voices'
  | 'wishlist'
  | 'postcards'
  | 'calendar'
  | 'reward';

interface OktafUIState {
  pose: OktafPose;
  expression: OktafExpression;
  message: string;
  minimized: boolean;
  bubbleVisible: boolean;
}

interface AppState {
  currentSection: AppSection;
  isUnlocked: boolean;
  collectedFlowers: string[];
  questDiscovered: boolean;
  questModalOpen: boolean;
  rewardClaimed: boolean;
  visitedSections: string[];
  selectedMemoryId: string | null;
  selectedDestinationId: string;
  tapReactionIndex: number;
  oktaf: OktafUIState;
  justCollectedFlowerId: string | null;

  unlockWithPassword: (password: string) => boolean;
  enterFromWelcome: () => void;
  navigateTo: (section: AppSection) => void;
  setSelectedMemoryId: (id: string | null) => void;
  setSelectedDestinationId: (id: string) => void;
  setOktafDialogue: (pose: OktafPose, expression: OktafExpression, message: string) => void;
  toggleOktafMinimized: (minimized?: boolean) => void;
  dismissBubble: () => void;
  triggerOktafSingleTap: () => void;
  triggerOktafDoubleTap: () => void;
  setQuestModalOpen: (open: boolean) => void;
  collectFlower: (flowerId: string) => boolean;
  claimReward: () => void;
  lockExperience: () => void;
}

const persisted = loadPersistedState();
const hasAutostart =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('autostart') === '1';

const initialUnlocked = hasAutostart || persisted.isUnlocked;
const initialSection: AppSection = hasAutostart
  ? 'hub'
  : persisted.isUnlocked
    ? 'hub'
    : 'password';

const initialDialogue =
  SECTION_DIALOGUES[initialSection] ?? SECTION_DIALOGUES.hub;

function syncStorage(state: Pick<AppState, 'isUnlocked' | 'collectedFlowers' | 'questDiscovered' | 'rewardClaimed' | 'visitedSections'>) {
  savePersistedState({
    isUnlocked: state.isUnlocked,
    collectedFlowers: state.collectedFlowers,
    questDiscovered: state.questDiscovered,
    rewardClaimed: state.rewardClaimed,
    visitedSections: state.visitedSections,
  });
}

export const useStore = create<AppState>((set, get) => ({
  currentSection: initialSection,
  isUnlocked: initialUnlocked,
  collectedFlowers: persisted.collectedFlowers,
  questDiscovered: persisted.questDiscovered,
  questModalOpen: false,
  rewardClaimed: persisted.rewardClaimed,
  visitedSections: persisted.visitedSections,
  selectedMemoryId: null,
  selectedDestinationId: 'bandung',
  tapReactionIndex: 0,
  justCollectedFlowerId: null,
  oktaf: {
    pose: initialDialogue.pose,
    expression: initialDialogue.expression,
    message: initialDialogue.message,
    minimized: false,
    bubbleVisible: true,
  },

  unlockWithPassword: (password: string) => {
    if (!validatePassword(password)) {
      return false;
    }
    const dlg = useContentStore.getState().miniOktaf.sectionDialogues.welcome ?? SECTION_DIALOGUES.welcome;
    set((state) => {
      const next = {
        ...state,
        isUnlocked: true,
        currentSection: 'welcome' as AppSection,
        oktaf: {
          ...state.oktaf,
          pose: dlg.pose,
          expression: dlg.expression,
          message: dlg.message,
          minimized: false,
          bubbleVisible: true,
        },
      };
      syncStorage(next);
      return next;
    });
    return true;
  },

  enterFromWelcome: () => {
    const hub = useContentStore.getState().miniOktaf.sectionDialogues.hub ?? SECTION_DIALOGUES.hub;
    set((state) => {
      const visited = state.visitedSections.includes('hub')
        ? state.visitedSections
        : [...state.visitedSections, 'hub'];
      const next = {
        ...state,
        currentSection: 'hub' as AppSection,
        visitedSections: visited,
        oktaf: {
          ...state.oktaf,
          pose: hub.pose,
          expression: hub.expression,
          message: hub.message,
          bubbleVisible: true,
        },
      };
      syncStorage(next);
      return next;
    });
  },

  navigateTo: (section: AppSection) => {
    // Guard final reward until 7/7 flowers are collected
    if (section === 'reward' && !isFlowerQuestComplete(get().collectedFlowers)) {
      set({ questModalOpen: true });
      return;
    }

    const liveDialogues = useContentStore.getState().miniOktaf.sectionDialogues;
    const dlg = liveDialogues[section] ?? SECTION_DIALOGUES[section] ?? SECTION_DIALOGUES.hub;
    set((state) => {
      const visited = state.visitedSections.includes(section)
        ? state.visitedSections
        : [...state.visitedSections, section];
      const next = {
        ...state,
        currentSection: section,
        selectedMemoryId: null,
        questModalOpen: false,
        visitedSections: visited,
        oktaf: {
          ...state.oktaf,
          pose: dlg.pose,
          expression: dlg.expression,
          message: dlg.message,
          bubbleVisible: true,
        },
      };
      syncStorage(next);
      return next;
    });
  },

  setSelectedMemoryId: (id) => set({ selectedMemoryId: id }),

  setSelectedDestinationId: (id) => set({ selectedDestinationId: id }),

  setOktafDialogue: (pose, expression, message) =>
    set((state) => ({
      oktaf: {
        ...state.oktaf,
        pose,
        expression,
        message,
        bubbleVisible: true,
      },
    })),

  toggleOktafMinimized: (minimized) =>
    set((state) => ({
      oktaf: {
        ...state.oktaf,
        minimized: typeof minimized === 'boolean' ? minimized : !state.oktaf.minimized,
      },
    })),

  dismissBubble: () =>
    set((state) => ({
      oktaf: {
        ...state.oktaf,
        bubbleVisible: false,
      },
    })),

  triggerOktafSingleTap: () => {
    const idx = get().tapReactionIndex;
    const liveTaps = useContentStore.getState().miniOktaf.curiousTapReactions;
    const pool = liveTaps.length > 0 ? liveTaps : CURIOUS_TAP_REACTIONS;
    const reaction = pool[idx % pool.length];
    set((state) => ({
      tapReactionIndex: idx + 1,
      oktaf: {
        ...state.oktaf,
        pose: reaction.pose,
        expression: reaction.expression,
        message: reaction.message,
        minimized: false,
        bubbleVisible: true,
      },
    }));
  },

  triggerOktafDoubleTap: () => {
    const dlg = QUEST_DIALOGUES.discovered;
    set((state) => {
      const next = {
        ...state,
        questDiscovered: true,
        questModalOpen: true,
        oktaf: {
          ...state.oktaf,
          pose: dlg.pose,
          expression: dlg.expression,
          message: dlg.message,
          minimized: false,
          bubbleVisible: true,
        },
      };
      syncStorage(next);
      return next;
    });
  },

  setQuestModalOpen: (open) => set({ questModalOpen: open }),

  collectFlower: (flowerId: string) => {
    const { collectedFlowers } = get();
    const res = addCollectedFlower(collectedFlowers, flowerId, VALID_FLOWER_IDS);
    if (!res.added) return false;

    const flowerMeta = FLOWERS_DATA.find((f) => f.id === flowerId);
    const dlg = QUEST_DIALOGUES.flowerCollected(
      res.next.length,
      FLOWERS_DATA.length,
      flowerMeta?.indonesianName ?? 'bunga'
    );

    set((state) => {
      const next = {
        ...state,
        collectedFlowers: res.next,
        questDiscovered: true,
        justCollectedFlowerId: flowerId,
        oktaf: {
          ...state.oktaf,
          pose: dlg.pose,
          expression: dlg.expression,
          message: dlg.message,
          minimized: false,
          bubbleVisible: true,
        },
      };
      syncStorage(next);
      return next;
    });

    window.setTimeout(() => {
      if (get().justCollectedFlowerId === flowerId) {
        set({ justCollectedFlowerId: null });
      }
    }, 1800);

    return true;
  },

  claimReward: () => {
    if (!isFlowerQuestComplete(get().collectedFlowers)) return;
    const dlg =
      useContentStore.getState().miniOktaf.sectionDialogues.reward ?? SECTION_DIALOGUES.reward;
    set((state) => {
      const next = {
        ...state,
        rewardClaimed: true,
        questModalOpen: false,
        currentSection: 'reward' as AppSection,
        oktaf: {
          ...state.oktaf,
          pose: dlg.pose,
          expression: dlg.expression,
          message: dlg.message,
          minimized: false,
          bubbleVisible: true,
        },
      };
      syncStorage(next);
      return next;
    });
  },

  lockExperience: () => {
    set((state) => {
      const next = {
        ...state,
        isUnlocked: false,
        currentSection: 'password' as AppSection,
      };
      syncStorage(next);
      return next;
    });
  },
}));
