import { Heart } from 'lucide-react';
import { HiddenFlowerSpot } from '../Flower';
import { HiddenEnvelopeMessage } from '../../data/hiddenMessages';
import { BookPolaroidItem, MemoryBookPage } from '../../data/memories';
import { useContentStore } from '../../store/useContentStore';
import { getEnabledSecretNotesForPage } from '../../utils/secretNotes';
import { HiddenEnvelopeTrigger } from './HiddenEnvelope';
import { StoryPolaroid } from './Polaroid';
import { DecorationSVG, PageDecorationsLayer } from './ScrapbookDecorations';

interface BookPageProps {
  page: MemoryBookPage;
  side: 'left' | 'right';
  onSelectPolaroid: (item: BookPolaroidItem, pageLabel: string) => void;
  onOpenEnvelope: (msg: HiddenEnvelopeMessage) => void;
  showCornerCurlHint?: boolean;
}

const PAPER_TINTS: Record<NonNullable<MemoryBookPage['paperTint']>, string> = {
  ivory: 'bg-[#FBF7EF]',
  'warm-linen': 'bg-[#F7EFE1]',
  'blush-tint': 'bg-[#FAF1EE]',
  'sage-tint': 'bg-[#F3F3EB]',
};

const DEDICATED_ENVELOPE_LAYOUTS = new Set([
  'stickers-and-secret-note',
  'ticket-stubs-arrangement',
  'woodland-botanical-sketch',
  'journal-letter-composition',
  'reflective-keepsake-quote',
  'final-chapter-finale',
]);

export function BookPage({
  page,
  side,
  onSelectPolaroid,
  onOpenEnvelope,
  showCornerCurlHint = true,
}: BookPageProps) {
  const secretNotes = useContentStore((s) => s.secretNotes);
  const pageSecretNotes = getEnabledSecretNotesForPage(secretNotes, page.pageNumber);
  const hasDedicatedSlot = DEDICATED_ENVELOPE_LAYOUTS.has(page.layoutType);

  const tintClass = PAPER_TINTS[page.paperTint ?? 'ivory'];
  const sideShadowClass = side === 'left' ? 'book-page-left' : 'book-page-right';
  const pageLabel = `Halaman ${String(page.pageNumber).padStart(2, '0')}`;

  const selectPhoto = (item: BookPolaroidItem) => onSelectPolaroid(item, pageLabel);

  const renderPageEnvelopes = (alignEnd = false) => {
    if (pageSecretNotes.length === 0) return null;
    return (
      <div
        className={`flex flex-wrap items-center gap-1.5 ${
          alignEnd ? 'justify-end' : 'justify-start'
        }`}
      >
        {pageSecretNotes.map((note) => (
          <HiddenEnvelopeTrigger
            key={note.id}
            note={note}
            onOpen={onOpenEnvelope}
            compact
          />
        ))}
      </div>
    );
  };

  const renderComposition = () => {
    switch (page.layoutType) {
      // PAGE 1: Introductory page with a large Polaroid and welcoming handwritten note
      case 'intro-polaroid-note':
        return (
          <div className="flex flex-col items-center justify-between h-full gap-2 sm:gap-3 pt-1">
            <div className="text-center">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#743D4A] font-medium">
                {page.subtitle}
              </p>
              <h3 className="mt-0.5 font-serif text-base sm:text-xl md:text-2xl font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />}
            <div className="w-full max-w-[290px] bg-[#F4EBDD]/75 border border-[#C4A574]/35 rounded-lg px-2.5 py-2 text-center">
              <p className="font-hand text-sm sm:text-lg text-[#743D4A] leading-tight">
                {page.handwrittenNote}
              </p>
              <p className="mt-1 hidden sm:block text-[11px] text-[#38271F]/75 leading-relaxed">
                {page.bodyCopy}
              </p>
            </div>
          </div>
        );

      // PAGE 2: Main memory photograph with elegant floral decorations (+ Flower #2)
      case 'floral-spotlight':
        return (
          <div className="flex flex-col items-center justify-between h-full gap-2 pt-1">
            <div className="w-full flex items-start justify-between gap-2 pl-4 sm:pl-5">
              <div>
                <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#455342] font-medium">
                  {page.subtitle}
                </p>
                <h3 className="font-serif text-base sm:text-xl font-semibold text-[#38271F]">
                  {page.title}
                </h3>
              </div>
              <div data-interactive-item="true" data-no-swipe="true" onPointerDown={(e) => e.stopPropagation()}>
                <HiddenFlowerSpot flowerId="flower-sunflower" />
              </div>
            </div>
            {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />}
            <p className="font-hand text-sm sm:text-lg text-[#455342] text-center max-w-[240px] leading-tight">
              &ldquo;{page.handwrittenNote}&rdquo;
            </p>
          </div>
        );

      // PAGE 3: Several small Polaroids arranged asymmetrically
      case 'asymmetric-mini-cluster':
        return (
          <div className="flex flex-col justify-between h-full gap-2">
            <div>
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#743D4A] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-sm sm:text-lg font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            <div className="relative flex-1 flex flex-col justify-center gap-2 sm:gap-3">
              <div className="flex justify-start pl-1">
                {page.polaroids[0] && (
                  <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} compactCaption />
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pr-1 -mt-2 sm:-mt-4">
                {page.polaroids[2] && (
                  <StoryPolaroid
                    item={page.polaroids[2]}
                    onSelect={selectPhoto}
                    compactCaption
                    className="hidden sm:block"
                  />
                )}
                {page.polaroids[1] && (
                  <StoryPolaroid item={page.polaroids[1]} onSelect={selectPhoto} compactCaption />
                )}
              </div>
            </div>
            <p className="font-hand text-xs sm:text-base text-[#743D4A] text-center">
              {page.handwrittenNote}
            </p>
          </div>
        );

      // PAGE 4: Layered photo collage with handwritten captions
      case 'layered-collage-captions':
        return (
          <div className="flex flex-col justify-between h-full gap-2">
            <div className="text-right">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#A6533B] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-sm sm:text-lg font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            <div className="relative flex-1 flex flex-col items-center justify-center gap-2 sm:gap-0">
              {page.polaroids[0] && (
                <div className="self-start sm:ml-2 z-10">
                  <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />
                </div>
              )}
              {page.polaroids[1] && (
                <div className="self-end sm:-mt-10 sm:mr-2 z-20">
                  <StoryPolaroid item={page.polaroids[1]} onSelect={selectPhoto} compactCaption />
                </div>
              )}
            </div>
            <div className="border-t border-dashed border-[#38271F]/20 pt-1.5">
              <p className="font-hand text-xs sm:text-base text-[#743D4A]">{page.handwrittenNote}</p>
            </div>
          </div>
        );

      // PAGE 5: One large photograph with pressed flowers
      case 'large-pressed-botanical':
        return (
          <div className="flex flex-col items-center justify-between h-full gap-2 pt-2">
            <div className="text-center">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#455342] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-base sm:text-xl font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            <div className="relative flex items-center justify-center py-1">
              {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />}
            </div>
            <div className="text-center max-w-[260px]">
              <p className="font-hand text-sm sm:text-lg text-[#455342]">{page.handwrittenNote}</p>
              <p className="hidden sm:block mt-1 text-[11px] text-[#38271F]/72 leading-relaxed">
                {page.bodyCopy}
              </p>
            </div>
          </div>
        );

      // PAGE 6: Smaller photographs, decorative stickers, and a hidden note
      case 'stickers-and-secret-note':
        return (
          <div className="flex flex-col justify-between h-full gap-2">
            <div>
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#743D4A] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-sm sm:text-lg font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-center justify-items-center">
              {page.polaroids[0] && (
                <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} compactCaption />
              )}
              {page.polaroids[1] && (
                <StoryPolaroid
                  item={page.polaroids[1]}
                  onSelect={selectPhoto}
                  compactCaption
                  className="hidden sm:block"
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="font-hand text-xs sm:text-base text-[#743D4A] leading-tight flex-1">
                {page.handwrittenNote}
              </p>
              {renderPageEnvelopes(true)}
            </div>
          </div>
        );

      // PAGE 7: Travel-inspired scrapbook layout with stamps and map details
      case 'travel-stamps-map':
        return (
          <div className="flex flex-col justify-between h-full gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px] tracking-widest uppercase text-[#455342] font-semibold">
                <span>{page.subtitle}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{page.extraTags?.[1] ?? 'JOURNAL MAP'}</span>
              </div>
              <h3 className="mt-0.5 font-serif text-sm sm:text-xl font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            {/* Decorative vintage route dashed trace */}
            <div className="relative flex flex-col items-center justify-center my-auto">
              <svg
                viewBox="0 0 260 30"
                className="w-full h-5 sm:h-6 text-[#A6533B]/45 mb-1"
                aria-hidden="true"
              >
                <path
                  d="M12 22 Q90 2 165 18 T248 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <circle cx="12" cy="22" r="3" fill="#455342" />
                <circle cx="248" cy="8" r="3" fill="#A6533B" />
              </svg>
              {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />}
            </div>
            <div className="border border-dashed border-[#C4A574]/70 rounded-md px-2.5 py-1.5 bg-[#FBF6EE]/70">
              <p className="font-hand text-xs sm:text-base text-[#38271F]">{page.handwrittenNote}</p>
            </div>
          </div>
        );

      // PAGE 8: Photograph arrangement with ticket-inspired decorations + envelope
      case 'ticket-stubs-arrangement':
        return (
          <div className="flex flex-col justify-between h-full gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#A6533B] font-medium">
                  {page.subtitle}
                </p>
                <h3 className="font-serif text-sm sm:text-lg font-semibold text-[#38271F]">
                  {page.title}
                </h3>
              </div>
            </div>

            {/* Vintage Ticket Stub Strip */}
            <div className="border-y border-dashed border-[#38271F]/25 py-1 px-2 bg-[#EFE4D1]/70 flex items-center justify-between text-[8px] sm:text-[10px] tracking-wider uppercase text-[#743D4A] font-medium">
              <span>{page.extraTags?.[0] ?? 'TICKET 0204'}</span>
              <span className="hidden sm:inline">{page.extraTags?.[1] ?? 'ADMIT TWO'}</span>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 my-auto">
              {page.polaroids[0] && (
                <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} compactCaption />
              )}
              {page.polaroids[1] && (
                <StoryPolaroid
                  item={page.polaroids[1]}
                  onSelect={selectPhoto}
                  compactCaption
                  className="hidden sm:block"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="font-hand text-xs sm:text-base text-[#743D4A] flex-1 leading-tight">
                {page.handwrittenNote}
              </p>
              {renderPageEnvelopes(true)}
            </div>
          </div>
        );

      // PAGE 9: Portrait-oriented Polaroid composition
      case 'portrait-gallery-frame':
        return (
          <div className="flex flex-col items-center justify-between h-full gap-2">
            <div className="text-center">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#743D4A] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-base sm:text-xl font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />}
            <p className="font-hand text-xs sm:text-base text-[#743D4A] text-center max-w-[230px]">
              {page.handwrittenNote}
            </p>
          </div>
        );

      // PAGE 10: Landscape photograph with handwritten storytelling
      case 'landscape-storytelling':
        return (
          <div className="flex flex-col justify-between h-full gap-2">
            <div>
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#A6533B] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-base sm:text-xl font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            <div className="flex justify-center">
              {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />}
            </div>
            <div className="bg-[#F4EBDD]/80 border border-[#38271F]/12 rounded-lg p-2 sm:p-3">
              <p className="font-hand text-sm sm:text-lg text-[#743D4A] leading-tight">
                {page.handwrittenNote}
              </p>
              <p className="hidden sm:block mt-1 text-xs text-[#38271F]/80 leading-relaxed">
                {page.bodyCopy}
              </p>
            </div>
          </div>
        );

      // PAGE 11: Cute decorative botanical and animal illustrations + envelope
      case 'woodland-botanical-sketch':
        return (
          <div className="flex flex-col items-center justify-between h-full gap-2">
            <div className="text-center">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#455342] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-sm sm:text-lg font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />}
            <div className="w-full flex items-center justify-between gap-2 pt-1">
              <p className="font-hand text-xs sm:text-base text-[#455342] leading-tight flex-1">
                {page.handwrittenNote}
              </p>
              {renderPageEnvelopes(true)}
            </div>
          </div>
        );

      // PAGE 12: Multiple photographs with small handwritten notes
      case 'multi-photo-margin-notes':
        return (
          <div className="flex flex-col justify-between h-full gap-2">
            <div className="text-right">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#743D4A] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-sm sm:text-lg font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            <div className="space-y-2 sm:space-y-3 my-auto">
              {page.polaroids[0] && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} compactCaption />
                  <p className="hidden sm:block font-hand text-base text-[#38271F]/85 leading-snug -rotate-1">
                    {page.polaroids[0].caption}
                  </p>
                </div>
              )}
              {page.polaroids[1] && (
                <div className="hidden sm:flex items-center justify-end gap-3">
                  <p className="font-hand text-base text-[#743D4A] leading-snug rotate-1 text-right">
                    {page.polaroids[1].caption}
                  </p>
                  <StoryPolaroid item={page.polaroids[1]} onSelect={selectPhoto} compactCaption />
                </div>
              )}
            </div>
            <p className="font-hand text-xs sm:text-base text-[#743D4A]">{page.handwrittenNote}</p>
          </div>
        );

      // PAGE 13: Large central photograph with supporting decorations
      case 'central-heirloom-frame':
        return (
          <div className="flex flex-col items-center justify-between h-full gap-2 py-1">
            <div className="text-center">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#A6533B] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-base sm:text-xl font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            <div className="p-2 sm:p-3 rounded-xl border border-[#C4A574]/45 bg-[#F4EBDD]/55">
              {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />}
            </div>
            <p className="font-hand text-xs sm:text-lg text-[#743D4A] text-center max-w-[260px]">
              {page.handwrittenNote}
            </p>
          </div>
        );

      // PAGE 14: Personal journal composition with a letter and photographs
      case 'journal-letter-composition':
        return (
          <div className="flex flex-col justify-between h-full gap-2">
            <div>
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#743D4A] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-sm sm:text-xl font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-2 sm:gap-3 items-center my-auto">
              {page.polaroids[0] && (
                <div className="justify-self-center">
                  <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} compactCaption />
                </div>
              )}
              <div className="bg-[#FBF6EE]/85 border border-[#38271F]/12 rounded-lg p-2.5 sm:p-3">
                <p className="font-hand text-sm sm:text-lg text-[#A6533B] leading-tight">
                  {page.handwrittenNote}
                </p>
                <p className="hidden sm:block mt-1.5 text-xs text-[#38271F]/80 leading-relaxed">
                  {page.bodyCopy}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              {renderPageEnvelopes(true)}
            </div>
          </div>
        );

      // PAGE 15: Collection of memorable photographs
      case 'memory-constellation-grid':
        return (
          <div className="flex flex-col justify-between h-full gap-2">
            <div>
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#455342] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-sm sm:text-lg font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 my-auto">
              {page.polaroids[0] && (
                <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} compactCaption />
              )}
              {page.polaroids[1] && (
                <StoryPolaroid
                  item={page.polaroids[1]}
                  onSelect={selectPhoto}
                  compactCaption
                  className="hidden sm:block"
                />
              )}
            </div>
            <p className="font-hand text-xs sm:text-base text-[#455342] text-center">
              {page.handwrittenNote}
            </p>
          </div>
        );

      // PAGE 16: Reflective page with meaningful message + envelope
      case 'reflective-keepsake-quote':
        return (
          <div className="flex flex-col items-center justify-between h-full gap-2">
            <div className="text-center">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#743D4A] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-sm sm:text-lg font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} compactCaption />}
            <blockquote className="text-center max-w-[260px] bg-[#F4EBDD]/70 rounded-lg px-2.5 py-2 border border-[#38271F]/10">
              <p className="font-hand text-xs sm:text-base text-[#743D4A] leading-tight">
                &ldquo;{page.handwrittenNote}&rdquo;
              </p>
            </blockquote>
            {pageSecretNotes.length > 0 && (
              <div className="self-end">{renderPageEnvelopes(true)}</div>
            )}
          </div>
        );

      // PAGE 17: The final designed memory page
      case 'final-chapter-finale':
      default:
        return (
          <div className="flex flex-col items-center justify-between h-full gap-2">
            <div className="text-center">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-widest text-[#A6533B] font-medium">
                {page.subtitle}
              </p>
              <h3 className="font-serif text-base sm:text-xl font-semibold text-[#38271F]">
                {page.title}
              </h3>
            </div>
            {page.polaroids[0] && <StoryPolaroid item={page.polaroids[0]} onSelect={selectPhoto} />}
            <div className="w-full flex items-center justify-between gap-2">
              <p className="font-hand text-xs sm:text-base text-[#743D4A] leading-tight flex-1">
                {page.handwrittenNote}
              </p>
              {renderPageEnvelopes(true)}
            </div>
          </div>
        );
    }
  };

  return (
    <section
      aria-label={pageLabel}
      data-book-side={side}
      className={`relative h-full min-h-[372px] sm:min-h-[475px] md:min-h-[526px] p-3 sm:p-5 md:p-7 flex flex-col justify-between overflow-hidden ${tintClass} ${sideShadowClass} ${
        side === 'left'
          ? 'rounded-l-md sm:rounded-l-lg border-r border-[#38271F]/10'
          : 'rounded-r-md sm:rounded-r-lg border-l border-[#38271F]/10'
      }`}
    >
      {/* Subtle tactile corner curl affordance at outer bottom corner */}
      {showCornerCurlHint && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-0 z-30 transition-transform duration-200 ${
            side === 'left'
              ? 'left-0 book-corner-peel-left w-5 h-5 sm:w-7 sm:h-7'
              : 'right-0 book-corner-peel-right w-5 h-5 sm:w-7 sm:h-7'
          } opacity-75`}
        />
      )}

      {/* Handcrafted Botanical / Animal / Scrapbook Decorations */}
      <PageDecorationsLayer decorations={page.decorations} />

      {/* Unique Page Composition Content */}
      <div className="relative z-20 flex-1 flex flex-col px-1 sm:px-1.5">
        {renderComposition()}
        {!hasDedicatedSlot && pageSecretNotes.length > 0 && (
          <div className="mt-1.5 flex justify-end">{renderPageEnvelopes(true)}</div>
        )}
      </div>

      {/* Explicit Page Number Indicator (strictly 1..17) */}
      <div
        className={`relative z-20 pt-2 flex items-center gap-2 text-[10px] sm:text-xs font-serif text-[#38271F]/55 tabular-nums ${
          side === 'left' ? 'justify-start pl-4 sm:pl-5' : 'justify-end pr-4 sm:pr-6'
        }`}
      >
        <span>{String(page.pageNumber).padStart(2, '0')}</span>
      </div>
    </section>
  );
}

/**
 * Complementary unnumbered closing side opposite Page 17 on Spread 9.
 * Explicitly NOT counted as a 18th memory page.
 */
export function ClosingBookPage({ onReturnToCover }: { onReturnToCover: () => void }) {
  return (
    <section
      aria-label="Halaman penutup dekoratif"
      data-book-side="right"
      className="relative h-full min-h-[372px] sm:min-h-[475px] md:min-h-[526px] p-3 sm:p-5 md:p-7 flex flex-col items-center justify-between overflow-hidden bg-[#F7EFE1] book-page-right rounded-r-md sm:rounded-r-lg border-l border-[#38271F]/10 text-center"
    >
      {/* Top Botanical Wreath Corner & Flower #3 for Secret Quest */}
      <div className="w-full flex items-start justify-between">
        <DecorationSVG kind="branch" className="w-8 h-8 sm:w-11 sm:h-11 opacity-75 story-animate-sway" />
        <div data-interactive-item="true" data-no-swipe="true" onPointerDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <HiddenFlowerSpot flowerId="flower-daisy" />
        </div>
      </div>

      {/* Emotional Closing Composition */}
      <div className="relative z-10 max-w-[260px] px-2 py-4 sm:py-6">
        <span
          aria-hidden="true"
          className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-[#743D4A] text-[#F4EBDD] flex items-center justify-center shadow-md mb-3 sm:mb-4"
        >
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-[#F4EBDD]" />
        </span>

        <p className="text-[9px] sm:text-[11px] tracking-[0.18em] uppercase text-[#743D4A] font-medium">
          To Be Continued
        </p>

        <h3 className="mt-2 font-serif italic text-lg sm:text-2xl md:text-3xl font-semibold text-[#38271F] text-balance leading-snug">
          Our story is still being written...
        </h3>

        <p className="mt-2 sm:mt-3 font-hand text-base sm:text-xl text-[#A6533B]">
          Terima kasih sudah hadir di setiap halamannya, Wulan ♡
        </p>

        <button
          type="button"
          data-interactive-item="true"
          data-no-swipe="true"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onReturnToCover();
          }}
          className="mt-4 sm:mt-6 min-h-[40px] sm:min-h-[44px] px-4 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-[11px] sm:text-xs font-medium hover:bg-[#4e382d] transition-colors cursor-pointer"
        >
          Tutup Buku
        </button>
      </div>

      {/* Bottom Corner Ornament (Intentionally Unnumbered) */}
      <div className="w-full flex items-end justify-between opacity-75">
        <DecorationSVG kind="rose" className="w-7 h-7 sm:w-9 sm:h-9 story-animate-sway" />
        <span className="font-serif italic text-[10px] sm:text-xs text-[#38271F]/50">∞</span>
        <DecorationSVG kind="butterfly" className="w-7 h-7 sm:w-9 sm:h-9 story-animate-float" />
      </div>
    </section>
  );
}
