import { useState } from 'react';
import {
  ArrowLeft,
  BookHeart,
  Flower2,
  Globe2,
  Home,
  LayoutGrid,
  Mail,
} from 'lucide-react';
import { FLOWERS_DATA } from '../data/flowers';
import { STORYBOOK_CHAPTERS } from '../data/storybook';
import { AppSection, useStore } from '../store/useStore';
import { ContentsDrawer } from './ContentsDrawer';

const DESKTOP_LINKS: { id: AppSection; label: string }[] = [
  { id: 'hub', label: 'Home' },
  { id: 'story', label: 'Our Story' },
  { id: 'world', label: 'Our World' },
  { id: 'letters', label: 'Letters' },
];

const MOBILE_TABS: { id: AppSection; label: string; icon: typeof Home }[] = [
  { id: 'hub', label: 'Home', icon: Home },
  { id: 'story', label: 'Story', icon: BookHeart },
  { id: 'world', label: 'World', icon: Globe2 },
  { id: 'letters', label: 'Letters', icon: Mail },
];

export function Navigation({
  onChapterSelected,
}: {
  onChapterSelected?: () => void;
}) {
  const currentSection = useStore((s) => s.currentSection);
  const navigateTo = useStore((s) => s.navigateTo);
  const collectedFlowers = useStore((s) => s.collectedFlowers);
  const questDiscovered = useStore((s) => s.questDiscovered);
  const setQuestModalOpen = useStore((s) => s.setQuestModalOpen);

  const [contentsOpen, setContentsOpen] = useState(false);

  if (currentSection === 'password' || currentSection === 'welcome') {
    return null;
  }

  const activeChapter = STORYBOOK_CHAPTERS.find((c) => c.id === currentSection);
  const isMoreSection = !['hub', 'story', 'world', 'letters'].includes(currentSection);

  const handleSelect = (id: AppSection) => {
    navigateTo(id);
    onChapterSelected?.();
  };

  return (
    <>
      {/* 3-Zone Desktop & Compact Mobile Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FFFDFC]/96 border-b border-[#30272A]/10 px-4 sm:px-8 h-12 md:h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Identity (+ mobile back shortcut on subpages) */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          {currentSection !== 'hub' && (
            <button
              type="button"
              onClick={() => handleSelect('hub')}
              aria-label="Kembali ke Beranda"
              className="md:hidden min-w-[38px] min-h-[38px] -ml-2 rounded-lg flex items-center justify-center text-[#30272A] hover:bg-[#30272A]/6 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSelect('hub')}
            className="font-serif text-base sm:text-lg font-semibold tracking-tight text-[#30272A] whitespace-nowrap shrink-0 cursor-pointer hover:text-[#552E3D] transition-colors flex items-center gap-1.5"
          >
            <span>A Little World</span>
            <span className="text-[#A95F70]" aria-hidden="true">
              ♡
            </span>
          </button>
        </div>

        {/* Zone 2: Clean Single-Line Desktop Navigation (max 5 links) */}
        <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-6 lg:gap-8">
          {DESKTOP_LINKS.map((item) => {
            const active = currentSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#552E3D] border-[#A95F70]'
                    : 'text-[#6E5F63] border-transparent hover:text-[#30272A]'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setContentsOpen(true)}
            aria-expanded={contentsOpen}
            aria-haspopup="dialog"
            className={`text-sm font-medium whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1 ${
              isMoreSection
                ? 'text-[#552E3D] border-[#A95F70]'
                : 'text-[#6E5F63] border-transparent hover:text-[#30272A]'
            }`}
          >
            <span>More</span>
            {isMoreSection && activeChapter && (
              <span className="text-xs text-[#A95F70] font-normal">
                · {activeChapter.title.replace(' ♡', '')}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Single Primary / Contextual Action */}
        <div className="flex items-center gap-2 shrink-0">
          {questDiscovered ? (
            <button
              type="button"
              onClick={() => setQuestModalOpen(true)}
              aria-label={`Lihat misi rahasia (${collectedFlowers.length} dari ${FLOWERS_DATA.length} bunga)`}
              className="min-h-[38px] md:min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#4E5D49] text-[#FFFDFC] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#3f4c3b] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Flower2 className="w-3.5 h-3.5 text-[#EBC9CB]" />
              <span className="tabular-nums">
                {collectedFlowers.length}/{FLOWERS_DATA.length} Bunga
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setContentsOpen(true)}
              aria-expanded={contentsOpen}
              aria-haspopup="dialog"
              aria-label="Buka semua bab cerita"
              className="min-h-[38px] md:min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#3f202c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#EBC9CB]" />
              <span>All Chapters</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Android-Friendly Bottom Navigation Bar (4 core routes + More sheet trigger) */}
      <nav
        aria-label="Navigasi bawah mobile"
        data-testid="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-[60px] bg-[#FFFDFC]/98 border-t border-[#30272A]/12 px-2 flex items-center justify-around shadow-[0_-6px_24px_-12px_rgba(48,39,42,0.18)]"
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = currentSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`min-w-[52px] min-h-[46px] px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                active
                  ? 'text-[#552E3D] bg-[#EBC9CB]/35'
                  : 'text-[#6E5F63] hover:text-[#30272A]'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#A95F70]' : ''}`} />
              <span className="text-[11px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setContentsOpen(true)}
          aria-expanded={contentsOpen}
          aria-haspopup="dialog"
          aria-label="Buka semua bab dan pengaturan"
          className={`min-w-[52px] min-h-[46px] px-2 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            contentsOpen || isMoreSection
              ? 'text-[#552E3D] bg-[#EBC9CB]/35'
              : 'text-[#6E5F63] hover:text-[#30272A]'
          }`}
        >
          <LayoutGrid className={`w-4 h-4 ${contentsOpen || isMoreSection ? 'text-[#A95F70]' : ''}`} />
          <span className="text-[11px] font-medium leading-none">More</span>
        </button>
      </nav>

      <ContentsDrawer
        open={contentsOpen}
        onClose={() => setContentsOpen(false)}
        onChapterSelected={onChapterSelected}
      />
    </>
  );
}
