import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MiniOktafCharacter } from './components/MiniOktafCharacter';
import { Navigation } from './components/Navigation';
import { LivingStorybookLayer } from './components/storybook/LivingStorybookLayer';
import { VinylPlayer } from './components/vinyl/VinylPlayer';
import { FirebaseProvider } from './lib/FirebaseProvider';
import { AdminDashboard } from './sections/AdminDashboard';
import { BirthdayLetters } from './sections/BirthdayLetters';
import { BirthdayWelcome } from './sections/BirthdayWelcome';
import { FinalReward } from './sections/FinalReward';
import { FuturePostcards } from './sections/FuturePostcards';
import { FutureWishlist } from './sections/FutureWishlist';
import { Hub } from './sections/Hub';
import { LivingCalendar } from './sections/LivingCalendar';
import { OurStory } from './sections/OurStory';
import { OurWorld } from './sections/OurWorld';
import { PasswordGate } from './sections/PasswordGate';
import { QuestsModal } from './sections/Quests';
import { VideoGreeting } from './sections/VideoGreeting';
import { VoicesOfLove } from './sections/VoicesOfLove';
import { useContentStore } from './store/useContentStore';
import { useStore } from './store/useStore';
import { EASE_OUT_EXPO } from './utils/animation';

function isAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname === '/admin' ||
    window.location.pathname.startsWith('/admin/') ||
    window.location.hash === '#/admin'
  );
}

function AppShell() {
  const currentSection = useStore((s) => s.currentSection);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const hydrateFromServer = useContentStore((s) => s.hydrateFromServer);

  const [inAdminRoute, setInAdminRoute] = useState<boolean>(() => isAdminRoute());
  const [interactionSeed, setInteractionSeed] = useState(0);

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  useEffect(() => {
    const syncRoute = () => setInAdminRoute(isAdminRoute());
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const handleExitAdmin = () => {
    window.history.pushState(null, '', '/');
    setInAdminRoute(false);
    hydrateFromServer();
  };

  if (inAdminRoute) {
    return <AdminDashboard onExitToPublic={handleExitAdmin} />;
  }

  const showFloatingCompanions =
    isUnlocked && currentSection !== 'password' && currentSection !== 'welcome';

  return (
    <div
      className="relative min-h-[100dvh] w-full bg-[#F4EBDD] text-[#38271F]"
      data-section={currentSection}
    >
      <Navigation
        onChapterSelected={() => setInteractionSeed((n) => n + 1)}
      />

      {/* Living Storybook ambient & interactive illustrations layer */}
      <LivingStorybookLayer
        section={currentSection}
        interactionSeed={interactionSeed}
      />

      <motion.div
        key={currentSection}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
        className="relative z-10"
      >
        {currentSection === 'password' && <PasswordGate />}
        {currentSection === 'welcome' && <BirthdayWelcome />}
        {currentSection === 'hub' && <Hub />}
        {currentSection === 'story' && <OurStory />}
        {currentSection === 'world' && <OurWorld />}
        {currentSection === 'letters' && <BirthdayLetters />}
        {currentSection === 'video' && <VideoGreeting />}
        {currentSection === 'voices' && <VoicesOfLove />}
        {currentSection === 'wishlist' && <FutureWishlist />}
        {currentSection === 'postcards' && <FuturePostcards />}
        {currentSection === 'calendar' && <LivingCalendar />}
        {currentSection === 'reward' && <FinalReward />}
      </motion.div>

      {/* Persistent floating Vinyl Player (bottom-left) & Mini Oktaf (bottom-right) */}
      {showFloatingCompanions && <VinylPlayer />}
      {showFloatingCompanions && <MiniOktafCharacter mode="floating" />}

      <QuestsModal />
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
