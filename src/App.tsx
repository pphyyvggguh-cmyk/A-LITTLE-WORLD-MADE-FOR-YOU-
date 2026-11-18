import { useEffect, useState } from 'react';
import { MiniOktafCharacter } from './components/MiniOktafCharacter';
import { Navigation } from './components/Navigation';
import { LivingStorybookLayer } from './components/storybook/LivingStorybookLayer';
import { CinematicBookIntro } from './components/storybook/CinematicBookIntro';
import { StorybookStage } from './components/storybook/StorybookStage';
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
import { OurStory } from './sections/OurStory';
import { OurWorld } from './sections/OurWorld';
import { PasswordGate } from './sections/PasswordGate';
import { QuestsModal } from './sections/Quests';
import { VideoGreeting } from './sections/VideoGreeting';
import { VoicesOfLove } from './sections/VoicesOfLove';
import { useContentStore } from './store/useContentStore';
import { AppSection, useStore } from './store/useStore';
import {
  buildChapterUrlPath,
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
    case 'reward':
      return <FinalReward />;
    default:
      return <Hub />;
  }
}

function AppShell() {
  const currentSection = useStore((s) => s.currentSection);
  const chapterDirection = useStore((s) => s.chapterDirection);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const bookIntroActive = useStore((s) => s.bookIntroActive);
  const bookIntroRunId = useStore((s) => s.bookIntroRunId);
  const completeBookIntro = useStore((s) => s.completeBookIntro);
  const hydrateFromServer = useContentStore((s) => s.hydrateFromServer);

  const [inAdminRoute, setInAdminRoute] = useState<boolean>(() => isAdminRoute());
  const [interactionSeed, setInteractionSeed] = useState(0);

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  // Synchronize URL history (?chapter=...) cleanly and prevent Back button from ever returning to PasswordGate/Welcome
  useEffect(() => {
    const handleRouteSync = () => {
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

  if (inAdminRoute) {
    return <AdminDashboard onExitToPublic={handleExitAdmin} />;
  }

  const inStorybookMode =
    isUnlocked && currentSection !== 'password' && currentSection !== 'welcome';

  if (!inStorybookMode) {
    return (
      <div
        className="relative min-h-[100dvh] w-full bg-[#F4EBDD] text-[#38271F]"
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

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden flex flex-col bg-[#F4EBDD] text-[#38271F]"
      data-section={activeChapter}
    >
      <Navigation
        onChapterSelected={() => setInteractionSeed((n) => n + 1)}
      />

      {/* Living Storybook ambient & interactive illustrations layer */}
      <LivingStorybookLayer
        section={activeChapter}
        interactionSeed={interactionSeed}
      />

      <StorybookStage
        currentSection={activeChapter}
        direction={chapterDirection}
        onChapterTurn={() => setInteractionSeed((n) => n + 1)}
      >
        {renderBookChapter(activeChapter)}
      </StorybookStage>

      {/* Persistent floating Vinyl Player (bottom-left) & Mini Oktaf (bottom-right) */}
      {!bookIntroActive && (
        <>
          <VinylPlayer />
          <MiniOktafCharacter mode="floating" />
        </>
      )}

      <QuestsModal />

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
