import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MiniOktafCharacter } from './components/MiniOktafCharacter';
import { Navigation } from './components/Navigation';
import { LivingStorybookLayer } from './components/storybook/LivingStorybookLayer';
import { CinematicBookIntro } from './components/storybook/CinematicBookIntro';
import { VinylPlayer } from './components/vinyl/VinylPlayer';
import { FLOWERS_DATA } from './data/flowers';
import { FirebaseProvider } from './lib/FirebaseProvider';
import { AdminDashboard } from './sections/AdminDashboard';
import { BirthdayLetters } from './sections/BirthdayLetters';
import { BirthdayWelcome } from './sections/BirthdayWelcome';
import { FinalReward } from './sections/FinalReward';
import { FuturePostcards } from './sections/FuturePostcards';
import { FutureWishlist } from './sections/FutureWishlist';
import { Hub } from './sections/Hub';
import { JarOfThoughts } from './sections/JarOfThoughts';
import { LeaveAThoughtPage } from './sections/LeaveAThoughtPage';
import { OurStory } from './sections/OurStory';
import { OurWorld } from './sections/OurWorld';
import { PasswordGate } from './sections/PasswordGate';
import { QuestsModal } from './sections/Quests';
import { Quest2GiftLetterModal } from './components/quests/Quest2GiftLetterModal';
import { HeartGalleryModal } from './components/quests/HeartGalleryModal';
import { VideoGreeting } from './sections/VideoGreeting';
import { VoicesOfLove } from './sections/VoicesOfLove';
import { useContentStore } from './store/useContentStore';
import { AppSection, useStore } from './store/useStore';
import { MOTION_INTERFACE } from './utils/animation';
import {
  buildChapterUrlPath,
  isPublicLeaveAThoughtLocation,
  resolveChapterFromLocation,
  resolvePostUnlockSection,
} from './utils/storybookNav';

function isAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname === '/admin' ||
    window.location.pathname.startsWith('/admin/') ||
    window.location.hash === '#/admin'
  );
}

function renderBookChapter(section: Exclude<AppSection, 'password' | 'welcome'>) {
  switch (section) {
    case 'hub':
      return <Hub />;
    case 'story':
      return <OurStory />;
    case 'world':
      return <OurWorld />;
    case 'letters':
      return <BirthdayLetters />;
    case 'video':
      return <VideoGreeting />;
    case 'voices':
      return <VoicesOfLove />;
    case 'wishlist':
      return <FutureWishlist />;
    case 'postcards':
      return <FuturePostcards />;
    case 'jar-of-thoughts':
      return <JarOfThoughts />;
    case 'reward':
      return <FinalReward />;
    default:
      return <Hub />;
  }
}

function AppShell() {
  const currentSection = useStore((s) => s.currentSection);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const bookIntroActive = useStore((s) => s.bookIntroActive);
  const bookIntroRunId = useStore((s) => s.bookIntroRunId);
  const completeBookIntro = useStore((s) => s.completeBookIntro);
  const hydrateFromServer = useContentStore((s) => s.hydrateFromServer);

  const [inAdminRoute, setInAdminRoute] = useState<boolean>(() => isAdminRoute());
  const [inPublicJarForm, setInPublicJarForm] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? isPublicLeaveAThoughtLocation(window.location.pathname, window.location.hash)
      : false
  );
  const [interactionSeed, setInteractionSeed] = useState(0);

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  // Reset scroll to top cleanly when navigating between sections
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentSection]);

  // Synchronize URL history (?chapter=...) cleanly and prevent Back button from ever returning to PasswordGate/Welcome
  useEffect(() => {
    const handleRouteSync = () => {
      const publicJarNow = isPublicLeaveAThoughtLocation(
        window.location.pathname,
        window.location.hash
      );
      setInPublicJarForm(publicJarNow);
      if (publicJarNow) {
        setInAdminRoute(false);
        return;
      }

      const adminNow = isAdminRoute();
      setInAdminRoute(adminNow);
      if (adminNow) return;

      const storeState = useStore.getState();
      if (!storeState.isUnlocked) return;

      const rewardUnlocked =
        storeState.rewardClaimed ||
        storeState.collectedFlowers.length >= FLOWERS_DATA.length;

      const urlChapter = resolveChapterFromLocation(
        window.location.search,
        window.location.hash,
        rewardUnlocked
      );

      const safeTarget = resolvePostUnlockSection(
        urlChapter,
        true,
        rewardUnlocked
      ) as Exclude<AppSection, 'password' | 'welcome'>;

      const canonicalPath = buildChapterUrlPath(safeTarget);
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (!urlChapter && currentPath !== '/' && currentPath !== canonicalPath) {
        window.history.replaceState({ chapter: safeTarget }, '', canonicalPath);
      } else if (urlChapter !== safeTarget) {
        window.history.replaceState({ chapter: safeTarget }, '', canonicalPath);
      }

      if (storeState.currentSection !== safeTarget) {
        storeState.navigateTo(safeTarget, { syncHistory: false });
      }
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  const handleExitAdmin = () => {
    const storeState = useStore.getState();
    const rewardUnlocked =
      storeState.rewardClaimed ||
      storeState.collectedFlowers.length >= FLOWERS_DATA.length;
    const safeChapter = resolvePostUnlockSection(
      storeState.currentSection,
      storeState.isUnlocked,
      rewardUnlocked
    );
    const nextPath =
      safeChapter === 'password' || safeChapter === 'welcome'
        ? '/'
        : buildChapterUrlPath(safeChapter);

    window.history.pushState(null, '', nextPath);
    setInAdminRoute(false);
    hydrateFromServer();
  };

  if (inPublicJarForm) {
    return <LeaveAThoughtPage />;
  }

  if (inAdminRoute) {
    return <AdminDashboard onExitToPublic={handleExitAdmin} />;
  }

  const inUnlockedApp =
    isUnlocked && currentSection !== 'password' && currentSection !== 'welcome';

  if (!inUnlockedApp) {
    return (
      <div
        className="relative min-h-[100dvh] w-full bg-[#F8F1E8] text-[#30272A]"
        data-section={currentSection}
      >
        <LivingStorybookLayer section={currentSection} interactionSeed={interactionSeed} />
        <div className="relative z-10">
          {currentSection === 'welcome' && isUnlocked ? <BirthdayWelcome /> : <PasswordGate />}
        </div>
      </div>
    );
  }

  const activeChapter = currentSection as Exclude<AppSection, 'password' | 'welcome'>;
  const isFullViewportChapter = activeChapter === 'world';

  return (
    <div
      className={`relative w-full flex flex-col bg-[#F8F1E8] text-[#30272A] ${
        isFullViewportChapter ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'
      }`}
      data-section={activeChapter}
    >
      <Navigation
        onChapterSelected={() => setInteractionSeed((n) => n + 1)}
      />

      {/* Ambient Living Illustrations Layer */}
      <LivingStorybookLayer
        section={activeChapter}
        interactionSeed={interactionSeed}
      />

      {/* Modern Website Scrollable Viewport with Crisp Crossfade Page Transitions */}
      <div className={`relative z-10 flex-1 flex flex-col ${isFullViewportChapter ? 'min-h-0' : ''}`}>
        <motion.div
          key={activeChapter}
          initial={{ opacity: 0, y: isFullViewportChapter ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOTION_INTERFACE}
          className={isFullViewportChapter ? 'flex-1 min-h-0 flex flex-col' : 'flex-1 flex flex-col'}
        >
          {renderBookChapter(activeChapter)}
        </motion.div>
      </div>

      {/* Persistent floating Vinyl Player (bottom-left) & Mini Oktaf (bottom-right) */}
      {!bookIntroActive && (
        <>
          <VinylPlayer />
          <MiniOktafCharacter mode="floating" />
        </>
      )}

      <QuestsModal />
      <Quest2GiftLetterModal />
      <HeartGalleryModal />

      {bookIntroActive && (
        <CinematicBookIntro
          key={bookIntroRunId}
          onComplete={completeBookIntro}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppShell />
    </FirebaseProvider>
  );
}
