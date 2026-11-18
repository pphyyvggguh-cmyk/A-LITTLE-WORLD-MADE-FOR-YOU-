import { useState } from 'react';
import { ArrowLeft, BookOpen, Compass, Flower2 } from 'lucide-react';
import { FLOWERS_DATA } from '../data/flowers';
import { STORYBOOK_CHAPTERS } from '../data/storybook';
import { AppSection, useStore } from '../store/useStore';
import { ContentsDrawer } from './ContentsDrawer';

const NAV_LINKS: { id: AppSection; label: string }[] = [
  { id: 'hub', label: 'Beranda' },
  { id: 'story', label: 'Our Story' },
  { id: 'world', label: 'Our World' },
  { id: 'letters', label: 'Letters' },
  { id: 'video', label: 'Video' },
  { id: 'voices', label: 'Voices' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'postcards', label: 'Postcards' },
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

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#F4EBDD]/95 border-b border-[#38271F]/12 px-4 sm:px-8 h-14 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Single-line Brand / Back */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {currentSection !== 'hub' && (
            <button
              type="button"
              onClick={() => navigateTo('hub')}
              aria-label="Kembali ke Beranda"
              className="min-w-[40px] min-h-[40px] -ml-2 px-2 rounded-lg flex items-center justify-center text-[#38271F] hover:bg-[#38271F]/8 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigateTo('hub')}
            className="font-serif text-base sm:text-lg font-semibold tracking-tight text-[#38271F] whitespace-nowrap shrink-0 cursor-pointer hover:text-[#A6533B] transition-colors"
          >
            A Little World
          </button>
        </div>

        {/* Zone 2: Clean single-line desktop chapter links */}
        <nav aria-label="Navigasi utama" className="hidden lg:flex items-center gap-3 xl:gap-5">
          {NAV_LINKS.map((item) => {
            const active = currentSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  navigateTo(item.id);
                  onChapterSelected?.();
                }}
                aria-current={active ? 'page' : undefined}
                className={`text-[13px] xl:text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#A6533B] border-[#A6533B]'
                    : 'text-[#38271F]/70 border-transparent hover:text-[#38271F]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Hybrid Storybook Contents + Contextual Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setContentsOpen(true)}
            aria-expanded={contentsOpen}
            aria-haspopup="dialog"
            aria-label="Buka Daftar Isi (Contents)"
            className="min-h-[44px] sm:min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-lg border border-[#38271F]/18 bg-[#FBF6EE] text-[#38271F] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#A6533B]" />
            <span>Contents</span>
            {activeChapter && (
              <span className="hidden sm:inline text-[#743D4A] tabular-nums">
                · {activeChapter.chapterNumber}
              </span>
            )}
          </button>

          {questDiscovered ? (
            <button
              type="button"
              onClick={() => setQuestModalOpen(true)}
              aria-label={`Lihat misi bunga (${collectedFlowers.length} dari ${FLOWERS_DATA.length})`}
              className="min-h-[44px] sm:min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#455342] text-[#F4EBDD] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#384435] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Flower2 className="w-3.5 h-3.5 text-[#E8BFC5]" />
              <span className="tabular-nums">
                {collectedFlowers.length}/{FLOWERS_DATA.length}
                <span className="hidden sm:inline"> Bunga</span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                navigateTo(currentSection === 'world' ? 'story' : 'world');
                onChapterSelected?.();
              }}
              className="hidden sm:inline-flex min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#38271F] text-[#F4EBDD] text-xs font-medium items-center gap-1.5 hover:bg-[#4e382d] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#C4A574]" />
              <span>{currentSection === 'world' ? 'Our Story' : 'Our World'}</span>
            </button>
          )}
        </div>
      </header>

      <ContentsDrawer
        open={contentsOpen}
        onClose={() => setContentsOpen(false)}
        onChapterSelected={onChapterSelected}
      />
    </>
  );
}
