import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STORYBOOK_CHAPTERS } from '../../data/storybook';
import { FLOWERS_DATA } from '../../data/flowers';
import { AppSection, useStore } from '../../store/useStore';
import {
  computeChapterDragProgress,
  getAdjacentBookChapter,
  getAvailableBookChapters,
  shouldCommitChapterSwipe,
} from '../../utils/storybookNav';

interface StorybookStageProps {
  currentSection: Exclude<AppSection, 'password' | 'welcome'>;
  direction: 1 | -1;
  onChapterTurn?: () => void;
  children: ReactNode;
}

interface SwipeGestureState {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  intent: 'undecided' | 'horizontal-turn' | 'vertical-scroll';
  dir: 1 | -1 | null;
}

function hasHorizontalScrollAncestor(target: Element, root: HTMLElement | null): boolean {
  let node: Element | null = target;
  while (node && node !== root) {
    if (node instanceof HTMLElement && node.scrollWidth > node.clientWidth + 6) {
      const style = window.getComputedStyle(node);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

function isChapterSwipeBlockedTarget(target: EventTarget | null, root: HTMLElement | null): boolean {
  if (!(target instanceof Element)) return false;
  if (
    target.closest('[data-no-chapter-swipe="true"]') ||
    target.closest('[data-testid="memory-book-spread"]') ||
    target.closest('[data-testid="earth-canvas-mount"]') ||
    target.closest('button') ||
    target.closest('a') ||
    target.closest('input') ||
    target.closest('textarea') ||
    target.closest('select') ||
    target.closest('label') ||
    target.closest('video') ||
    target.closest('audio') ||
    target.closest('[role="button"]') ||
    target.closest('[role="slider"]') ||
    target.closest('[role="dialog"]')
  ) {
    return true;
  }
  return hasHorizontalScrollAncestor(target, root);
}

export function StorybookStage({
  currentSection,
  direction,
  onChapterTurn,
  children,
}: StorybookStageProps) {
  const navigateTo = useStore((s) => s.navigateTo);
  const rewardClaimed = useStore((s) => s.rewardClaimed);
  const collectedFlowers = useStore((s) => s.collectedFlowers);

  const stageRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<SwipeGestureState | null>(null);
  const [dragCue, setDragCue] = useState<{ dir: 1 | -1; progress: number; targetTitle: string } | null>(
    null
  );

  const isRewardUnlocked = rewardClaimed || collectedFlowers.length >= FLOWERS_DATA.length;
  const availableIds = useMemo(
    () => getAvailableBookChapters(isRewardUnlocked, currentSection),
    [isRewardUnlocked, currentSection]
  );

  const prevChapterId = getAdjacentBookChapter(currentSection, 'prev', isRewardUnlocked);
  const nextChapterId = getAdjacentBookChapter(currentSection, 'next', isRewardUnlocked);

  const chapterMap = useMemo(
    () => new Map(STORYBOOK_CHAPTERS.map((c) => [c.id, c])),
    []
  );

  const activeMeta = chapterMap.get(currentSection);
  const prevMeta = prevChapterId ? chapterMap.get(prevChapterId) : null;
  const nextMeta = nextChapterId ? chapterMap.get(nextChapterId) : null;
  const totalLabel = String(Math.max(0, availableIds.length - 1)).padStart(2, '0');

  const isDarkAtmosphericChapter = currentSection === 'world' || currentSection === 'video';

  const goToChapter = (target: AppSection | null | undefined) => {
    if (!target) return;
    navigateTo(target);
    onChapterTurn?.();
  };

  // Safe keyboard Left/Right chapter turning when focus is not inside inputs, modals, or Story's 17-page book
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (currentSection === 'story') return;

      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }

      if (document.querySelector('[role="dialog"]')) return;

      if (e.key === 'ArrowRight' && nextChapterId) {
        e.preventDefault();
        goToChapter(nextChapterId);
      } else if (e.key === 'ArrowLeft' && prevChapterId) {
        e.preventDefault();
        goToChapter(prevChapterId);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentSection, nextChapterId, prevChapterId]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (isChapterSwipeBlockedTarget(e.target, stageRef.current)) {
      gestureRef.current = null;
      return;
    }

    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      intent: 'undecided',
      dir: null,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== e.pointerId || g.intent === 'vertical-scroll') return;

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    const stageWidth = stageRef.current?.clientWidth || window.innerWidth;

    if (g.intent === 'undecided') {
      if (Math.hypot(dx, dy) < 14) return;
      if (Math.abs(dy) >= Math.abs(dx) * 1.1) {
        g.intent = 'vertical-scroll';
        return;
      }

      const candidateDir: 1 | -1 | null =
        dx < 0 && nextChapterId ? 1 : dx > 0 && prevChapterId ? -1 : null;
      if (!candidateDir) {
        g.intent = 'vertical-scroll';
        return;
      }

      g.intent = 'horizontal-turn';
      g.dir = candidateDir;
    }

    if (g.intent === 'horizontal-turn' && g.dir) {
      const progress = computeChapterDragProgress({
        dx,
        dir: g.dir,
        bookWidth: stageWidth,
      });
      const targetTitle =
        g.dir === 1 ? (nextMeta?.title ?? 'Bab Berikutnya') : (prevMeta?.title ?? 'Bab Sebelumnya');
      setDragCue({ dir: g.dir, progress, targetTitle });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    gestureRef.current = null;
    setDragCue(null);

    if (!g || g.pointerId !== e.pointerId || g.intent !== 'horizontal-turn' || !g.dir) return;

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    const elapsed = Math.max(16, Date.now() - g.startTime);
    const velocityPxPerMs = Math.abs(dx) / elapsed;
    const stageWidth = stageRef.current?.clientWidth || window.innerWidth;

    const committed = shouldCommitChapterSwipe({
      dx,
      dy,
      velocityPxPerMs,
      dir: g.dir,
      canGoPrev: Boolean(prevChapterId),
      canGoNext: Boolean(nextChapterId),
      bookWidth: stageWidth,
    });

    if (committed) {
      goToChapter(g.dir === 1 ? nextChapterId : prevChapterId);
    }
  };

  const handlePointerCancel = () => {
    gestureRef.current = null;
    setDragCue(null);
  };

  return (
    <div
      className={`relative flex-1 min-h-0 flex flex-col overflow-hidden ${
        isDarkAtmosphericChapter ? 'bg-[#12161C] text-[#F4EBDD]' : 'bg-[#F4EBDD] text-[#38271F]'
      }`}
    >
      {/* Top Book Folio Binding Ribbon — Horizontal Chapter Turn Controls */}
      <div
        className={`relative z-20 shrink-0 h-10 sm:h-11 px-2.5 sm:px-6 border-b flex items-center justify-between gap-2 ${
          isDarkAtmosphericChapter
            ? 'bg-[#161C24]/95 border-[#F4EBDD]/12 text-[#F4EBDD]'
            : 'bg-[#EDE1CF]/95 border-[#38271F]/12 text-[#38271F]'
        }`}
      >
        <button
          type="button"
          data-testid="chapter-prev-btn"
          disabled={!prevMeta}
          onClick={() => goToChapter(prevChapterId)}
          aria-label={prevMeta ? `Buka bab sebelumnya: ${prevMeta.title}` : 'Ini bab pertama'}
          className={`min-h-[36px] px-2.5 sm:px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors shrink-0 ${
            prevMeta
              ? isDarkAtmosphericChapter
                ? 'hover:bg-[#F4EBDD]/10 text-[#F4EBDD] cursor-pointer'
                : 'hover:bg-[#38271F]/8 text-[#38271F] cursor-pointer'
              : 'opacity-35 cursor-default'
          }`}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline max-w-[130px] truncate">{prevMeta?.title ?? 'Awal Buku'}</span>
          <span className="md:hidden">Prev</span>
        </button>

        {/* Center Bookmark Tabs & Active Chapter Folio Indicator */}
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium min-w-0">
            <span
              className={`tabular-nums text-[11px] font-semibold tracking-wider uppercase ${
                isDarkAtmosphericChapter ? 'text-[#C4A574]' : 'text-[#A6533B]'
              }`}
            >
              Bab {activeMeta?.chapterNumber ?? '00'}/{totalLabel}
            </span>
            <span aria-hidden="true" className="opacity-35">
              ·
            </span>
            <span className="font-serif text-xs sm:text-sm font-semibold truncate">
              {activeMeta?.title ?? 'Beranda Jurnal'}
            </span>
          </div>

          <div
            aria-label="Loncat antar bab"
            className="hidden sm:flex items-center gap-1 pl-2 border-l border-current/15"
          >
            {availableIds.map((id) => {
              const ch = chapterMap.get(id);
              const active = id === currentSection;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => goToChapter(id)}
                  title={ch ? `Bab ${ch.chapterNumber} · ${ch.title}` : id}
                  aria-label={ch ? `Buka Bab ${ch.chapterNumber}: ${ch.title}` : id}
                  aria-current={active ? 'page' : undefined}
                  className={`h-5 px-1.5 rounded text-[10px] font-medium tabular-nums transition-all cursor-pointer ${
                    active
                      ? isDarkAtmosphericChapter
                        ? 'bg-[#C4A574] text-[#181412] font-semibold'
                        : 'bg-[#A6533B] text-[#FBF6EE] font-semibold'
                      : isDarkAtmosphericChapter
                        ? 'text-[#F4EBDD]/60 hover:text-[#F4EBDD] hover:bg-[#F4EBDD]/10'
                        : 'text-[#38271F]/55 hover:text-[#38271F] hover:bg-[#38271F]/8'
                  }`}
                >
                  {ch?.chapterNumber ?? ''}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          data-testid="chapter-next-btn"
          disabled={!nextMeta}
          onClick={() => goToChapter(nextChapterId)}
          aria-label={nextMeta ? `Buka bab berikutnya: ${nextMeta.title}` : 'Ini bab terakhir'}
          className={`min-h-[36px] px-2.5 sm:px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors shrink-0 ${
            nextMeta
              ? isDarkAtmosphericChapter
                ? 'hover:bg-[#F4EBDD]/10 text-[#F4EBDD] cursor-pointer'
                : 'hover:bg-[#38271F]/8 text-[#38271F] cursor-pointer'
              : 'opacity-35 cursor-default'
          }`}
        >
          <span className="hidden md:inline max-w-[130px] truncate">{nextMeta?.title ?? 'Tamat'}</span>
          <span className="md:hidden">Next</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Main Horizontal Book Viewport */}
      <div
        ref={stageRef}
        data-testid="storybook-chapter-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="storybook-chapter-viewport relative flex-1 min-h-0 w-full overflow-hidden touch-pan-y"
      >
        {/* Subtle Live Drag Edge Cue */}
        {dragCue && dragCue.progress > 0.04 && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-0 z-30 flex items-center px-3 ${
              dragCue.dir === 1 ? 'right-0 justify-end' : 'left-0 justify-start'
            }`}
          >
            <div
              style={{ opacity: Math.min(1, 0.35 + dragCue.progress * 0.9) }}
              className="rounded-lg bg-[#38271F]/88 text-[#F4EBDD] border border-[#C4A574]/55 px-3 py-2 shadow-xl text-xs font-medium flex items-center gap-1.5"
            >
              {dragCue.dir === -1 && <ChevronLeft className="w-3.5 h-3.5 text-[#C4A574]" />}
              <span className="max-w-[140px] truncate">{dragCue.targetTitle}</span>
              {dragCue.dir === 1 && <ChevronRight className="w-3.5 h-3.5 text-[#C4A574]" />}
            </div>
          </div>
        )}

        {/* Active Chapter Page Sheet */}
        <div
          key={currentSection}
          className={`h-full w-full overflow-y-auto overflow-x-hidden storybook-chapter-scroll ${
            direction >= 0 ? 'chapter-turn-enter-next' : 'chapter-turn-enter-prev'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
