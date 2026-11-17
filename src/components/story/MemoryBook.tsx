import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { HiddenEnvelopeMessage } from '../../data/hiddenMessages';
import { BookPolaroidItem } from '../../data/memories';
import { useContentStore } from '../../store/useContentStore';
import {
  buildBookSpreads,
  clampSpreadIndex,
  loadSessionSpreadIndex,
  saveSessionSpreadIndex,
} from '../../utils/memoryBook';
import { BookCover } from './BookCover';
import { BookSpread } from './BookSpread';
import { HiddenEnvelopeModal } from './HiddenEnvelope';
import { PageNavigation } from './PageNavigation';
import { PhotoModal } from './PhotoModal';

interface MemoryBookProps {
  onFirstBookInteraction: () => void;
}

type BookLifecycleState = 'closed' | 'opening' | 'open' | 'closing';

const BOOK_OPEN_DURATION_MS = 480;
const BOOK_CLOSE_DURATION_MS = 460;

export function MemoryBook({ onFirstBookInteraction }: MemoryBookProps) {
  const prefersReducedMotion = useReducedMotion();
  const storyPages = useContentStore((s) => s.storyPages);

  const spreads = useMemo(() => buildBookSpreads(storyPages), [storyPages]);

  const [bookState, setBookState] = useState<BookLifecycleState>('closed');
  const [spreadIndex, setSpreadIndex] = useState<number>(() => loadSessionSpreadIndex());
  const [turnDirection, setTurnDirection] = useState<1 | -1>(1);
  const transitionTimerRef = useRef<number | null>(null);

  const [activePhoto, setActivePhoto] = useState<{
    item: BookPolaroidItem;
    pageLabel: string;
  } | null>(null);
  const [activeEnvelope, setActiveEnvelope] = useState<HiddenEnvelopeMessage | null>(null);

  const clearTransitionTimer = () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTransitionTimer();
  }, []);

  const goToSpread = useCallback(
    (nextIndex: number) => {
      const clamped = clampSpreadIndex(nextIndex, spreads.length);
      setSpreadIndex((prev) => {
        setTurnDirection(clamped >= prev ? 1 : -1);
        saveSessionSpreadIndex(clamped);
        return clamped;
      });
    },
    [spreads.length]
  );

  const handleOpenBook = () => {
    if (bookState === 'open' || bookState === 'opening') return;
    clearTransitionTimer();
    onFirstBookInteraction();

    const reducedNow =
      prefersReducedMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (reducedNow) {
      setBookState('open');
      return;
    }

    setBookState('opening');
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null;
      setBookState('open');
    }, BOOK_OPEN_DURATION_MS);
  };

  const handleCloseBook = () => {
    if (bookState === 'closed' || bookState === 'closing') return;
    clearTransitionTimer();
    setActivePhoto(null);
    setActiveEnvelope(null);
    saveSessionSpreadIndex(spreadIndex);

    const reducedNow =
      prefersReducedMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    if (reducedNow) {
      setBookState('closed');
      return;
    }

    setBookState('closing');
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null;
      setBookState('closed');
    }, BOOK_CLOSE_DURATION_MS);
  };

  const handleNextSpread = useCallback(() => {
    if (spreadIndex < spreads.length - 1) {
      goToSpread(spreadIndex + 1);
    }
  }, [spreadIndex, spreads.length, goToSpread]);

  const handlePrevSpread = useCallback(() => {
    if (spreadIndex > 0) {
      goToSpread(spreadIndex - 1);
    }
  }, [spreadIndex, goToSpread]);

  useEffect(() => {
    if (bookState !== 'open' || activePhoto || activeEnvelope) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNextSpread();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSpread();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bookState, activePhoto, activeEnvelope, handleNextSpread, handlePrevSpread]);

  const currentSpread = spreads[spreadIndex] ?? spreads[0];
  const prevSpread = spreadIndex > 0 ? spreads[spreadIndex - 1] ?? null : null;
  const nextSpread = spreadIndex < spreads.length - 1 ? spreads[spreadIndex + 1] ?? null : null;
  const isShowingBookInterior = bookState !== 'closed';

  return (
    <div className="w-full overflow-x-hidden" data-book-state={bookState}>
      {!isShowingBookInterior ? (
        <BookCover
          onOpen={handleOpenBook}
          hasSavedSessionSpread={spreadIndex > 0}
        />
      ) : (
        <div className="book-stage-3d relative w-full">
          {/* Interior Spread & Page Controls */}
          <div
            className={`w-full ${
              bookState === 'opening'
                ? 'book-spread-emerge'
                : bookState === 'closing'
                  ? 'book-spread-fold pointer-events-none'
                  : ''
            }`}
          >
            <BookSpread
              spread={currentSpread}
              prevSpread={prevSpread}
              nextSpread={nextSpread}
              canGoPrev={spreadIndex > 0}
              canGoNext={spreadIndex < spreads.length - 1}
              direction={turnDirection}
              onNextSpread={handleNextSpread}
              onPrevSpread={handlePrevSpread}
              onSelectPolaroid={(item, pageLabel) => setActivePhoto({ item, pageLabel })}
              onOpenEnvelope={(msg) => setActiveEnvelope(msg)}
              onReturnToCover={handleCloseBook}
            />

            <PageNavigation
              spreadIndex={spreadIndex}
              spreads={spreads}
              onPrev={handlePrevSpread}
              onNext={handleNextSpread}
              onJumpToSpread={goToSpread}
              onCloseBook={handleCloseBook}
            />
          </div>

          {/* 3D Front Cover Hinge Overlay During Opening & Closing */}
          {(bookState === 'opening' || bookState === 'closing') && !prefersReducedMotion && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-50 flex items-start justify-center pt-4 sm:pt-6"
            >
              <div
                className={
                  bookState === 'opening' ? 'book-cover-hinge-open' : 'book-cover-hinge-close'
                }
              >
                <BookCover
                  decorativeOnly
                  hasSavedSessionSpread={spreadIndex > 0}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expanded Photograph Modal */}
      <PhotoModal
        polaroid={activePhoto?.item ?? null}
        pageLabel={activePhoto?.pageLabel}
        onClose={() => setActivePhoto(null)}
      />

      {/* Hidden Paper Envelope Message Modal */}
      <HiddenEnvelopeModal
        envelope={activeEnvelope}
        onClose={() => setActiveEnvelope(null)}
      />
    </div>
  );
}
