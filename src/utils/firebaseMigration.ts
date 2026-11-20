import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { DESTINATIONS_DATA } from '../data/destinations';
import { LETTERS_DATA } from '../data/letters';
import { MEMORY_BOOK_PAGES } from '../data/memories';
import {
  CURIOUS_TAP_REACTIONS,
  HUB_CARD_REACTIONS,
  SECTION_DIALOGUES,
} from '../data/miniOktaf';
import { DEFAULT_VIDEO_CONFIG } from '../data/video';
import { DEFAULT_VINYL_CONFIG, DEFAULT_VINYL_PLAYLIST } from '../data/vinyl';
import { DEFAULT_ACCESS_CONFIG } from '../data/wishlist';
import { DEFAULT_SECRET_NOTES } from '../data/hiddenMessages';
import { DEFAULT_HEART_GALLERY_PHOTOS } from '../data/quests';
import type { SiteContentPayload } from './adminContent';
import { normalizeVoicesOrder, validateStoryBookPages } from './adminContent';
import { normalizeHeartGalleryOrder } from './quests';
import { normalizeSecretNote } from './secretNotes';
import { extractYouTubeVideoId, getYouTubeThumbnailUrl, normalizeVinylOrder } from './vinyl';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface MigrationReport {
  seededSections: string[];
  seededVinylTracks: number;
  seededSecretNotes: number;
  seededHeartGalleryPhotos: number;
  bootstrappedAdmin: boolean;
  bootstrappedConfig: boolean;
}

/**
 * Idempotently seeds Firestore from bundled defaults ONLY when documents do not yet exist.
 * Never overwrites existing cloud content so Admin edits and uploaded assets remain intact.
 */
export async function ensureFirebaseBootstrapped(user: User): Promise<MigrationReport> {
  const report: MigrationReport = {
    seededSections: [],
    seededVinylTracks: 0,
    seededSecretNotes: 0,
    seededHeartGalleryPhotos: 0,
    bootstrappedAdmin: false,
    bootstrappedConfig: false,
  };

  if (!user.emailVerified || (user.email || '').toLowerCase() !== DEFAULT_ACCESS_CONFIG.adminEmail) {
    return report;
  }

  // 1. Ensure /admins/{uid} exists
  const adminRef = doc(db, 'admins', user.uid);
  try {
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        uid: user.uid,
        email: (user.email || DEFAULT_ACCESS_CONFIG.adminEmail).toLowerCase(),
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      report.bootstrappedAdmin = true;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `admins/${user.uid}`);
  }

  // 2. Ensure /config/access exists (and backfill empty wulanEmail if previously unconfigured)
  const configRef = doc(db, 'config', 'access');
  try {
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      await setDoc(configRef, {
        configId: 'access',
        adminEmail: DEFAULT_ACCESS_CONFIG.adminEmail,
        oktafEmail: DEFAULT_ACCESS_CONFIG.oktafEmail,
        wulanEmail: DEFAULT_ACCESS_CONFIG.wulanEmail,
        wishlistPrivacyMode: DEFAULT_ACCESS_CONFIG.wishlistPrivacyMode,
        updatedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      report.bootstrappedConfig = true;
    } else {
      const existingData = configSnap.data() as { wulanEmail?: string };
      if (!existingData.wulanEmail && DEFAULT_ACCESS_CONFIG.wulanEmail) {
        await setDoc(
          configRef,
          {
            wulanEmail: DEFAULT_ACCESS_CONFIG.wulanEmail,
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        report.bootstrappedConfig = true;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'config/access');
  }

  // 3. Seed missing /siteContent/{sectionId} documents idempotently
  const sectionSeeds: Array<{ sectionId: string; payload: Record<string, unknown> }> = [
    { sectionId: 'story', payload: { pages: MEMORY_BOOK_PAGES, secretNotesSeeded: true } },
    { sectionId: 'world', payload: { destinations: DESTINATIONS_DATA } },
    { sectionId: 'letters', payload: { letters: LETTERS_DATA } },
    { sectionId: 'video', payload: { videoConfig: DEFAULT_VIDEO_CONFIG } },
    {
      sectionId: 'miniOktaf',
      payload: {
        sectionDialogues: SECTION_DIALOGUES,
        hubCardReactions: HUB_CARD_REACTIONS,
        curiousTapReactions: CURIOUS_TAP_REACTIONS,
      },
    },
    { sectionId: 'vinyl', payload: { vinylConfig: DEFAULT_VINYL_CONFIG } },
  ];

  let vinylSectionJustSeeded = false;

  for (const item of sectionSeeds) {
    const ref = doc(db, 'siteContent', item.sectionId);
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          sectionId: item.sectionId,
          payload: item.payload,
          updatedBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        report.seededSections.push(item.sectionId);
        if (item.sectionId === 'vinyl') vinylSectionJustSeeded = true;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `siteContent/${item.sectionId}`);
    }
  }

  // 4. Seed default vinyl tracks ONLY if vinyl section was freshly created & collection is empty
  if (vinylSectionJustSeeded) {
    try {
      const existingTracks = await getDocs(collection(db, 'vinylPlaylist'));
      if (existingTracks.empty) {
        const batch = writeBatch(db);
        for (const track of normalizeVinylOrder(DEFAULT_VINYL_PLAYLIST)) {
          const trackRef = doc(db, 'vinylPlaylist', track.id);
          batch.set(trackRef, {
            id: track.id,
            youtubeUrl: track.youtubeUrl,
            youtubeVideoId: track.youtubeVideoId,
            title: track.title,
            artist: track.artist || '',
            thumbnailUrl: track.thumbnailUrl || getYouTubeThumbnailUrl(track.youtubeVideoId),
            order: track.order,
            isPublished: track.isPublished,
            ownerUid: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          report.seededVinylTracks += 1;
        }
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'vinylPlaylist');
    }
  }

  // 5. Seed migrated Secret Notes into /secretNotes if not yet seeded in Firestore
  try {
    const storyRef = doc(db, 'siteContent', 'story');
    const storySnap = await getDoc(storyRef);
    const storyData = storySnap.exists() ? storySnap.data() : null;
    const alreadySeededFlag = Boolean(storyData?.payload?.secretNotesSeeded);
    const existingNotesSnap = await getDocs(collection(db, 'secretNotes'));

    if (!alreadySeededFlag && existingNotesSnap.empty) {
      const batch = writeBatch(db);
      for (const rawNote of DEFAULT_SECRET_NOTES) {
        const note = normalizeSecretNote(rawNote);
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
        report.seededSecretNotes += 1;
      }
      await batch.commit();
    }

    if (!alreadySeededFlag && storySnap.exists()) {
      const prevPayload = (storyData?.payload || {}) as Record<string, unknown>;
      await setDoc(
        storyRef,
        {
          sectionId: 'story',
          payload: { ...prevPayload, secretNotesSeeded: true },
          updatedBy: user.uid,
          createdAt: storyData?.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'secretNotes');
  }

  // 6. Seed default Heart Gallery photos ONLY when siteContent/heartGallery & collection are empty
  try {
    const hgMetaRef = doc(db, 'siteContent', 'heartGallery');
    const hgMetaSnap = await getDoc(hgMetaRef);
    const alreadySeededHg = Boolean(hgMetaSnap.exists() && hgMetaSnap.data()?.payload?.seeded);
    const existingHgSnap = await getDocs(collection(db, 'heartGallery'));

    if (!alreadySeededHg && existingHgSnap.empty) {
      const batch = writeBatch(db);
      for (const item of normalizeHeartGalleryOrder(DEFAULT_HEART_GALLERY_PHOTOS)) {
        batch.set(doc(db, 'heartGallery', item.id), {
          id: item.id,
          imageUrl: item.imageUrl,
          caption: item.caption,
          dateLabel: item.dateLabel || '',
          theme: item.theme,
          order: item.order,
          isPublished: true,
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        report.seededHeartGalleryPhotos += 1;
      }
      await batch.commit();
    }

    if (!alreadySeededHg) {
      await setDoc(hgMetaRef, {
        sectionId: 'heartGallery',
        payload: { seeded: true },
        updatedBy: user.uid,
        createdAt: hgMetaSnap.exists() ? hgMetaSnap.data()?.createdAt || serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'heartGallery');
  }

  return report;
}

/**
 * Allows Admin to import/migrate a previously exported site-content.json backup into Firestore.
 */
export async function importJsonBackupToFirestore(
  user: User,
  rawJson: unknown
): Promise<{ importedSections: string[]; importedVoices: number }> {
  const parsed = rawJson as Partial<SiteContentPayload>;
  const importedSections: string[] = [];
  let importedVoices = 0;

  const saveSection = async (sectionId: string, payload: Record<string, unknown>) => {
    const ref = doc(db, 'siteContent', sectionId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(
        ref,
        {
          sectionId,
          payload,
          updatedBy: user.uid,
          createdAt: snap.data().createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await setDoc(ref, {
        sectionId,
        payload,
        updatedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    importedSections.push(sectionId);
  };

  if (parsed.storyPages) {
    const check = validateStoryBookPages(parsed.storyPages);
    if (check.ok) {
      await saveSection('story', { pages: check.pages });
    }
  }

  if (Array.isArray(parsed.destinations) && parsed.destinations.length > 0) {
    await saveSection('world', { destinations: parsed.destinations });
  }

  if (Array.isArray(parsed.letters) && parsed.letters.length > 0) {
    await saveSection('letters', { letters: parsed.letters });
  }

  if (parsed.videoConfig && typeof parsed.videoConfig.title === 'string') {
    await saveSection('video', { videoConfig: parsed.videoConfig });
  }

  if (parsed.miniOktaf && parsed.miniOktaf.sectionDialogues) {
    await saveSection('miniOktaf', { ...parsed.miniOktaf });
  }

  if (Array.isArray(parsed.voices)) {
    const ordered = normalizeVoicesOrder(parsed.voices);
    const batch = writeBatch(db);
    for (const v of ordered) {
      if (!v.id || !v.name || !v.audioUrl || !v.permissionConfirmed) continue;
      const ref = doc(db, 'voices', v.id);
      const existing = await getDoc(ref);
      const data: Record<string, unknown> = {
        id: v.id,
        name: v.name.slice(0, 120),
        flowerType: v.flowerType,
        audioUrl: v.audioUrl,
        audioFileName: v.audioFileName || '',
        order: v.order,
        permissionConfirmed: true,
        updatedAt: serverTimestamp(),
      };
      if (v.photoUrl) data.photoUrl = v.photoUrl;
      if (v.message) data.message = v.message.slice(0, 1500);
      if (existing.exists()) {
        batch.update(ref, data);
      } else {
        batch.set(ref, {
          ...data,
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      importedVoices += 1;
    }
    if (importedVoices > 0) {
      await batch.commit();
    }
  }

  if (Array.isArray(parsed.vinylPlaylist) && parsed.vinylPlaylist.length > 0) {
    const ordered = normalizeVinylOrder(parsed.vinylPlaylist);
    const batch = writeBatch(db);
    for (const track of ordered) {
      const videoId = extractYouTubeVideoId(track.youtubeVideoId || track.youtubeUrl);
      if (!videoId || !track.id || !track.title) continue;
      const ref = doc(db, 'vinylPlaylist', track.id);
      const existing = await getDoc(ref);
      const payloadData = {
        id: track.id,
        youtubeUrl: track.youtubeUrl,
        youtubeVideoId: videoId,
        title: track.title.slice(0, 140),
        artist: (track.artist || '').slice(0, 120),
        thumbnailUrl: track.thumbnailUrl || getYouTubeThumbnailUrl(videoId),
        order: track.order,
        isPublished: track.isPublished !== false,
        updatedAt: serverTimestamp(),
      };
      if (existing.exists()) {
        batch.update(ref, payloadData);
      } else {
        batch.set(ref, {
          ...payloadData,
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
  }

  if (Array.isArray(parsed.secretNotes)) {
    const batch = writeBatch(db);
    let wroteNotes = false;
    for (const rawNote of parsed.secretNotes) {
      if (!rawNote?.id || !rawNote?.message) continue;
      const note = normalizeSecretNote(rawNote);
      const ref = doc(db, 'secretNotes', note.id);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        batch.update(ref, {
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
        batch.set(ref, {
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
      wroteNotes = true;
    }
    if (wroteNotes) {
      await batch.commit();
    }
  }

  return { importedSections, importedVoices };
}
