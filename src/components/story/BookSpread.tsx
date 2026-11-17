import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { HiddenEnvelopeMessage } from '../../data/hiddenMessages';
import { BookPolaroidItem, MemoryBookPage } from '../../data/memories';
import {
  BookSpreadPair,
  computeDragCurlProgress,
  detectPageCornerOrigin,
  detectPageTapSide,
  isTapWithinTolerance,
  PageCornerVerticalOrigin,
  shouldCommitDragTurn,
} from '../../utils/memoryBook';
import { BookPage, ClosingBookPage } from './BookPage';

interface BookSpreadProps {
  spread: BookSpreadPair<MemoryBookPage>;
  prevSpread: BookSpreadPair<MemoryBookPage> | null;
  nextSpread: BookSpreadPair<MemoryBookPage> | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  direction: 1 | -1;
  onNextSpread: () => void;
  onPrevSpread: () => void;
  onSelectPolaroid: (item: BookPolaroidItem, pageLabel: string) => void;
  onOpenEnvelope: (msg: HiddenEnvelopeMessage) => void;
  onReturnToCover: () => void;
}

interface TurnAnimationState {
  key: number;
  dir: 1 | -1;
  startProgress: number;
  outgoing: BookSpreadPair<MemoryBookPage>;
  incoming: BookSpreadPair<MemoryBookPage>;
}

interface DragCurlState {
  dir: 1 | -1;
  origin: PageCornerVerticalOrigin;
  settling: boolean;
}

interface ActiveGestureState {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  intent: 'undecided' | 'horizontal-curl' | 'vertical-scroll';
  dir: 1 | -1 | null;
  origin: PageCornerVerticalOrigin;
  lastProgress: number;
}

const PAGE_TURN_DURATION_MS = 440;
const SPRING_BACK_MS = 220;

/**
 * Prevent accidental page turns when touching, tapping, or dragging Polaroids,
 * secret-note envelopes, hidden flowers, links, form controls, or buttons.
 */
function isSwipeBlockedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('[data-no-swipe="true"]') ||
      target.closest('[data-interactive-item="true"]') ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea') ||
      target.closest('[role="button"]')
  );
}

export function BookSpread({
  spread,
  prevSpread,
  nextSpread,
  canGoPrev,
  canGoNext,
  direction,
  onNextSpread,
  onPrevSpread,
  onSelectPolaroid,
  onOpenEnvelope,
  onReturnToCover,
}: BookSpreadProps) {
  const prefersReducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const bindingRef = useRef<HTMLDivElement | null>(null);

  const gestureRef = useRef<ActiveGestureState | null>(null);
  const rafRef = useRef<number>(0);
  const lastTurnTsRef = useRef(0);
  const suppressClickUntilRef = useRef(0);
  const handoffCurlRef = useRef<{ dir: 1 | -1; startProgress: number } | null>(null);

  const prevSpreadRef = useRef<BookSpreadPair<MemoryBookPage>>(spread);
  const turnSeqRef = useRef(0);
  const turnTimerRef = useRef<number | null>(null);
  const springTimerRef = useRef<number | null>(null);

  const [turnState, setTurnState] = useState<TurnAnimationState | null>(null);
  const [dragCurl, setDragCurl] = useState<DragCurlState | null>(null);

  const applyCurlCssVars = (progress: number, origin: PageCornerVerticalOrigin) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty('--curl-p', progress.toFixed(4));
    stage.style.setProperty('--curl-tilt', origin === 'top' ? '-1' : '1');
  };

  useEffect(() => {
    const prev = prevSpreadRef.current;
    if (prev.spreadIndex === spread.spreadIndex) {
      prevSpreadRef.current = spread;
      return;
    }

    const dir: 1 | -1 =
      spread.spreadIndex > prev.spreadIndex
        ? 1
        : spread.spreadIndex < prev.spreadIndex
          ? -1
          : direction;

    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }

    const reducedNow =
      prefersReducedMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (reducedNow) {
      handoffCurlRef.current = null;
      prevSpreadRef.current = spread;
      setTurnState(null);
      return;
    }

    const handoff =
      handoffCurlRef.current && handoffCurlRef.current.dir === dir
        ? handoffCurlRef.current.startProgress
        : 0;
    handoffCurlRef.current = null;

    const nextTurn: TurnAnimationState = {
      key: ++turnSeqRef.current,
      dir,
      startProgress: handoff,
      outgoing: prev,
      incoming: spread,
    };
    prevSpreadRef.current = spread;
    setTurnState(nextTurn);

    turnTimerRef.current = window.setTimeout(() => {
      turnTimerRef.current = null;
      setTurnState((curr) => (curr?.key === nextTurn.key ? null : curr));
    }, PAGE_TURN_DURATION_MS);
  }, [spread, direction, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (turnTimerRef.current !== null) window.clearTimeout(turnTimerRef.current);
      if (springTimerRef.current !== null) window.clearTimeout(springTimerRef.current);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const triggerTurn = (side: 'next' | 'prev') => {
    const now = Date.now();
    if (now - lastTurnTsRef.current < 160) return;
    if (side === 'next' && canGoNext) {
      lastTurnTsRef.current = now;
      onNextSpread();
    } else if (side === 'prev' && canGoPrev) {
      lastTurnTsRef.current = now;
      onPrevSpread();
    }
  };

  const resetSpringBack = (origin: PageCornerVerticalOrigin) => {
    if (springTimerRef.current !== null) {
      window.clearTimeout(springTimerRef.current);
    }
    applyCurlCssVars(0, origin);
    setDragCurl((prev) => (prev ? { ...prev, settling: true } : null));
    springTimerRef.current = window.setTimeout(() => {
      springTimerRef.current = null;
      setDragCurl(null);
    }, SPRING_BACK_MS);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (isSwipeBlockedTarget(e.target)) {
      gestureRef.current = null;
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const origin = detectPageCornerOrigin(e.clientY, rect.top, rect.height);

    if (springTimerRef.current !== null) {
      window.clearTimeout(springTimerRef.current);
      springTimerRef.current = null;
    }

    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      intent: 'undecided',
      dir: null,
      origin,
      lastProgress: 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== e.pointerId) return;
    if (g.intent === 'vertical-scroll') return;

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    const stage = stageRef.current;
    if (!stage) return;

    if (g.intent === 'undecided') {
      if (Math.hypot(dx, dy) < 7) return;

      // Vertical scroll intent: hand control cleanly back to browser
      if (Math.abs(dy) > Math.abs(dx) * 1.12) {
        g.intent = 'vertical-scroll';
        return;
      }

      const nextDir: 1 | -1 | null =
        dx < 0 && canGoNext ? 1 : dx > 0 && canGoPrev ? -1 : null;

      if (!nextDir) {
        g.intent = 'vertical-scroll';
        return;
      }

      g.intent = 'horizontal-curl';
      g.dir = nextDir;

      try {
        bindingRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture is unsupported
      }

      setDragCurl({ dir: nextDir, origin: g.origin, settling: false });
    }

    if (g.intent === 'horizontal-curl' && g.dir) {
      const reducedNow =
        prefersReducedMotion ||
        (typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches);

      const rect = stage.getBoundingClientRect();
      const progress = computeDragCurlProgress({
        dx,
        direction: g.dir,
        bookWidth: rect.width,
      });
      g.lastProgress = progress;

      if (!reducedNow) {
        if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = 0;
          applyCurlCssVars(progress, g.origin);
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== e.pointerId) return;
    gestureRef.current = null;

    try {
      if (bindingRef.current?.hasPointerCapture(e.pointerId)) {
        bindingRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    const stage = stageRef.current;

    if (g.intent === 'undecided') {
      if (
        stage &&
        isTapWithinTolerance(dx, dy, 9) &&
        !isSwipeBlockedTarget(e.target)
      ) {
        const rect = stage.getBoundingClientRect();
        const tapSide = detectPageTapSide({
          clientX: e.clientX,
          containerLeft: rect.left,
          containerWidth: rect.width,
          canGoPrev,
          canGoNext,
        });
        if (tapSide) {
          suppressClickUntilRef.current = Date.now() + 200;
          triggerTurn(tapSide);
        }
      }
      return;
    }

    if (g.intent === 'horizontal-curl' && g.dir) {
      suppressClickUntilRef.current = Date.now() + 280;
      const elapsed = Math.max(16, Date.now() - g.startTime);
      const velocityPxPerMs = Math.abs(dx) / elapsed;
      const rect = stage?.getBoundingClientRect();
      const progress = rect
        ? computeDragCurlProgress({
            dx,
            direction: g.dir,
            bookWidth: rect.width,
          })
        : g.lastProgress;

      if (shouldCommitDragTurn({ progress, dx, dy, velocityPxPerMs })) {
        handoffCurlRef.current = { dir: g.dir, startProgress: progress };
        setDragCurl(null);
        triggerTurn(g.dir === 1 ? 'next' : 'prev');
      } else {
        resetSpringBack(g.origin);
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || g.pointerId !== e.pointerId) return;
    gestureRef.current = null;
    if (g.intent === 'horizontal-curl') {
      resetSpringBack(g.origin);
    }
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() < suppressClickUntilRef.current && !isSwipeBlockedTarget(e.target)) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // Stationary base pages underneath any flipping or active-curling leaf
  const dragNextUnderlay = dragCurl && dragCurl.dir === 1 && nextSpread;
  const dragPrevUnderlay = dragCurl && dragCurl.dir === -1 && prevSpread;

  const baseLeftPage =
    turnState && turnState.dir === 1
      ? turnState.outgoing.leftPage
      : dragPrevUnderlay
        ? prevSpread.leftPage
        : spread.leftPage;

  const baseRightPage =
    turnState && turnState.dir === -1
      ? turnState.outgoing.rightPage
      : dragNextUnderlay
        ? nextSpread.rightPage
        : spread.rightPage;

  return (
    <div
      className="w-full max-w-[1040px] mx-auto px-1 sm:px-4 overflow-x-hidden"
      data-turning={turnState ? (turnState.dir === 1 ? 'next' : 'prev') : dragCurl ? 'dragging' : 'idle'}
      data-spread-index={spread.spreadIndex}
    >
      {/* Hardcover Open Book Binding Shell */}
      <div
        ref={bindingRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
        data-testid="memory-book-spread"
        className={`book-open-binding relative rounded-xl sm:rounded-2xl p-1.5 sm:p-3 md:p-4 select-none ${
          dragCurl ? 'touch-none cursor-grabbing' : 'touch-pan-y cursor-pointer'
        }`}
      >
        {/* Subtle silk bookmark ribbon peeking from bottom spine */}
        <span
          aria-hidden="true"
          className="hidden sm:block pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-3 h-5 bg-gradient-to-b from-[#A6533B] to-[#743D4A] shadow-sm [clip-path:polygon(0_0,100%_0,100%_100%,50%_72%,0_100%)]"
        />

        {/* Layered stitched paper stack edges flanking left & right book block */}
        <div
          aria-hidden="true"
          className="hidden sm:block pointer-events-none absolute top-3.5 bottom-3.5 left-1.5 w-2 rounded-l-md book-paper-stack-left border-l border-[#38271F]/25"
        />
        <div
          aria-hidden="true"
          className="hidden sm:block pointer-events-none absolute top-3.5 bottom-3.5 right-1.5 w-2 rounded-r-md book-paper-stack-right border-r border-[#38271F]/25"
        />

        {/* 3D Perspective Book Stage */}
        <div
          ref={stageRef}
          className="book-stage-3d relative bg-[#EDE1CF] rounded-lg sm:rounded-xl p-0.5 sm:p-1 shadow-inner overflow-hidden"
        >
          <div className="relative grid grid-cols-2">
            {/* Base Left Facing Page */}
            {baseLeftPage ? (
              <BookPage
                page={baseLeftPage}
                side="left"
                showCornerCurlHint={canGoPrev}
                onSelectPolaroid={onSelectPolaroid}
                onOpenEnvelope={onOpenEnvelope}
              />
            ) : (
              <div
                data-book-side="left"
                className="min-h-[372px] sm:min-h-[475px] md:min-h-[526px] bg-[#FBF7EF] book-page-left rounded-l-md"
              />
            )}

            {/* Base Right Facing Page (or complementary Closing Page on Spread 9) */}
            {baseRightPage !== undefined && baseRightPage !== null ? (
              <BookPage
                page={baseRightPage}
                side="right"
                showCornerCurlHint={canGoNext}
                onSelectPolaroid={onSelectPolaroid}
                onOpenEnvelope={onOpenEnvelope}
              />
            ) : (
              <ClosingBookPage onReturnToCover={onReturnToCover} />
            )}

            {/* Central Book Spine Crease & Depth Shadow */}
            <div
              aria-hidden="true"
              className="book-spine-shadow pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 sm:w-9 z-30"
            />

            {/* Live Interactive Corner-Drag & Edge Peel Leaf */}
            {dragCurl && (
              <>
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-0 w-1/2 z-30 ${
                    dragCurl.dir === 1
                      ? 'right-0 book-drag-shadow-next'
                      : 'left-0 book-drag-shadow-prev'
                  }`}
                />
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-0 w-1/2 z-40 ${
                    dragCurl.dir === 1 ? 'right-0 book-drag-leaf-next' : 'left-0 book-drag-leaf-prev'
                  } ${dragCurl.settling ? 'book-drag-leaf-settling' : ''}`}
                >
                  {/* Front face of dragged leaf */}
                  <div className="book-face-front absolute inset-0 overflow-hidden shadow-xl">
                    {dragCurl.dir === 1 ? (
                      spread.rightPage ? (
                        <BookPage
                          page={spread.rightPage}
                          side="right"
                          showCornerCurlHint={canGoNext}
                          onSelectPolaroid={onSelectPolaroid}
                          onOpenEnvelope={onOpenEnvelope}
                        />
                      ) : (
                        <ClosingBookPage onReturnToCover={onReturnToCover} />
                      )
                    ) : spread.leftPage ? (
                      <BookPage
                        page={spread.leftPage}
                        side="left"
                        showCornerCurlHint={canGoPrev}
                        onSelectPolaroid={onSelectPolaroid}
                        onOpenEnvelope={onOpenEnvelope}
                      />
                    ) : (
                      <div className="h-full bg-[#FBF7EF] book-page-left rounded-l-md" />
                    )}
                  </div>

                  {/* Back face of dragged leaf (arriving opposite side of the same sheet) */}
                  <div
                    className={`absolute inset-0 overflow-hidden shadow-xl ${
                      dragCurl.dir === 1 ? 'book-face-back-next' : 'book-face-back-prev'
                    }`}
                  >
                    {dragCurl.dir === 1 ? (
                      nextSpread?.leftPage ? (
                        <BookPage
                          page={nextSpread.leftPage}
                          side="left"
                          showCornerCurlHint={false}
                          onSelectPolaroid={onSelectPolaroid}
                          onOpenEnvelope={onOpenEnvelope}
                        />
                      ) : (
                        <div className="h-full bg-[#FBF7EF] book-page-left rounded-l-md" />
                      )
                    ) : prevSpread?.rightPage ? (
                      <BookPage
                        page={prevSpread.rightPage}
                        side="right"
                        showCornerCurlHint={false}
                        onSelectPolaroid={onSelectPolaroid}
                        onOpenEnvelope={onOpenEnvelope}
                      />
                    ) : (
                      <ClosingBookPage onReturnToCover={onReturnToCover} />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Smooth 3D Connected Page-Turn Animation (Tap, Drag Release Commit, Keyboard, Secondary Buttons) */}
            {turnState && !dragCurl && (
              <>
                <div
                  key={`turn-shadow-${turnState.key}`}
                  aria-hidden="true"
                  className="book-turn-shadow-overlay pointer-events-none absolute inset-0 z-30 bg-gradient-to-r from-transparent via-[#38271F]/22 to-transparent"
                />
                <div
                  key={`turn-leaf-${turnState.key}`}
                  aria-hidden="true"
                  style={
                    {
                      '--turn-start-p': turnState.startProgress.toFixed(4),
                    } as React.CSSProperties
                  }
                  className={`pointer-events-none absolute inset-y-0 w-1/2 z-40 ${
                    turnState.dir === 1
                      ? 'right-0 book-turn-leaf-next'
                      : 'left-0 book-turn-leaf-prev'
                  }`}
                >
                  {/* Front Side of Turning Leaf (leaving page) */}
                  <div className="book-face-front absolute inset-0 overflow-hidden shadow-lg">
                    {turnState.dir === 1 ? (
                      turnState.outgoing.rightPage ? (
                        <BookPage
                          page={turnState.outgoing.rightPage}
                          side="right"
                          onSelectPolaroid={onSelectPolaroid}
                          onOpenEnvelope={onOpenEnvelope}
                        />
                      ) : (
                        <ClosingBookPage onReturnToCover={onReturnToCover} />
                      )
                    ) : turnState.outgoing.leftPage ? (
                      <BookPage
                        page={turnState.outgoing.leftPage}
                        side="left"
                        onSelectPolaroid={onSelectPolaroid}
                        onOpenEnvelope={onOpenEnvelope}
                      />
                    ) : (
                      <div className="h-full bg-[#FBF7EF] book-page-left rounded-l-md" />
                    )}
                  </div>

                  {/* Back Side of Turning Leaf (connected arriving page) */}
                  <div
                    className={`absolute inset-0 overflow-hidden shadow-lg ${
                      turnState.dir === 1 ? 'book-face-back-next' : 'book-face-back-prev'
                    }`}
                  >
                    {turnState.dir === 1 ? (
                      turnState.incoming.leftPage ? (
                        <BookPage
                          page={turnState.incoming.leftPage}
                          side="left"
                          onSelectPolaroid={onSelectPolaroid}
                          onOpenEnvelope={onOpenEnvelope}
                        />
                      ) : (
                        <div className="h-full bg-[#FBF7EF] book-page-left rounded-l-md" />
                      )
                    ) : turnState.incoming.rightPage ? (
                      <BookPage
                        page={turnState.incoming.rightPage}
                        side="right"
                        onSelectPolaroid={onSelectPolaroid}
                        onOpenEnvelope={onOpenEnvelope}
                      />
                    ) : (
                      <ClosingBookPage onReturnToCover={onReturnToCover} />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

