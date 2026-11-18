import { useState } from 'react';
import { BookMarked, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MemoryBookPage } from '../../data/memories';
import {
  BookSpreadPair,
  getReadingProgressPercent,
  getSpreadPageIndicator,
  TOTAL_MEMORY_PAGES,
} from '../../utils/memoryBook';

interface PageNavigationProps {
  spreadIndex: number;
  spreads: BookSpreadPair<MemoryBookPage>[];
  onPrev: () => void;
  onNext: () => void;
  onJumpToSpread: (index: number) => void;
  onCloseBook: () => void;
}

export function PageNavigation({
  spreadIndex,
  spreads,
  onPrev,
  onNext,
  onJumpToSpread,
  onCloseBook,
}: PageNavigationProps) {
  const [indexOpen, setIndexOpen] = useState(false);

  const pageLabel = getSpreadPageIndicator(spreadIndex, TOTAL_MEMORY_PAGES);
  const progressPercent = getReadingProgressPercent(spreadIndex, TOTAL_MEMORY_PAGES);
  const currentSpread = spreads[spreadIndex];
  const spreadTheme = currentSpread?.leftPage?.spreadTheme ?? `Spread ${spreadIndex + 1}`;

  return (
    <div className="relative w-full max-w-[540px] mx-auto px-2 sm:px-3 mt-2">
      <div className="bg-[#FBF6EE]/86 backdrop-blur-xs border border-[#38271F]/12 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          {/* Close Book */}
          <button
            type="button"
            onClick={onCloseBook}
            aria-label="Tutup Buku"
            className="min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg border border-[#38271F]/14 text-[11px] font-medium text-[#38271F]/80 hover:text-[#38271F] hover:bg-[#EAE0CF]/80 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tutup</span>
          </button>

          {/* Center Page Counter & Quick Index */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-center min-w-0">
              <p className="text-xs font-serif font-semibold text-[#38271F] tabular-nums whitespace-nowrap">
                {pageLabel}
              </p>
              <p className="hidden sm:block text-[10px] text-[#743D4A]/85 truncate">{spreadTheme}</p>
            </div>

            <button
              type="button"
              onClick={() => setIndexOpen((v) => !v)}
              aria-expanded={indexOpen}
              aria-label="Daftar halaman buku"
              className={`min-h-[38px] px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                indexOpen
                  ? 'bg-[#455342] text-[#F4EBDD] border-[#455342]'
                  : 'bg-[#F4EBDD]/75 text-[#38271F]/85 border-[#38271F]/14 hover:bg-[#EAE0CF]'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Daftar Isi</span>
            </button>
          </div>

          {/* Secondary Previous / Next Spread Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onPrev}
              disabled={spreadIndex <= 0}
              aria-label="Halaman sebelumnya"
              className="min-w-[38px] min-h-[38px] px-2 py-1 rounded-lg border border-[#38271F]/14 bg-[#FBF6EE] text-[11px] font-medium text-[#38271F]/85 hover:bg-[#EAE0CF] disabled:opacity-30 disabled:pointer-events-none inline-flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={spreadIndex >= spreads.length - 1}
              aria-label="Halaman berikutnya"
              className="min-w-[38px] min-h-[38px] px-2 py-1 rounded-lg bg-[#38271F]/90 text-[#F4EBDD] text-[11px] font-medium hover:bg-[#38271F] disabled:opacity-30 disabled:pointer-events-none inline-flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hairline Reading Progress Track */}
        <div className="mt-1.5 flex items-center gap-2.5">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Progres membaca Memory Book"
            className="flex-1 h-1 rounded-full bg-[#38271F]/10 overflow-hidden"
          >
            <div
              className="h-full bg-[#A6533B]/85 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-[#38271F]/60 tabular-nums whitespace-nowrap">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Subtle Gesture Tip */}
      <p className="mt-1 px-4 text-center font-hand text-[13px] sm:text-sm text-[#38271F]/65 select-none">
        <span className="sm:hidden">Ketuk sisi kertas, geser, atau tarik sudutnya ♡</span>
        <span className="hidden sm:inline">
          Ketuk halaman kiri/kanan, geser, atau tarik sudut kertas untuk membalik halaman ♡
        </span>
      </p>

      {/* Quick Spread Index Selector Drawer */}
      {indexOpen && (
        <div className="mt-2 bg-[#FBF6EE] border border-[#38271F]/18 rounded-2xl p-3 sm:p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#38271F]">
              Lompat ke Bagian Buku (9 Spread · 17 Halaman)
            </p>
            <button
              type="button"
              onClick={() => setIndexOpen(false)}
              aria-label="Tutup daftar halaman"
              className="text-xs text-[#743D4A] hover:underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {spreads.map((sp) => {
              const active = sp.spreadIndex === spreadIndex;
              const pLeft = sp.leftPage?.pageNumber;
              const pRight = sp.rightPage?.pageNumber;
              const numLabel = pRight ? `Hal. ${pLeft}–${pRight}` : `Hal. ${pLeft}`;
              return (
                <button
                  key={sp.spreadIndex}
                  type="button"
                  onClick={() => {
                    onJumpToSpread(sp.spreadIndex);
                    setIndexOpen(false);
                  }}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-left text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    active
                      ? 'bg-[#38271F] text-[#F4EBDD]'
                      : 'bg-[#F4EBDD]/70 text-[#38271F] hover:bg-[#EAE0CF]'
                  }`}
                >
                  <span className="truncate font-medium">
                    {sp.leftPage?.spreadTheme ?? `Spread ${sp.spreadNumber}`}
                  </span>
                  <span className="text-[10px] opacity-75 tabular-nums shrink-0">{numLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

