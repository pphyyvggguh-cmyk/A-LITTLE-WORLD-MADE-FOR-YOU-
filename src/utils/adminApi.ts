import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  ref as storageRef,
} from 'firebase/storage';
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
import {
  DEFAULT_ACCESS_CONFIG,
  AccessConfig,
  PRIMARY_ADMIN_EMAIL,
  WishlistCategory,
  WishlistEntry,
  WishlistStatus,
  WishlistVisibility,
} from '../data/wishlist';
import {
  PostcardDesignTheme,
  PostcardEnvelope,
  PostcardRecipient,
  PostcardSecret,
  PostcardStampStyle,
  PostcardVisibility,
} from '../data/postcards';
import { auth, db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import {
  collectMediaUsageMap,
  MiniOktafContentConfig,
  normalizeVoicesOrder,
  sanitizeUploadBasename,
  SiteContentPayload,
  validateMediaFilenameAndType,
  validateStoryBookPages,
} from './adminContent';
import { executeSharedUpload } from './uploadTransport';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  normalizeVinylOrder,
} from './vinyl';
import {
  buildAllowedEmailsList,
  isAuthorizedAdminEmail,
  normalizeEmail,
  validateWishlistFormInput,
} from './wishlist';
import {
  formatUnlockDateIndonesian,
  normalizePostcardOrder,
  validatePostcardInput,
} from './postcards';
import { DEFAULT_SECRET_NOTES, type StorySecretNote } from '../data/hiddenMessages';
import {
  normalizeSecretNote,
  normalizeSecretNoteId,
  type SecretNoteValidationInput,
  sortSecretNotes,
  validateSecretNoteInput,
} from './secretNotes';

export interface MediaAssetItem {
  id?: string;
  url: string;
  storagePath?: string;
  filename: string;
  category: 'friends-audio' | 'images' | 'audio' | 'videos' | 'wishlist' | 'bundled';
  kind: 'image' | 'audio' | 'video';
  sizeBytes: number;
  updatedAt: string;
  deletable: boolean;
  usedIn: string[];
}

export interface UploadMediaResult {
  id: string;
  url: string;
  storagePath: string;
  filename: string;
  kind: 'image' | 'audio' | 'video';
  sizeBytes: number;
}

function timestampToIso(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return '';
}

function requireVerifiedAdminUser() {
  const user = auth.currentUser;
  if (!user || !isAuthorizedAdminEmail(user.email, user.emailVerified)) {
    throw new Error('Akses ditolak: harap masuk menggunakan akun Google admin terverifikasi (oktafmbul0@gmail.com).');
  }
  return user;
}

function requireVerifiedUser() {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !user.email) {
    throw new Error('Silakan masuk dengan akun Google yang terverifikasi terlebih dahulu.');
  }
  return user;
}

function normalizeDocId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  return cleaned || `item-${Date.now()}`;
}

export async function fetchSiteContent(adminView = false): Promise<SiteContentPayload> {
  const defaults: SiteContentPayload = {
    storyPages: structuredClone(MEMORY_BOOK_PAGES),
    destinations: structuredClone(DESTINATIONS_DATA),
    letters: structuredClone(LETTERS_DATA),
    videoConfig: structuredClone(DEFAULT_VIDEO_CONFIG),
    miniOktaf: {
      sectionDialogues: structuredClone(SECTION_DIALOGUES),
      hubCardReactions: structuredClone(HUB_CARD_REACTIONS),
      curiousTapReactions: structuredClone(CURIOUS_TAP_REACTIONS),
    },
    voices: structuredClone(DEFAULT_VOICES_OF_LOVE),
    secretNotes: structuredClone(DEFAULT_SECRET_NOTES),
    vinylConfig: structuredClone(DEFAULT_VINYL_CONFIG),
    vinylPlaylist: structuredClone(DEFAULT_VINYL_PLAYLIST),
    updatedAt: '',
  };

  const sectionIds = ['story', 'world', 'letters', 'video', 'miniOktaf', 'vinyl'] as const;
  const sectionSnaps = await Promise.all(
    sectionIds.map((id) => getDoc(doc(db, 'siteContent', id)).catch(() => null))
  );

  let latestIso = '';
  const trackLatest = (iso: string) => {
    if (iso && (!latestIso || iso > latestIso)) latestIso = iso;
  };

  const [storySnap, worldSnap, lettersSnap, videoSnap, oktafSnap, vinylSnap] = sectionSnaps;
  let secretNotesSeededInDb = false;

  if (storySnap?.exists()) {
    const data = storySnap.data();
    const pages = data?.payload?.pages;
    if (Array.isArray(pages) && pages.length === 17) {
      defaults.storyPages = pages as MemoryBookPage[];
    }
    secretNotesSeededInDb = Boolean(data?.payload?.secretNotesSeeded);
    trackLatest(timestampToIso(data?.updatedAt));
  }

  if (worldSnap?.exists()) {
    const data = worldSnap.data();
    const destinations = data?.payload?.destinations;
    if (Array.isArray(destinations) && destinations.length > 0) {
      defaults.destinations = destinations as WorldDestination[];
    }
    trackLatest(timestampToIso(data?.updatedAt));
  }

  if (lettersSnap?.exists()) {
    const data = lettersSnap.data();
    const letters = data?.payload?.letters;
    if (Array.isArray(letters)) {
      defaults.letters = letters as BirthdayLetter[];
    }
    trackLatest(timestampToIso(data?.updatedAt));
  }

  if (videoSnap?.exists()) {
    const data = videoSnap.data();
    if (data?.payload?.videoConfig) {
      defaults.videoConfig = { ...defaults.videoConfig, ...data.payload.videoConfig };
    }
    trackLatest(timestampToIso(data?.updatedAt));
  }

  if (oktafSnap?.exists()) {
    const data = oktafSnap.data();
    const p = data?.payload;
    if (p) {
      defaults.miniOktaf = {
        sectionDialogues: {
          ...defaults.miniOktaf.sectionDialogues,
          ...(p.sectionDialogues || {}),
        },
        hubCardReactions: {
          ...defaults.miniOktaf.hubCardReactions,
          ...(p.hubCardReactions || {}),
        },
        curiousTapReactions: Array.isArray(p.curiousTapReactions)
          ? p.curiousTapReactions
          : defaults.miniOktaf.curiousTapReactions,
      };
    }
    trackLatest(timestampToIso(data?.updatedAt));
  }

  const vinylSeededInDb = Boolean(vinylSnap?.exists());
  if (vinylSnap?.exists()) {
    const data = vinylSnap.data();
    if (data?.payload?.vinylConfig) {
      defaults.vinylConfig = { ...defaults.vinylConfig, ...data.payload.vinylConfig };
    }
    trackLatest(timestampToIso(data?.updatedAt));
  }

  try {
    const voicesQuery = adminView
      ? collection(db, 'voices')
      : query(collection(db, 'voices'), where('permissionConfirmed', '==', true));
    const voicesDocs = await getDocs(voicesQuery);
    const loadedVoices: VoiceOfLoveEntry[] = voicesDocs.docs.map((d) => {
      const raw = d.data();
      const updated = timestampToIso(raw.updatedAt);
      trackLatest(updated);
      return {
        id: raw.id || d.id,
        name: raw.name || '',
        flowerType: raw.flowerType || 'sakura',
        audioUrl: raw.audioUrl || '',
        audioFileName: raw.audioFileName || '',
        photoUrl: raw.photoUrl || '',
        message: raw.message || '',
        order: typeof raw.order === 'number' ? raw.order : 1,
        permissionConfirmed: Boolean(raw.permissionConfirmed),
        createdAt: timestampToIso(raw.createdAt),
        updatedAt: updated,
      };
    });
    defaults.voices = normalizeVoicesOrder(loadedVoices);
  } catch {
    // Keep empty defaults if offline or unavailable
  }

  try {
    const vinylQuery = adminView
      ? collection(db, 'vinylPlaylist')
      : query(collection(db, 'vinylPlaylist'), where('isPublished', '==', true));
    const trackDocs = await getDocs(vinylQuery);
    const loadedTracks: VinylTrack[] = trackDocs.docs.map((d) => {
      const raw = d.data();
      const updated = timestampToIso(raw.updatedAt);
      trackLatest(updated);
      return {
        id: raw.id || d.id,
        youtubeUrl: raw.youtubeUrl || '',
        youtubeVideoId: raw.youtubeVideoId || '',
        title: raw.title || '',
        artist: raw.artist || '',
        thumbnailUrl: raw.thumbnailUrl || '',
        order: typeof raw.order === 'number' ? raw.order : 1,
        isPublished: Boolean(raw.isPublished),
        ownerUid: raw.ownerUid,
        createdAt: timestampToIso(raw.createdAt),
        updatedAt: updated,
      };
    });
    if (loadedTracks.length > 0 || vinylSeededInDb) {
      defaults.vinylPlaylist = normalizeVinylOrder(loadedTracks);
    }
  } catch {
    // Keep DEFAULT_VINYL_PLAYLIST fallback if offline
  }

  try {
    const secretNotesQuery = adminView
      ? collection(db, 'secretNotes')
      : query(collection(db, 'secretNotes'), where('enabled', '==', true));
    const noteDocs = await getDocs(secretNotesQuery);
    const loadedNotes: StorySecretNote[] = noteDocs.docs.map((d) => {
      const raw = d.data();
      const updated = timestampToIso(raw.updatedAt);
      trackLatest(updated);
      return normalizeSecretNote({
        id: String(raw.id || d.id),
        title: String(raw.title || ''),
        hint: String(raw.hint || ''),
        recipient: String(raw.recipient || ''),
        message: String(raw.message || ''),
        signature: String(raw.signature || ''),
        pageNumber: typeof raw.pageNumber === 'number' ? raw.pageNumber : 1,
        enabled: Boolean(raw.enabled),
        sealColor: String(raw.sealColor || '#A6533B'),
        stampText: String(raw.stampText || 'SECRET NOTE'),
        createdAt: timestampToIso(raw.createdAt),
        updatedAt: updated,
      });
    });
    if (loadedNotes.length > 0 || secretNotesSeededInDb) {
      defaults.secretNotes = sortSecretNotes(loadedNotes);
    } else if (!adminView) {
      defaults.secretNotes = sortSecretNotes(DEFAULT_SECRET_NOTES.filter((n) => n.enabled));
    }
  } catch {
    // Keep DEFAULT_SECRET_NOTES fallback if offline
  }

  defaults.updatedAt = latestIso;
  return defaults;
}

async function upsertSiteSection(
  sectionId: 'story' | 'world' | 'letters' | 'video' | 'miniOktaf' | 'vinyl',
  payload: Record<string, unknown>
): Promise<SiteContentPayload> {
  const user = requireVerifiedAdminUser();
  const docPath = `siteContent/${sectionId}`;
  const docRef = doc(db, 'siteContent', sectionId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        payload,
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        sectionId,
        payload,
        updatedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
  return fetchSiteContent(true);
}

export async function saveStoryPages(storyPages: MemoryBookPage[]): Promise<SiteContentPayload> {
  const check = validateStoryBookPages(storyPages);
  if (!check.ok) {
    throw new Error(check.error);
  }
  const existingSnap = await getDoc(doc(db, 'siteContent', 'story')).catch(() => null);
  const preserveSeedFlag = Boolean(existingSnap?.exists() && existingSnap.data()?.payload?.secretNotesSeeded);
  return upsertSiteSection(
    'story',
    preserveSeedFlag ? { pages: check.pages, secretNotesSeeded: true } : { pages: check.pages }
  );
}

export async function saveWorldDestinations(
  destinations: WorldDestination[]
): Promise<SiteContentPayload> {
  if (!Array.isArray(destinations) || destinations.length === 0) {
    throw new Error('Daftar destinasi tidak boleh kosong.');
  }
  return upsertSiteSection('world', { destinations });
}

export async function saveBirthdayLetters(letters: BirthdayLetter[]): Promise<SiteContentPayload> {
  if (!Array.isArray(letters)) {
    throw new Error('Daftar surat tidak valid.');
  }
  return upsertSiteSection('letters', { letters });
}

export async function saveBirthdayVideo(
  videoConfig: BirthdayVideoConfig
): Promise<SiteContentPayload> {
  if (!videoConfig || typeof videoConfig.title !== 'string') {
    throw new Error('Konfigurasi video tidak valid.');
  }
  return upsertSiteSection('video', { videoConfig });
}

export async function saveMiniOktafContent(
  miniOktaf: MiniOktafContentConfig
): Promise<SiteContentPayload> {
  if (!miniOktaf || !miniOktaf.sectionDialogues || !Array.isArray(miniOktaf.curiousTapReactions)) {
    throw new Error('Data dialog Mini Oktaf tidak valid.');
  }
  return upsertSiteSection('miniOktaf', { ...miniOktaf });
}

export async function saveVinylConfig(
  vinylConfig: VinylPlayerConfig
): Promise<SiteContentPayload> {
  return upsertSiteSection('vinyl', { vinylConfig });
}

export async function saveVoicesOfLove(voices: VoiceOfLoveEntry[]): Promise<SiteContentPayload> {
  const user = requireVerifiedAdminUser();
  const normalized = normalizeVoicesOrder(voices);

  for (const entry of normalized) {
    if (!entry.name.trim()) {
      throw new Error('Setiap kartu sahabat wajib memiliki nama tampilan.');
    }
    if (!entry.audioUrl.trim()) {
      throw new Error(`Unggah file audio MP3/OGG untuk "${entry.name}" sebelum menyimpan.`);
    }
    if (!entry.permissionConfirmed) {
      throw new Error(`Centang konfirmasi izin rekaman asli untuk "${entry.name}" terlebih dahulu.`);
    }
  }

  try {
    const existingSnap = await getDocs(collection(db, 'voices'));
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));
    const nextIds = new Set<string>();
    const batch = writeBatch(db);

    for (const entry of normalized) {
      const docId = normalizeDocId(entry.id);
      nextIds.add(docId);
      const docRef = doc(db, 'voices', docId);
      if (existingIds.has(docId)) {
        batch.update(docRef, {
          name: entry.name.trim().slice(0, 120),
          flowerType: entry.flowerType,
          audioUrl: entry.audioUrl.trim().slice(0, 1000),
          audioFileName: (entry.audioFileName || '').trim().slice(0, 200),
          photoUrl: (entry.photoUrl || '').trim().slice(0, 1000),
          message: (entry.message || '').trim().slice(0, 1500),
          order: entry.order,
          permissionConfirmed: entry.permissionConfirmed,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(docRef, {
          id: docId,
          name: entry.name.trim().slice(0, 120),
          flowerType: entry.flowerType,
          audioUrl: entry.audioUrl.trim().slice(0, 1000),
          audioFileName: (entry.audioFileName || '').trim().slice(0, 200),
          photoUrl: (entry.photoUrl || '').trim().slice(0, 1000),
          message: (entry.message || '').trim().slice(0, 1500),
          order: entry.order,
          permissionConfirmed: entry.permissionConfirmed,
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    for (const oldId of existingIds) {
      if (!nextIds.has(oldId)) {
        batch.delete(doc(db, 'voices', oldId));
      }
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'voices');
  }

  return fetchSiteContent(true);
}

export async function saveVinylPlaylist(tracks: VinylTrack[]): Promise<SiteContentPayload> {
  const user = requireVerifiedAdminUser();
  const normalized = normalizeVinylOrder(tracks);

  for (const track of normalized) {
    const vid = extractYouTubeVideoId(track.youtubeUrl || track.youtubeVideoId);
    if (!vid) {
      throw new Error(`Link YouTube untuk "${track.title || 'Lagu'}" tidak valid.`);
    }
    if (!track.title.trim()) {
      throw new Error('Setiap lagu di Vinyl Player wajib memiliki judul.');
    }
  }

  try {
    const existingSnap = await getDocs(collection(db, 'vinylPlaylist'));
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));
    const nextIds = new Set<string>();
    const batch = writeBatch(db);

    for (const track of normalized) {
      const docId = normalizeDocId(track.id);
      const vid = extractYouTubeVideoId(track.youtubeUrl || track.youtubeVideoId)!;
      nextIds.add(docId);
      const docRef = doc(db, 'vinylPlaylist', docId);
      const thumb = (track.thumbnailUrl || '').trim() || getYouTubeThumbnailUrl(vid);

      if (existingIds.has(docId)) {
        batch.update(docRef, {
          youtubeUrl: track.youtubeUrl.trim().slice(0, 500),
          youtubeVideoId: vid,
          title: track.title.trim().slice(0, 140),
          artist: (track.artist || '').trim().slice(0, 120),
          thumbnailUrl: thumb.slice(0, 1000),
          order: track.order,
          isPublished: track.isPublished,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(docRef, {
          id: docId,
          youtubeUrl: track.youtubeUrl.trim().slice(0, 500),
          youtubeVideoId: vid,
          title: track.title.trim().slice(0, 140),
          artist: (track.artist || '').trim().slice(0, 120),
          thumbnailUrl: thumb.slice(0, 1000),
          order: track.order,
          isPublished: track.isPublished,
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    for (const oldId of existingIds) {
      if (!nextIds.has(oldId)) {
        batch.delete(doc(db, 'vinylPlaylist', oldId));
      }
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'vinylPlaylist');
  }

  return fetchSiteContent(true);
}

// --- Media Library & Firebase Storage Uploads ---

const STATIC_BUNDLED_MEDIA: Omit<MediaAssetItem, 'usedIn'>[] = [
  ...Array.from({ length: 17 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return {
      url: `/assets/photos/memories/memory-${num}.svg`,
      filename: `memory-${num}.svg`,
      category: 'bundled' as const,
      kind: 'image' as const,
      sizeBytes: 0,
      updatedAt: '',
      deletable: false,
    };
  }),
  ...Array.from({ length: 20 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return {
      url: `/assets/photos/destinations/dest-${num}.svg`,
      filename: `dest-${num}.svg`,
      category: 'bundled' as const,
      kind: 'image' as const,
      sizeBytes: 0,
      updatedAt: '',
      deletable: false,
    };
  }),
];

export async function fetchMediaLibrary(): Promise<MediaAssetItem[]> {
  requireVerifiedAdminUser();
  const content = await fetchSiteContent(true);
  const usageMap = collectMediaUsageMap(content);

  let cloudAssets: MediaAssetItem[] = [];
  try {
    const snap = await getDocs(collection(db, 'mediaAssets'));
    cloudAssets = snap.docs
      .map((d) => {
        const raw = d.data();
        const url = String(raw.url || '');
        return {
          id: d.id,
          url,
          storagePath: String(raw.storagePath || ''),
          filename: String(raw.filename || ''),
          category: (raw.category || 'images') as MediaAssetItem['category'],
          kind: (raw.kind || 'image') as MediaAssetItem['kind'],
          sizeBytes: typeof raw.sizeBytes === 'number' ? raw.sizeBytes : 0,
          updatedAt: timestampToIso(raw.updatedAt),
          deletable: true,
          usedIn: usageMap[url] || [],
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'mediaAssets');
  }

  const bundledWithUsage: MediaAssetItem[] = STATIC_BUNDLED_MEDIA.map((item) => ({
    ...item,
    usedIn: usageMap[item.url] || [],
  }));

  return [...cloudAssets, ...bundledWithUsage];
}

export async function uploadMediaFile(
  file: File,
  category: 'friends-audio' | 'images' | 'audio' | 'videos' | 'auto',
  onProgress?: (percent: number) => void,
  replaceUrl?: string
): Promise<UploadMediaResult> {
  const user = requireVerifiedAdminUser();
  if (file.size > 55 * 1024 * 1024) {
    throw new Error('Ukuran file maksimal 55 MB.');
  }

  const expectedKind =
    category === 'friends-audio' || category === 'audio'
      ? 'audio'
      : category === 'images'
        ? 'image'
        : category === 'videos'
          ? 'video'
          : undefined;

  const check = validateMediaFilenameAndType(file.name, file.type, expectedKind);
  if (!check.ok) {
    throw new Error(check.error);
  }

  const resolvedCategory: 'friends-audio' | 'images' | 'audio' | 'videos' =
    category === 'friends-audio' && check.kind === 'audio'
      ? 'friends-audio'
      : check.kind === 'image'
        ? 'images'
        : check.kind === 'audio'
          ? 'audio'
          : 'videos';

  const safeBase = sanitizeUploadBasename(file.name);
  const stamp = Date.now().toString(36);
  let assetId = normalizeDocId(`media-${safeBase}-${stamp}`);
  let storedFilename = `${safeBase}-${stamp}${check.ext}`;
  let targetPath = `site-media/${resolvedCategory}/${storedFilename}`;
  let isReplacingExisting = false;

  if (replaceUrl) {
    try {
      const snap = await getDocs(collection(db, 'mediaAssets'));
      const matched = snap.docs.find((d) => d.data().url === replaceUrl);
      if (matched) {
        assetId = matched.id;
        const existingPath = String(matched.data().storagePath || '');
        if (existingPath && existingPath.toLowerCase().endsWith(check.ext)) {
          targetPath = existingPath;
          storedFilename = String(matched.data().filename || storedFilename);
          isReplacingExisting = true;
        }
      }
    } catch {
      // Fallback to uploading a new file object
    }
  }

  const idToken = await user.getIdToken();
  const uploaded = await executeSharedUpload({
    file,
    scope: 'site-media',
    folderOrTargetId: resolvedCategory,
    firebaseStoragePath: targetPath,
    preferredFilename: isReplacingExisting ? storedFilename : undefined,
    idToken,
    storage,
    storageBucket: storage.app.options.storageBucket,
    onProgress,
  });

  const downloadUrl = uploaded.url;
  const finalStoragePath = uploaded.storagePath;
  const finalFilename = uploaded.filename;

  const metaRef = doc(db, 'mediaAssets', assetId);
  try {
    if (isReplacingExisting) {
      await updateDoc(metaRef, {
        url: downloadUrl,
        storagePath: finalStoragePath,
        filename: finalFilename,
        category: resolvedCategory,
        kind: check.kind,
        sizeBytes: file.size,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(metaRef, {
        id: assetId,
        url: downloadUrl,
        storagePath: finalStoragePath,
        filename: finalFilename,
        category: resolvedCategory,
        kind: check.kind,
        sizeBytes: file.size,
        uploaderUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `mediaAssets/${assetId}`);
  }

  return {
    id: assetId,
    url: downloadUrl,
    storagePath: finalStoragePath,
    filename: finalFilename,
    kind: check.kind,
    sizeBytes: file.size,
  };
}

export async function deleteMediaFile(url: string): Promise<void> {
  const user = requireVerifiedAdminUser();
  try {
    const snap = await getDocs(collection(db, 'mediaAssets'));
    const matched = snap.docs.find((d) => d.data().url === url);
    if (!matched) {
      throw new Error('Hanya file yang diunggah melalui Media Library yang dapat dihapus.');
    }
    const storagePath = String(matched.data().storagePath || '');
    if (storagePath.startsWith('app-server/uploads/')) {
      const idToken = await user.getIdToken();
      await fetch(`/api/upload?storagePath=${encodeURIComponent(storagePath)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      }).catch(() => {});
    } else if (storagePath) {
      await deleteObject(storageRef(storage, storagePath)).catch(() => {});
    }
    await deleteDoc(doc(db, 'mediaAssets', matched.id));
  } catch (err) {
    if (err instanceof Error && err.message.includes('Hanya file')) throw err;
    handleFirestoreError(err, OperationType.DELETE, 'mediaAssets');
  }
}

// --- Access Config, Our Future Wishlist & Postcards From The Future API ---

function mapWishlistDoc(id: string, raw: Record<string, unknown>): WishlistEntry {
  const rawVis = String(raw.visibility || 'private');
  const visibility: WishlistVisibility =
    rawVis === 'public' || rawVis === 'shared' || rawVis === 'private' || rawVis === 'couple'
      ? (rawVis as WishlistVisibility)
      : 'private';

  return {
    id: String(raw.id || id),
    title: String(raw.title || ''),
    description: String(raw.description || ''),
    category: (raw.category || 'our') as WishlistCategory,
    creatorUid: String(raw.creatorUid || ''),
    creatorEmail: String(raw.creatorEmail || ''),
    creatorRole: (raw.creatorRole || 'oktaf') as 'oktaf' | 'wulan',
    creatorName: String(raw.creatorName || 'Oktaf'),
    targetDate: raw.targetDate ? String(raw.targetDate) : '',
    status: (raw.status || 'dreaming') as WishlistStatus,
    photos: Array.isArray(raw.photos) ? (raw.photos as string[]) : [],
    completionStory: String(raw.completionStory || ''),
    completedAt: raw.completedAt ? String(raw.completedAt) : '',
    allowedEmails: Array.isArray(raw.allowedEmails) ? (raw.allowedEmails as string[]) : [],
    visibility,
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
  };
}

function mapPostcardEnvelopeDoc(id: string, raw: Record<string, unknown>): PostcardEnvelope {
  const rawVis = String(raw.visibility || 'private');
  const visibility: PostcardVisibility =
    rawVis === 'public' || rawVis === 'shared' ? rawVis : 'private';
  const unlockIso = timestampToIso(raw.unlockAt);

  return {
    id: String(raw.id || id),
    title: String(raw.title || ''),
    senderUid: String(raw.senderUid || ''),
    senderEmail: String(raw.senderEmail || ''),
    senderRole: (raw.senderRole || 'oktaf') as 'oktaf' | 'wulan',
    senderName: String(raw.senderName || 'Oktaf'),
    recipient: (raw.recipient || 'wulan') as PostcardRecipient,
    visibility,
    unlockAt: unlockIso,
    unlockDateLabel: String(raw.unlockDateLabel || formatUnlockDateIndonesian(unlockIso)),
    createdDateLabel: String(raw.createdDateLabel || ''),
    location: String(raw.location || ''),
    stampStyle: (raw.stampStyle || 'par_avion') as PostcardStampStyle,
    designTheme: (raw.designTheme || 'vintage_cream') as PostcardDesignTheme,
    isOpened: Boolean(raw.isOpened),
    openedAt: raw.openedAt ? timestampToIso(raw.openedAt) : '',
    openedByUid: raw.openedByUid ? String(raw.openedByUid) : '',
    order: typeof raw.order === 'number' ? raw.order : 1,
    allowedEmails: Array.isArray(raw.allowedEmails) ? (raw.allowedEmails as string[]) : [],
    createdAt: timestampToIso(raw.createdAt),
    updatedAt: timestampToIso(raw.updatedAt),
  };
}

export async function saveAccessConfig(nextConfig: {
  wulanEmail: string;
  wishlistPrivacyMode: 'couple-only' | 'admin-only';
}): Promise<AccessConfig> {
  const user = requireVerifiedAdminUser();
  const normalizedWulan = normalizeEmail(nextConfig.wulanEmail);
  const configRef = doc(db, 'config', 'access');

  try {
    const existing = await getDoc(configRef);
    if (existing.exists()) {
      await updateDoc(configRef, {
        wulanEmail: normalizedWulan,
        wishlistPrivacyMode: nextConfig.wishlistPrivacyMode,
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(configRef, {
        configId: 'access',
        adminEmail: PRIMARY_ADMIN_EMAIL,
        oktafEmail: PRIMARY_ADMIN_EMAIL,
        wulanEmail: normalizedWulan,
        wishlistPrivacyMode: nextConfig.wishlistPrivacyMode,
        updatedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const allowedEmails = buildAllowedEmailsList({
      oktafEmail: PRIMARY_ADMIN_EMAIL,
      wulanEmail: normalizedWulan,
    });

    const [wishesSnap, postcardsSnap] = await Promise.all([
      getDocs(collection(db, 'wishlist')),
      getDocs(collection(db, 'postcards')),
    ]);

    if (!wishesSnap.empty || !postcardsSnap.empty) {
      const batch = writeBatch(db);
      for (const wishDoc of wishesSnap.docs) {
        batch.update(wishDoc.ref, {
          allowedEmails,
          updatedAt: serverTimestamp(),
        });
      }
      for (const postcardDoc of postcardsSnap.docs) {
        batch.update(postcardDoc.ref, {
          allowedEmails,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'config/access');
  }

  return {
    configId: 'access',
    adminEmail: PRIMARY_ADMIN_EMAIL,
    oktafEmail: PRIMARY_ADMIN_EMAIL,
    wulanEmail: normalizedWulan,
    wishlistPrivacyMode: nextConfig.wishlistPrivacyMode,
    updatedBy: user.uid,
  };
}

export function subscribeWishlistEntries(
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null,
  onEntries: (entries: WishlistEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  const emitMerged = (buckets: Map<string, Map<string, WishlistEntry>>) => {
    const merged = new Map<string, WishlistEntry>();
    for (const bucket of buckets.values()) {
      for (const [id, entry] of bucket.entries()) {
        merged.set(id, entry);
      }
    }
    const items = Array.from(merged.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    onEntries(items);
  };

  if (role === 'oktaf') {
    return onSnapshot(
      collection(db, 'wishlist'),
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => mapWishlistDoc(d.id, d.data() as Record<string, unknown>))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        onEntries(items);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'wishlist');
        } catch (wrapped) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );
  }

  const buckets = new Map<string, Map<string, WishlistEntry>>([
    ['public', new Map()],
    ['private', new Map()],
  ]);

  const unsubPublic = onSnapshot(
    query(collection(db, 'wishlist'), where('visibility', '==', 'public')),
    (snapshot) => {
      const next = new Map<string, WishlistEntry>();
      for (const d of snapshot.docs) {
        next.set(d.id, mapWishlistDoc(d.id, d.data() as Record<string, unknown>));
      }
      buckets.set('public', next);
      emitMerged(buckets);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'wishlist');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  let unsubCouple: (() => void) | null = null;
  if (role === 'wulan' && userEmail) {
    unsubCouple = onSnapshot(
      query(
        collection(db, 'wishlist'),
        where('allowedEmails', 'array-contains', normalizeEmail(userEmail))
      ),
      (snapshot) => {
        const next = new Map<string, WishlistEntry>();
        for (const d of snapshot.docs) {
          next.set(d.id, mapWishlistDoc(d.id, d.data() as Record<string, unknown>));
        }
        buckets.set('private', next);
        emitMerged(buckets);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'wishlist');
        } catch (wrapped) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );
  }

  return () => {
    unsubPublic();
    if (unsubCouple) unsubCouple();
  };
}

export async function createWishlistEntry(input: {
  id?: string;
  title: string;
  description: string;
  category: WishlistCategory;
  targetDate?: string;
  status: WishlistStatus;
  photos: string[];
  completionStory: string;
  visibility?: WishlistVisibility;
  role: 'oktaf' | 'wulan';
  accessConfig: AccessConfig;
}): Promise<string> {
  const user = requireVerifiedUser();
  const visibility: WishlistVisibility = input.visibility || 'private';
  const check = validateWishlistFormInput({ ...input, visibility });
  if (!check.ok) {
    throw new Error(check.error);
  }

  const wishId = input.id
    ? normalizeDocId(input.id)
    : normalizeDocId(`wish-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const allowedEmails = buildAllowedEmailsList({
    oktafEmail: input.accessConfig.oktafEmail || PRIMARY_ADMIN_EMAIL,
    wulanEmail: input.accessConfig.wulanEmail,
  });

  const completedAt =
    input.status === 'completed' ? new Date().toISOString() : '';

  try {
    await setDoc(doc(db, 'wishlist', wishId), {
      id: wishId,
      title: input.title.trim().slice(0, 160),
      description: input.description.trim().slice(0, 2000),
      category: input.category,
      creatorUid: user.uid,
      creatorEmail: normalizeEmail(user.email),
      creatorRole: input.role,
      creatorName: input.role === 'oktaf' ? 'Oktaf' : 'Wulan',
      targetDate: (input.targetDate || '').trim().slice(0, 40),
      status: input.status,
      photos: input.photos.slice(0, 6),
      completionStory: input.completionStory.trim().slice(0, 3000),
      completedAt,
      allowedEmails,
      visibility,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `wishlist/${wishId}`);
  }

  return wishId;
}

export async function updateWishlistEntry(
  wishId: string,
  existingStatus: WishlistStatus,
  patch: {
    title: string;
    description: string;
    category: WishlistCategory;
    targetDate?: string;
    status: WishlistStatus;
    photos: string[];
    completionStory: string;
    completedAt?: string;
    visibility?: WishlistVisibility;
  },
  role: 'oktaf' | 'wulan'
): Promise<void> {
  requireVerifiedUser();
  const check = validateWishlistFormInput(patch);
  if (!check.ok) {
    throw new Error(check.error);
  }

  const docRef = doc(db, 'wishlist', wishId);
  try {
    if (role !== 'oktaf' && existingStatus === 'completed') {
      // Respect terminal state locking: only completion story and memory photos may be refined
      await updateDoc(docRef, {
        photos: patch.photos.slice(0, 6),
        completionStory: patch.completionStory.trim().slice(0, 3000),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const completedAt =
      patch.status === 'completed'
        ? patch.completedAt || new Date().toISOString()
        : '';

    const updateFields: Record<string, unknown> = {
      title: patch.title.trim().slice(0, 160),
      description: patch.description.trim().slice(0, 2000),
      category: patch.category,
      targetDate: (patch.targetDate || '').trim().slice(0, 40),
      status: patch.status,
      photos: patch.photos.slice(0, 6),
      completionStory: patch.completionStory.trim().slice(0, 3000),
      completedAt,
      updatedAt: serverTimestamp(),
    };

    if (patch.visibility) {
      updateFields.visibility = patch.visibility;
    }

    await updateDoc(docRef, updateFields);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `wishlist/${wishId}`);
  }
}

export async function updateWishlistVisibility(
  wishId: string,
  visibility: WishlistVisibility
): Promise<void> {
  requireVerifiedAdminUser();
  try {
    await updateDoc(doc(db, 'wishlist', wishId), {
      visibility,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `wishlist/${wishId}`);
  }
}

export async function deleteWishlistEntry(wishId: string): Promise<void> {
  requireVerifiedUser();
  try {
    await deleteDoc(doc(db, 'wishlist', wishId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `wishlist/${wishId}`);
  }
}

export async function uploadWishlistPhoto(
  wishId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const user = requireVerifiedUser();
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Ukuran foto wishlist maksimal 15 MB.');
  }

  const check = validateMediaFilenameAndType(file.name, file.type, 'image');
  if (!check.ok) {
    throw new Error(check.error);
  }

  const safeId = normalizeDocId(wishId);
  const safeName = `${sanitizeUploadBasename(file.name)}-${Date.now().toString(36)}${check.ext}`;
  const path = `wishlist-media/${safeId}/${safeName}`;
  const idToken = await user.getIdToken();

  const uploaded = await executeSharedUpload({
    file,
    scope: 'wishlist-media',
    folderOrTargetId: safeId,
    firebaseStoragePath: path,
    idToken,
    storage,
    storageBucket: storage.app.options.storageBucket,
    onProgress,
  });
  return uploaded.url;
}

// --- Postcards From The Future API (Split Collection + Server Time-Lock) ---

export function subscribePostcardEnvelopes(
  userEmail: string | null | undefined,
  role: 'oktaf' | 'wulan' | null,
  onPostcards: (envelopes: PostcardEnvelope[]) => void,
  onError: (err: Error) => void
): () => void {
  const emitMerged = (buckets: Map<string, Map<string, PostcardEnvelope>>) => {
    const merged = new Map<string, PostcardEnvelope>();
    for (const bucket of buckets.values()) {
      for (const [id, item] of bucket.entries()) {
        merged.set(id, item);
      }
    }
    onPostcards(normalizePostcardOrder(Array.from(merged.values())));
  };

  if (role === 'oktaf') {
    return onSnapshot(
      collection(db, 'postcards'),
      (snapshot) => {
        const items = snapshot.docs.map((d) =>
          mapPostcardEnvelopeDoc(d.id, d.data() as Record<string, unknown>)
        );
        onPostcards(normalizePostcardOrder(items));
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'postcards');
        } catch (wrapped) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );
  }

  const buckets = new Map<string, Map<string, PostcardEnvelope>>([
    ['public', new Map()],
    ['private', new Map()],
  ]);

  const unsubPublic = onSnapshot(
    query(collection(db, 'postcards'), where('visibility', '==', 'public')),
    (snapshot) => {
      const next = new Map<string, PostcardEnvelope>();
      for (const d of snapshot.docs) {
        next.set(d.id, mapPostcardEnvelopeDoc(d.id, d.data() as Record<string, unknown>));
      }
      buckets.set('public', next);
      emitMerged(buckets);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'postcards');
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  let unsubCouple: (() => void) | null = null;
  if (role === 'wulan' && userEmail) {
    unsubCouple = onSnapshot(
      query(
        collection(db, 'postcards'),
        where('allowedEmails', 'array-contains', normalizeEmail(userEmail))
      ),
      (snapshot) => {
        const next = new Map<string, PostcardEnvelope>();
        for (const d of snapshot.docs) {
          next.set(d.id, mapPostcardEnvelopeDoc(d.id, d.data() as Record<string, unknown>));
        }
        buckets.set('private', next);
        emitMerged(buckets);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'postcards');
        } catch (wrapped) {
          onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );
  }

  return () => {
    unsubPublic();
    if (unsubCouple) unsubCouple();
  };
}

export async function fetchPostcardSecret(postcardId: string): Promise<PostcardSecret | null> {
  const safeId = normalizeDocId(postcardId);
  try {
    const snap = await getDoc(doc(db, 'postcards', safeId, 'secret', 'content'));
    if (!snap.exists()) return null;
    const raw = snap.data();
    return {
      postcardId: String(raw.postcardId || safeId),
      message: String(raw.message || ''),
      photoUrl: String(raw.photoUrl || ''),
      ownerUid: String(raw.ownerUid || ''),
      createdAt: timestampToIso(raw.createdAt),
      updatedAt: timestampToIso(raw.updatedAt),
    };
  } catch {
    // Expected PERMISSION_DENIED when time-locked (`request.time < parent.unlockAt`)
    return null;
  }
}

export async function createPostcard(input: {
  id?: string;
  title: string;
  recipient: PostcardRecipient;
  visibility: PostcardVisibility;
  unlockAtIso: string;
  location?: string;
  stampStyle: PostcardStampStyle;
  designTheme: PostcardDesignTheme;
  message: string;
  photoUrl?: string;
  order: number;
  role: 'oktaf' | 'wulan';
  accessConfig: AccessConfig;
}): Promise<string> {
  const user = requireVerifiedUser();
  const check = validatePostcardInput(input);
  if (!check.ok) {
    throw new Error(check.error);
  }

  const postcardId = input.id
    ? normalizeDocId(input.id)
    : normalizeDocId(`postcard-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const allowedEmails = buildAllowedEmailsList({
    oktafEmail: input.accessConfig.oktafEmail || PRIMARY_ADMIN_EMAIL,
    wulanEmail: input.accessConfig.wulanEmail,
  });

  const unlockDate = new Date(input.unlockAtIso);
  const unlockTimestamp = Timestamp.fromDate(unlockDate);
  const unlockDateLabel = formatUnlockDateIndonesian(unlockDate.toISOString());
  const createdDateLabel = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const batch = writeBatch(db);
  batch.set(doc(db, 'postcards', postcardId), {
    id: postcardId,
    title: input.title.trim().slice(0, 160),
    senderUid: user.uid,
    senderEmail: normalizeEmail(user.email),
    senderRole: input.role,
    senderName: input.role === 'oktaf' ? 'Oktaf' : 'Wulan',
    recipient: input.recipient,
    visibility: input.visibility,
    unlockAt: unlockTimestamp,
    unlockDateLabel: unlockDateLabel.slice(0, 80),
    createdDateLabel: createdDateLabel.slice(0, 80),
    location: (input.location || '').trim().slice(0, 120),
    stampStyle: input.stampStyle,
    designTheme: input.designTheme,
    isOpened: false,
    order: Math.min(500, Math.max(1, input.order)),
    allowedEmails,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'postcards', postcardId, 'secret', 'content'), {
    postcardId,
    message: input.message.trim().slice(0, 4000),
    photoUrl: (input.photoUrl || '').trim().slice(0, 1000),
    ownerUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `postcards/${postcardId}`);
  }

  return postcardId;
}

export async function updatePostcard(
  postcardId: string,
  patch: {
    title: string;
    recipient: PostcardRecipient;
    visibility: PostcardVisibility;
    unlockAtIso: string;
    location?: string;
    stampStyle: PostcardStampStyle;
    designTheme: PostcardDesignTheme;
    message?: string;
    photoUrl?: string;
    updateSecret?: boolean;
  }
): Promise<void> {
  requireVerifiedUser();
  const safeId = normalizeDocId(postcardId);
  const unlockDate = new Date(patch.unlockAtIso);
  if (!Number.isFinite(unlockDate.getTime())) {
    throw new Error('Tanggal buka kartu pos tidak valid.');
  }

  const check = validatePostcardInput({
    ...patch,
    message: patch.updateSecret ? patch.message || '' : 'placeholder',
  });
  if (!check.ok) {
    throw new Error(check.error);
  }

  const batch = writeBatch(db);
  batch.update(doc(db, 'postcards', safeId), {
    title: patch.title.trim().slice(0, 160),
    recipient: patch.recipient,
    visibility: patch.visibility,
    unlockAt: Timestamp.fromDate(unlockDate),
    unlockDateLabel: formatUnlockDateIndonesian(unlockDate.toISOString()).slice(0, 80),
    location: (patch.location || '').trim().slice(0, 120),
    stampStyle: patch.stampStyle,
    designTheme: patch.designTheme,
    updatedAt: serverTimestamp(),
  });

  if (patch.updateSecret && typeof patch.message === 'string') {
    batch.update(doc(db, 'postcards', safeId, 'secret', 'content'), {
      message: patch.message.trim().slice(0, 4000),
      photoUrl: (patch.photoUrl || '').trim().slice(0, 1000),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `postcards/${safeId}`);
  }
}

export async function markPostcardOpened(postcardId: string): Promise<void> {
  const user = requireVerifiedUser();
  const safeId = normalizeDocId(postcardId);
  try {
    await updateDoc(doc(db, 'postcards', safeId), {
      isOpened: true,
      openedAt: serverTimestamp(),
      openedByUid: user.uid,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `postcards/${safeId}`);
  }
}

export async function reorderPostcards(envelopes: PostcardEnvelope[]): Promise<void> {
  requireVerifiedAdminUser();
  const normalized = normalizePostcardOrder(envelopes);
  const batch = writeBatch(db);
  for (const item of normalized) {
    batch.update(doc(db, 'postcards', normalizeDocId(item.id)), {
      order: item.order,
      updatedAt: serverTimestamp(),
    });
  }
  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'postcards');
  }
}

export async function deletePostcard(postcardId: string): Promise<void> {
  requireVerifiedUser();
  const safeId = normalizeDocId(postcardId);
  try {
    await deleteDoc(doc(db, 'postcards', safeId, 'secret', 'content')).catch(() => {});
    await deleteDoc(doc(db, 'postcards', safeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `postcards/${safeId}`);
  }
}

export async function uploadPostcardPhoto(
  postcardId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const user = requireVerifiedUser();
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Ukuran foto kartu pos maksimal 15 MB.');
  }

  const check = validateMediaFilenameAndType(file.name, file.type, 'image');
  if (!check.ok) {
    throw new Error(check.error);
  }

  const safeId = normalizeDocId(postcardId);
  const safeName = `${sanitizeUploadBasename(file.name)}-${Date.now().toString(36)}${check.ext}`;
  const path = `postcard-media/${safeId}/${safeName}`;
  const idToken = await user.getIdToken();

  const uploaded = await executeSharedUpload({
    file,
    scope: 'postcard-media',
    folderOrTargetId: safeId,
    firebaseStoragePath: path,
    idToken,
    storage,
    storageBucket: storage.app.options.storageBucket,
    onProgress,
  });
  return uploaded.url;
}

// --- Our Story Secret Notes Manager API ---

async function ensureSecretNotesSeededFlag(uid: string): Promise<void> {
  const storyRef = doc(db, 'siteContent', 'story');
  try {
    const snap = await getDoc(storyRef);
    if (snap.exists()) {
      const existingPayload = (snap.data()?.payload || {}) as Record<string, unknown>;
      if (!existingPayload.secretNotesSeeded) {
        await updateDoc(storyRef, {
          payload: { ...existingPayload, secretNotesSeeded: true },
          updatedBy: uid,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      await setDoc(storyRef, {
        sectionId: 'story',
        payload: { pages: MEMORY_BOOK_PAGES, secretNotesSeeded: true },
        updatedBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'siteContent/story');
  }
}

export async function migrateDefaultSecretNotes(): Promise<{
  payload: SiteContentPayload;
  importedCount: number;
}> {
  const user = requireVerifiedAdminUser();
  let importedCount = 0;

  try {
    const existingSnap = await getDocs(collection(db, 'secretNotes'));
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));
    const batch = writeBatch(db);

    for (const rawNote of DEFAULT_SECRET_NOTES) {
      const note = normalizeSecretNote(rawNote);
      if (existingIds.has(note.id)) continue;
      batch.set(doc(db, 'secretNotes', note.id), {
        id: note.id,
        title: note.title,
        hint: note.hint,
        recipient: note.recipient,
        message: note.message,
        signature: note.signature,
        pageNumber: note.pageNumber,
        enabled: note.enabled,
        sealColor: note.sealColor,
        stampText: note.stampText,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      importedCount += 1;
    }

    if (importedCount > 0) {
      await batch.commit();
    }
    await ensureSecretNotesSeededFlag(user.uid);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'secretNotes');
  }

  const payload = await fetchSiteContent(true);
  return { payload, importedCount };
}

export async function upsertSecretNote(input: SecretNoteValidationInput): Promise<SiteContentPayload> {
  const user = requireVerifiedAdminUser();
  const check = validateSecretNoteInput(input);
  if (!check.ok) {
    throw new Error(check.error);
  }

  const note = check.normalized;
  const noteRef = doc(db, 'secretNotes', note.id);

  try {
    const existingSnap = await getDoc(noteRef);
    if (existingSnap.exists()) {
      await updateDoc(noteRef, {
        title: note.title,
        hint: note.hint,
        recipient: note.recipient,
        message: note.message,
        signature: note.signature,
        pageNumber: note.pageNumber,
        enabled: note.enabled,
        sealColor: note.sealColor,
        stampText: note.stampText,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(noteRef, {
        id: note.id,
        title: note.title,
        hint: note.hint,
        recipient: note.recipient,
        message: note.message,
        signature: note.signature,
        pageNumber: note.pageNumber,
        enabled: note.enabled,
        sealColor: note.sealColor,
        stampText: note.stampText,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await ensureSecretNotesSeededFlag(user.uid);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `secretNotes/${note.id}`);
  }

  return fetchSiteContent(true);
}

export async function toggleSecretNoteEnabled(
  noteId: string,
  enabled: boolean
): Promise<SiteContentPayload> {
  const user = requireVerifiedAdminUser();
  const safeId = normalizeSecretNoteId(noteId);
  const noteRef = doc(db, 'secretNotes', safeId);

  try {
    const snap = await getDoc(noteRef);
    if (snap.exists()) {
      await updateDoc(noteRef, {
        enabled: Boolean(enabled),
        updatedAt: serverTimestamp(),
      });
    } else {
      const defaultNote = DEFAULT_SECRET_NOTES.find((item) => item.id === safeId);
      if (!defaultNote) {
        throw new Error('Secret Note tidak ditemukan di database.');
      }
      const normalized = normalizeSecretNote(defaultNote);
      await setDoc(noteRef, {
        id: normalized.id,
        title: normalized.title,
        hint: normalized.hint,
        recipient: normalized.recipient,
        message: normalized.message,
        signature: normalized.signature,
        pageNumber: normalized.pageNumber,
        enabled: Boolean(enabled),
        sealColor: normalized.sealColor,
        stampText: normalized.stampText,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await ensureSecretNotesSeededFlag(user.uid);
  } catch (err) {
    if (err instanceof Error && err.message.includes('tidak ditemukan')) throw err;
    handleFirestoreError(err, OperationType.UPDATE, `secretNotes/${safeId}`);
  }

  return fetchSiteContent(true);
}

export async function deleteSecretNote(noteId: string): Promise<SiteContentPayload> {
  const user = requireVerifiedAdminUser();
  const safeId = normalizeSecretNoteId(noteId);
  try {
    await ensureSecretNotesSeededFlag(user.uid);
    await deleteDoc(doc(db, 'secretNotes', safeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `secretNotes/${safeId}`);
  }
  return fetchSiteContent(true);
}

export function getDefaultAccessConfig(): AccessConfig {
  return { ...DEFAULT_ACCESS_CONFIG };
}
