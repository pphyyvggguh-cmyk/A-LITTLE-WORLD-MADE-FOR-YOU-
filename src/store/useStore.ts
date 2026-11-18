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

import {
  buildChapterUrlPath,
  getChapterTransitionDirection,
  resolveChapterFromLocation,
  resolvePostUnlockSection,
} from '../utils/storybookNav';
import {
  hasBookIntroPlayed,
  markBookIntroPlayed,
  shouldPlayBookIntroOnEntry,
} from '../utils/bookIntro';

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
  chapterDirection: 1 | -1;
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
  bookIntroActive: boolean;
  bookIntroRunId: number;

  unlockWithPassword: (password: string) => boolean;
  enterFromWelcome: () => void;
  navigateTo: (section: AppSection, options?: { syncHistory?: boolean }) => void;
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
  completeBookIntro: () => void;
  replayBookIntro: () => void;
}

const persisted = loadPersistedState();
const hasAutostart =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('autostart') === '1';

const initialUnlocked = hasAutostart || persisted.isUnlocked;
const initialRewardUnlocked = isFlowerQuestComplete(persisted.collectedFlowers);
const urlChapter =
  typeof window !== 'undefined'
    ? resolveChapterFromLocation(window.location.search, window.location.hash, initialRewardUnlocked)
    : null;
const initialSection: AppSection = initialUnlocked ? (urlChapter ?? 'hub') : 'password';

const initialBookIntroActive =
  typeof window !== 'undefined' &&
  shouldPlayBookIntroOnEntry({
    isUnlocked: initialUnlocked,
    currentSection: initialSection,
    search: window.location.search,
    pathname: window.location.pathname,
    alreadyPlayedInSession: hasBookIntroPlayed(),
  });

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

function isOnAdminRoute(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
}

export const useStore = create<AppState>((set, get) => ({
  currentSection: initialSection,
  chapterDirection: 1,
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
  bookIntroActive: initialBookIntroActive,
  bookIntroRunId: initialBookIntroActive ? 1 : 0,
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
        chapterDirection: 1 as const,
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
    if (typeof window !== 'undefined' && !isOnAdminRoute()) {
      window.history.replaceState({ chapter: 'welcome' }, '', '/');
    }
    return true;
  },

  enterFromWelcome: () => {
    const hub = useContentStore.getState().miniOktaf.sectionDialogues.hub ?? SECTION_DIALOGUES.hub;
    const playIntro =
      typeof window !== 'undefined'
        ? shouldPlayBookIntroOnEntry({
            isUnlocked: true,
            currentSection: 'hub',
            search: window.location.search,
            pathname: window.location.pathname,
            alreadyPlayedInSession: hasBookIntroPlayed(),
          })
        : false;

    set((state) => {
      const visited = state.visitedSections.includes('hub')
        ? state.visitedSections
        : [...state.visitedSections, 'hub'];
      const next = {
        ...state,
        isUnlocked: true,
        chapterDirection: 1 as const,
        currentSection: 'hub' as AppSection,
        visitedSections: visited,
        bookIntroActive: playIntro,
        bookIntroRunId: playIntro ? state.bookIntroRunId + 1 : state.bookIntroRunId,
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
    if (typeof window !== 'undefined' && !isOnAdminRoute()) {
      window.history.replaceState({ chapter: 'hub' }, '', buildChapterUrlPath('hub'));
    }
  },

  navigateTo: (section: AppSection, options) => {
    const stateNow = get();
    const rewardUnlocked = isFlowerQuestComplete(stateNow.collectedFlowers);

    // Guard final reward until 7/7 flowers are collected
    if (section === 'reward' && !rewardUnlocked) {
      set({ questModalOpen: true });
      return;
    }

    // Never allow Back navigation or chapter calls to re-enter password/welcome once unlocked
    const safeTarget = stateNow.isUnlocked
      ? resolvePostUnlockSection(section, true, rewardUnlocked)
      : section;

    if (safeTarget === stateNow.currentSection) {
      set({ questModalOpen: false });
      return;
    }

    const direction = getChapterTransitionDirection(
      stateNow.currentSection,
      safeTarget,
      rewardUnlocked
    );

    const liveDialogues = useContentStore.getState().miniOktaf.sectionDialogues;
    const dlg = liveDialogues[safeTarget] ?? SECTION_DIALOGUES[safeTarget] ?? SECTION_DIALOGUES.hub;
    set((state) => {
      const visited = state.visitedSections.includes(safeTarget)
        ? state.visitedSections
        : [...state.visitedSections, safeTarget];
      const next = {
        ...state,
        currentSection: safeTarget,
        chapterDirection: direction,
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

    const syncHistory = options?.syncHistory !== false;
    if (
      syncHistory &&
      typeof window !== 'undefined' &&
      !isOnAdminRoute() &&
      safeTarget !== 'password' &&
      safeTarget !== 'welcome'
    ) {
      window.history.pushState({ chapter: safeTarget }, '', buildChapterUrlPath(safeTarget));
    }
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
        chapterDirection: 1 as const,
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
    if (typeof window !== 'undefined' && !isOnAdminRoute()) {
      window.history.pushState({ chapter: 'reward' }, '', buildChapterUrlPath('reward'));
    }
  },

  lockExperience: () => {
    set((state) => {
      const next = {
        ...state,
        isUnlocked: false,
        bookIntroActive: false,
        chapterDirection: -1 as const,
        currentSection: 'password' as AppSection,
      };
      syncStorage(next);
      return next;
    });
    if (typeof window !== 'undefined' && !isOnAdminRoute()) {
      window.history.replaceState({ chapter: 'password' }, '', '/');
    }
  },

  completeBookIntro: () => {
    markBookIntroPlayed();
    set({ bookIntroActive: false });
  },

  replayBookIntro: () => {
    const stateNow = get();
    if (!stateNow.isUnlocked) return;
    if (stateNow.currentSection !== 'hub') {
      get().navigateTo('hub');
    }
    set((state) => ({
      bookIntroActive: true,
      bookIntroRunId: state.bookIntroRunId + 1,
      questModalOpen: false,
    }));
  },
}));
