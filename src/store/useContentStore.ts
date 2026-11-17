import { create } from 'zustand';
import { DESTINATIONS_DATA, WorldDestination } from '../data/destinations';
import { BirthdayLetter, LETTERS_DATA } from '../data/letters';
import { MEMORY_BOOK_PAGES, MemoryBookPage } from '../data/memories';
import {
  CURIOUS_TAP_REACTIONS,
  HUB_CARD_REACTIONS,
  SECTION_DIALOGUES,
} from '../data/miniOktaf';
import { BirthdayVideoConfig, DEFAULT_VIDEO_CONFIG } from '../data/video';
import {
  DEFAULT_VINYL_CONFIG,
  DEFAULT_VINYL_PLAYLIST,
  VinylPlayerConfig,
  VinylTrack,
} from '../data/vinyl';
import { DEFAULT_VOICES_OF_LOVE, VoiceOfLoveEntry } from '../data/voices';
import { DEFAULT_SECRET_NOTES, type StorySecretNote } from '../data/hiddenMessages';
import { fetchSiteContent } from '../utils/adminApi';
import type { MiniOktafContentConfig, SiteContentPayload } from '../utils/adminContent';

interface ContentState {
  storyPages: MemoryBookPage[];
  destinations: WorldDestination[];
  letters: BirthdayLetter[];
  videoConfig: BirthdayVideoConfig;
  miniOktaf: MiniOktafContentConfig;
  voices: VoiceOfLoveEntry[];
  secretNotes: StorySecretNote[];
  vinylConfig: VinylPlayerConfig;
  vinylPlaylist: VinylTrack[];
  updatedAt: string;
  hydrated: boolean;

  hydrateFromServer: (adminView?: boolean) => Promise<void>;
  applyServerPayload: (payload: SiteContentPayload) => void;
}

export const useContentStore = create<ContentState>((set) => ({
  storyPages: MEMORY_BOOK_PAGES,
  destinations: DESTINATIONS_DATA,
  letters: LETTERS_DATA,
  videoConfig: DEFAULT_VIDEO_CONFIG,
  miniOktaf: {
    sectionDialogues: SECTION_DIALOGUES,
    hubCardReactions: HUB_CARD_REACTIONS,
    curiousTapReactions: CURIOUS_TAP_REACTIONS,
  },
  voices: DEFAULT_VOICES_OF_LOVE,
  secretNotes: DEFAULT_SECRET_NOTES,
  vinylConfig: DEFAULT_VINYL_CONFIG,
  vinylPlaylist: DEFAULT_VINYL_PLAYLIST,
  updatedAt: '',
  hydrated: false,

  hydrateFromServer: async (adminView = false) => {
    try {
      const payload = await fetchSiteContent(adminView);
      set({
        storyPages: payload.storyPages,
        destinations: payload.destinations,
        letters: payload.letters,
        videoConfig: payload.videoConfig,
        miniOktaf: payload.miniOktaf,
        voices: payload.voices,
        secretNotes: payload.secretNotes ?? DEFAULT_SECRET_NOTES,
        vinylConfig: payload.vinylConfig ?? DEFAULT_VINYL_CONFIG,
        vinylPlaylist: payload.vinylPlaylist ?? DEFAULT_VINYL_PLAYLIST,
        updatedAt: payload.updatedAt,
        hydrated: true,
      });
    } catch {
      // Fall back gracefully to bundled initial defaults if offline
      set({ hydrated: true });
    }
  },

  applyServerPayload: (payload) => {
    set({
      storyPages: payload.storyPages,
      destinations: payload.destinations,
      letters: payload.letters,
      videoConfig: payload.videoConfig,
      miniOktaf: payload.miniOktaf,
      voices: payload.voices,
      secretNotes: payload.secretNotes ?? DEFAULT_SECRET_NOTES,
      vinylConfig: payload.vinylConfig ?? DEFAULT_VINYL_CONFIG,
      vinylPlaylist: payload.vinylPlaylist ?? DEFAULT_VINYL_PLAYLIST,
      updatedAt: payload.updatedAt,
      hydrated: true,
    });
  },
}));
