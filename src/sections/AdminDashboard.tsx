import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookHeart,
  CalendarHeart,
  Disc3,
  Film,
  Flower2,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareHeart,
  Send,
} from 'lucide-react';
import { AdminAuthGate } from '../components/admin/AdminAuthGate';
import { AdminOverview, AdminTabId } from '../components/admin/AdminOverview';
import { LettersManager } from '../components/admin/LettersManager';
import { MediaLibraryManager } from '../components/admin/MediaLibraryManager';
import { MiniOktafManager } from '../components/admin/MiniOktafManager';
import { PostcardsManager } from '../components/admin/PostcardsManager';
import { StoryManager } from '../components/admin/StoryManager';
import { VideoManager } from '../components/admin/VideoManager';
import { VinylManager } from '../components/admin/VinylManager';
import { VoicesManager } from '../components/admin/VoicesManager';
import { WishlistManager } from '../components/admin/WishlistManager';
import { WorldManager } from '../components/admin/WorldManager';
import { useFirebaseAuth } from '../lib/FirebaseProvider';
import { useContentStore } from '../store/useContentStore';
import {
  MediaAssetItem,
  fetchMediaLibrary,
  fetchSiteContent,
  subscribePostcardEnvelopes,
  subscribeWishlistEntries,
} from '../utils/adminApi';
import { SiteContentPayload } from '../utils/adminContent';
import {
  ensureFirebaseBootstrapped,
  importJsonBackupToFirestore,
} from '../utils/firebaseMigration';

interface AdminDashboardProps {
  onExitToPublic: () => void;
}

const ADMIN_TABS: { id: AdminTabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'story', label: 'Our Story', icon: BookHeart },
  { id: 'world', label: 'Our World', icon: Globe2 },
  { id: 'letters', label: 'Letters', icon: Mail },
  { id: 'video', label: 'Video', icon: Film },
  { id: 'mini-oktaf', label: 'Mini Oktaf', icon: MessageSquareHeart },
  { id: 'voices', label: 'Voices of Love', icon: Flower2 },
  { id: 'vinyl', label: 'Vinyl Player', icon: Disc3 },
  { id: 'wishlist', label: 'Wishlist', icon: CalendarHeart },
  { id: 'postcards', label: 'Postcards', icon: Send },
  { id: 'media', label: 'Media Library', icon: FolderOpen },
];

export function AdminDashboard({ onExitToPublic }: AdminDashboardProps) {
  const { user, authReady, isAdmin, signOutUser, refreshAccessConfig } = useFirebaseAuth();

  const applyServerPayload = useContentStore((s) => s.applyServerPayload);
  const storyPages = useContentStore((s) => s.storyPages);
  const destinations = useContentStore((s) => s.destinations);
  const letters = useContentStore((s) => s.letters);
  const videoConfig = useContentStore((s) => s.videoConfig);
  const miniOktaf = useContentStore((s) => s.miniOktaf);
  const voices = useContentStore((s) => s.voices);
  const secretNotes = useContentStore((s) => s.secretNotes);
  const vinylConfig = useContentStore((s) => s.vinylConfig);
  const vinylPlaylist = useContentStore((s) => s.vinylPlaylist);
  const updatedAt = useContentStore((s) => s.updatedAt);

  const [loadingCloud, setLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [mediaAssets, setMediaAssets] = useState<MediaAssetItem[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [postcardsCount, setPostcardsCount] = useState(0);

  const loadAdminCloudData = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoadingCloud(true);
    setCloudError('');
    try {
      await ensureFirebaseBootstrapped(user);
      await refreshAccessConfig(user);
      const [contentPayload, media] = await Promise.all([
        fetchSiteContent(true),
        fetchMediaLibrary(),
      ]);
      applyServerPayload(contentPayload);
      setMediaAssets(media);
    } catch (err) {
      setCloudError(
        err instanceof Error
          ? err.message
          : 'Tidak dapat memuat data Control Room dari Firebase.'
      );
    } finally {
      setLoadingCloud(false);
    }
  }, [user, isAdmin, applyServerPayload, refreshAccessConfig]);

  useEffect(() => {
    if (authReady && isAdmin && user) {
      void loadAdminCloudData();
    }
  }, [authReady, isAdmin, user, loadAdminCloudData]);

  useEffect(() => {
    if (!authReady || !isAdmin || !user?.email) return;
    const unsubWish = subscribeWishlistEntries(
      user.email,
      'oktaf',
      (items) => setWishlistCount(items.length),
      () => {}
    );
    const unsubPostcards = subscribePostcardEnvelopes(
      user.email,
      'oktaf',
      (items) => setPostcardsCount(items.length),
      () => {}
    );
    return () => {
      unsubWish();
      unsubPostcards();
    };
  }, [authReady, isAdmin, user?.email]);

  const refreshMedia = useCallback(async () => {
    try {
      const media = await fetchMediaLibrary();
      setMediaAssets(media);
    } catch {
      // Retain existing index on transient failure
    }
  }, []);

  const handleSavedContent = useCallback(
    async (payload: SiteContentPayload) => {
      applyServerPayload(payload);
      await refreshMedia();
    },
    [applyServerPayload, refreshMedia]
  );

  const handleImportBackup = async (raw: unknown) => {
    if (!user) throw new Error('Harap login sebagai admin terlebih dahulu.');
    const res = await importJsonBackupToFirestore(user, raw);
    await loadAdminCloudData();
    return res;
  };

  if (!authReady) {
    return (
      <main className="paper-canvas min-h-[100dvh] w-full flex items-center justify-center px-4">
        <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] px-6 py-5 shadow-polaroid text-sm text-[#38271F]">
          Memeriksa sesi Firebase Control Room...
        </div>
      </main>
    );
  }

  if (!user || !isAdmin) {
    return <AdminAuthGate onExitToPublic={onExitToPublic} />;
  }

  if (loadingCloud && mediaAssets.length === 0) {
    return (
      <main className="paper-canvas min-h-[100dvh] w-full flex items-center justify-center px-4">
        <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] px-6 py-5 shadow-polaroid text-sm text-[#38271F]">
          Menyinkronkan Cloud Firestore & Firebase Storage...
        </div>
      </main>
    );
  }

  if (cloudError) {
    return (
      <main className="paper-canvas min-h-[100dvh] w-full flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-[#A6533B]/25 bg-[#FBF6EE] p-6 shadow-polaroid space-y-4 text-center">
          <h1 className="font-serif text-2xl font-semibold text-[#38271F]">
            Kendala Koneksi Firebase
          </h1>
          <p className="text-xs sm:text-sm text-[#A6533B] break-words">{cloudError}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={loadAdminCloudData}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold cursor-pointer"
            >
              Coba Lagi
            </button>
            <button
              type="button"
              onClick={onExitToPublic}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#38271F]/20 text-xs font-semibold text-[#38271F] cursor-pointer"
            >
              Kembali ke Website
            </button>
          </div>
        </div>
      </main>
    );
  }

  const contentPayload: SiteContentPayload = {
    storyPages,
    destinations,
    letters,
    videoConfig,
    miniOktaf,
    voices,
    secretNotes,
    vinylConfig,
    vinylPlaylist,
    updatedAt,
  };

  return (
    <div
      className="paper-canvas min-h-[100dvh] w-full text-[#38271F] overflow-x-hidden"
      data-testid="admin-control-room"
    >
      {/* Top Control Room Header */}
      <header className="sticky top-0 z-30 bg-[#F4EBDD]/95 border-b border-[#38271F]/14 px-4 sm:px-8 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onExitToPublic}
              aria-label="Kembali ke website utama"
              className="min-w-[42px] min-h-[42px] rounded-xl border border-[#38271F]/16 bg-[#FBF6EE] flex items-center justify-center text-[#38271F] hover:bg-[#EAE0CF] cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-[#743D4A] font-semibold truncate">
                {user.email}
              </p>
              <h1 className="font-serif text-base sm:text-xl font-semibold text-[#38271F] truncate">
                My Little Control Room ♡
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={signOutUser}
            className="min-h-[42px] px-3 py-1.5 rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] text-xs font-semibold text-[#38271F] inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 text-[#A6533B]" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Mobile-First Scrollable Section Tabs */}
        <nav
          aria-label="Menu bagian Control Room"
          className="max-w-6xl mx-auto mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrapbook-scroll"
        >
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#38271F] text-[#F4EBDD]'
                    : 'bg-[#FBF6EE] border border-[#38271F]/14 text-[#38271F]/80 hover:bg-[#EAE0CF]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 pb-16">
        {activeTab === 'overview' && (
          <AdminOverview
            content={contentPayload}
            mediaCount={mediaAssets.length}
            mediaAssets={mediaAssets}
            wishlistCount={wishlistCount}
            postcardsCount={postcardsCount}
            onSelectTab={setActiveTab}
            onOpenPublicSite={onExitToPublic}
            onImportBackupJson={handleImportBackup}
          />
        )}

        {activeTab === 'story' && (
          <StoryManager
            pages={storyPages}
            secretNotes={secretNotes}
            mediaAssets={mediaAssets}
            onSaved={handleSavedContent}
            onMediaRefresh={refreshMedia}
          />
        )}

        {activeTab === 'world' && (
          <WorldManager
            destinations={destinations}
            mediaAssets={mediaAssets}
            onSaved={handleSavedContent}
            onMediaRefresh={refreshMedia}
          />
        )}

        {activeTab === 'letters' && (
          <LettersManager letters={letters} onSaved={handleSavedContent} />
        )}

        {activeTab === 'video' && (
          <VideoManager
            videoConfig={videoConfig}
            mediaAssets={mediaAssets}
            onSaved={handleSavedContent}
            onMediaRefresh={refreshMedia}
          />
        )}

        {activeTab === 'mini-oktaf' && (
          <MiniOktafManager miniOktaf={miniOktaf} onSaved={handleSavedContent} />
        )}

        {activeTab === 'voices' && (
          <VoicesManager
            voices={voices}
            mediaAssets={mediaAssets}
            onSaved={handleSavedContent}
            onMediaRefresh={refreshMedia}
          />
        )}

        {activeTab === 'vinyl' && (
          <VinylManager
            vinylConfig={vinylConfig}
            playlist={vinylPlaylist}
            mediaAssets={mediaAssets}
            onSaved={handleSavedContent}
            onMediaRefresh={refreshMedia}
          />
        )}

        {activeTab === 'wishlist' && <WishlistManager />}

        {activeTab === 'postcards' && <PostcardsManager />}

        {activeTab === 'media' && (
          <MediaLibraryManager mediaAssets={mediaAssets} onRefresh={refreshMedia} />
        )}
      </main>
    </div>
  );
}
