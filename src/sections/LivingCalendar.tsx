import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  BotanicalDivider,
  EditorialHeader,
  EditorialSectionShell,
  StorybookButton,
  StorybookSurface,
} from '../components/editorial/StorybookPrimitives';
import { BotanicalFlowerSVG } from '../components/Flower';
import type { PostcardEnvelope } from '../data/postcards';
import type { WishlistEntry } from '../data/wishlist';
import { useFirebaseAuth } from '../lib/FirebaseProvider';
import { useContentStore } from '../store/useContentStore';
import { useStore } from '../store/useStore';
import {
  subscribePostcardEnvelopes,
  subscribeWishlistEntries,
} from '../utils/adminApi';
import { EASE_OUT_EXPO } from '../utils/animation';
import {
  CalendarEventSource,
  CustomCalendarEvent,
  INDONESIAN_MONTHS,
  LivingCalendarEvent,
  buildLivingCalendarEvents,
  formatIndonesianDateLabel,
  formatRelativeDaysLabel,
  getMonthGridCells,
  getNextUpcomingEvent,
  getTodayDateKey,
  loadCustomCalendarEvents,
  saveCustomCalendarEvents,
  validateCustomCalendarEvent,
} from '../utils/livingCalendar';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

type SourceFilter = 'all' | CalendarEventSource;

const SOURCE_FILTER_TABS: { id: SourceFilter; label: string }[] = [
  { id: 'all', label: 'Semua Momen' },
  { id: 'special', label: 'Hari Istimewa' },
  { id: 'wishlist', label: 'Jadwal Impian' },
  { id: 'postcard', label: 'Kartu Pos' },
  { id: 'story', label: 'Kenangan' },
  { id: 'custom', label: 'Catatan Kita' },
];

export function LivingCalendar() {
  const storyPages = useContentStore((s) => s.storyPages);
  const navigateTo = useStore((s) => s.navigateTo);
  const { user, authReady, coupleRole } = useFirebaseAuth();

  const [wishlistEntries, setWishlistEntries] = useState<WishlistEntry[]>([]);
  const [postcardEnvelopes, setPostcardEnvelopes] = useState<PostcardEnvelope[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomCalendarEvent[]>(() =>
    loadCustomCalendarEvents()
  );

  // Default focus on April 2026 (Wulan's Birthday almanac) or current month if past April 2026
  const todayKey = useMemo(() => getTodayDateKey(), []);
  const initialFocus = useMemo(() => {
    const now = new Date();
    if (now.getFullYear() === 2026 && now.getMonth() < 3) {
      return { year: 2026, month: 3 }; // April 2026
    }
    return { year: now.getFullYear(), month: now.getMonth() };
  }, []);

  const [viewYear, setViewYear] = useState(initialFocus.year);
  const [viewMonth, setViewMonth] = useState(initialFocus.month);
  const [selectedDateKey, setSelectedDateKey] = useState<string>('2026-04-02');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  // Inline custom special date creator
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState('2026-04-02');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    const unsubWish = subscribeWishlistEntries(
      user?.email || null,
      coupleRole,
      (items) => setWishlistEntries(items),
      () => {}
    );
    const unsubPostcards = subscribePostcardEnvelopes(
      user?.email || null,
      coupleRole,
      (items) => setPostcardEnvelopes(items),
      () => {}
    );
    return () => {
      unsubWish();
      unsubPostcards();
    };
  }, [authReady, user?.email, coupleRole]);

  const allEvents = useMemo(
    () =>
      buildLivingCalendarEvents({
        storyPages,
        wishlistEntries,
        postcardEnvelopes,
        customEvents,
      }),
    [storyPages, wishlistEntries, postcardEnvelopes, customEvents]
  );

  const filteredEvents = useMemo(() => {
    if (sourceFilter === 'all') return allEvents;
    return allEvents.filter((ev) => ev.source === sourceFilter);
  }, [allEvents, sourceFilter]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, LivingCalendarEvent[]>();
    for (const ev of allEvents) {
      const existing = map.get(ev.dateKey);
      if (existing) {
        existing.push(ev);
      } else {
        map.set(ev.dateKey, [ev]);
      }
    }
    return map;
  }, [allEvents]);

  const monthCells = useMemo(
    () => getMonthGridCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const currentMonthKey = useMemo(() => {
    const m = viewMonth + 1;
    return `${viewYear}-${m < 10 ? `0${m}` : m}`;
  }, [viewYear, viewMonth]);

  const selectedDayEvents = useMemo(
    () => eventsByDate.get(selectedDateKey) ?? [],
    [eventsByDate, selectedDateKey]
  );

  const upcomingSpotlight = useMemo(
    () => getNextUpcomingEvent(allEvents, todayKey),
    [allEvents, todayKey]
  );

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToDate = (dateKey: string) => {
    const [yStr, mStr] = dateKey.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
      setViewYear(y);
      setViewMonth(m - 1);
      setSelectedDateKey(dateKey);
      setDraftDate(dateKey);
    }
  };

  const handleAddCustomEvent = (e: FormEvent) => {
    e.preventDefault();
    const check = validateCustomCalendarEvent({
      dateKey: draftDate,
      title: draftTitle,
      note: draftNote,
    });
    if (!check.ok) {
      setFormError(check.error);
      return;
    }

    const nextItem: CustomCalendarEvent = {
      id: `cal-${Date.now()}`,
      dateKey: draftDate.trim(),
      title: draftTitle.trim(),
      note: draftNote.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextList = [...customEvents, nextItem];
    setCustomEvents(nextList);
    saveCustomCalendarEvents(nextList);
    setDraftTitle('');
    setDraftNote('');
    setFormError(null);
    setComposerOpen(false);
    handleJumpToDate(nextItem.dateKey);
  };

  const handleDeleteCustomEvent = (prefixedId: string) => {
    const rawId = prefixedId.replace(/^custom-/, '');
    const nextList = customEvents.filter((item) => item.id !== rawId);
    setCustomEvents(nextList);
    saveCustomCalendarEvents(nextList);
  };

  return (
    <EditorialSectionShell testId="living-calendar-section">
      <EditorialHeader
        kicker="08 · Almanak Momen & Hari Spesial"
        metaRight={`${allEvents.length} tanggal tercatat`}
        title="Our Living Calendar ♡"
        subtitle="Kalender khusus yang menyatukan ulang tahunmu, halaman kenangan bertanggal, rencana impian, dan jadwal terbukanya kartu pos."
        ornament={
          <div className="hidden sm:block opacity-85 mr-1">
            <BotanicalFlowerSVG species="daisy" className="w-9 h-9" />
          </div>
        }
        actions={
          <StorybookButton
            type="button"
            variant={composerOpen ? 'secondary' : 'primary'}
            onClick={() => {
              setDraftDate(selectedDateKey);
              setComposerOpen((v) => !v);
            }}
          >
            <Plus className="w-4 h-4 text-[#E8BFC5]" />
            <span>{composerOpen ? 'Tutup Form' : 'Tandai Tanggal Spesial'}</span>
          </StorybookButton>
        }
      />

      {/* Upcoming Spotlight Strip */}
      {upcomingSpotlight && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="mt-7"
        >
          <StorybookSurface
            tapeVariant="gold"
            cornerOrnament
            className="journal-lined flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#743D4A]">
                <Sparkles className="w-3.5 h-3.5 text-[#A6533B]" />
                <span className="uppercase tracking-wider">Momen Terdekat</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#455342]">
                  {formatRelativeDaysLabel(upcomingSpotlight.dateKey, todayKey)}
                </span>
              </div>
              <h2 className="editorial-subheading">{upcomingSpotlight.title}</h2>
              <p className="text-sm text-[#38271F]/75">
                {formatIndonesianDateLabel(upcomingSpotlight.dateKey)} — {upcomingSpotlight.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <StorybookButton
                type="button"
                variant="secondary"
                onClick={() => handleJumpToDate(upcomingSpotlight.dateKey)}
              >
                <CalendarHeart className="w-4 h-4 text-[#A6533B]" />
                <span>Sorot di Kalender</span>
              </StorybookButton>
              {upcomingSpotlight.targetSection !== 'calendar' && (
                <StorybookButton
                  type="button"
                  variant="forest"
                  onClick={() => navigateTo(upcomingSpotlight.targetSection)}
                >
                  <span>Buka Bab</span>
                  <ArrowRight className="w-4 h-4" />
                </StorybookButton>
              )}
            </div>
          </StorybookSurface>
        </motion.div>
      )}

      {/* Optional Add Custom Special Event Composer */}
      {composerOpen && (
        <motion.form
          onSubmit={handleAddCustomEvent}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <StorybookSurface tapeVariant="pink">
            <h2 className="font-serif text-xl font-semibold text-[#38271F]">
              Catat Tanggal Spesial Baru
            </h2>
            <p className="mt-1 text-xs text-[#38271F]/70">
              Catatan tanggal ini tersimpan di perangkatmu agar bisa kamu lihat kembali kapan saja.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <label className="flex flex-col gap-1 text-xs font-medium text-[#38271F]/80">
                <span>Tanggal</span>
                <input
                  type="date"
                  value={draftDate}
                  onChange={(e) => {
                    setDraftDate(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="min-h-[44px] rounded-lg border border-[#38271F]/18 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F]"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-[#38271F]/80 sm:col-span-2">
                <span>Nama Momen / Perayaan</span>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => {
                    setDraftTitle(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Contoh: Jalan sore pertama setelah ulang tahun ♡"
                  className="min-h-[44px] rounded-lg border border-[#38271F]/18 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F]"
                />
              </label>
            </div>

            <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-[#38271F]/80">
              <span>Catatan Singkat (Opsional)</span>
              <input
                type="text"
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Tempat, suasana, atau pesan kecil..."
                className="min-h-[44px] rounded-lg border border-[#38271F]/18 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F]"
              />
            </label>

            {formError && (
              <p role="alert" className="mt-3 text-xs font-medium text-[#A6533B]">
                {formError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <StorybookButton
                type="button"
                variant="ghost"
                onClick={() => setComposerOpen(false)}
              >
                Batal
              </StorybookButton>
              <StorybookButton type="submit" variant="primary">
                Simpan ke Kalender
              </StorybookButton>
            </div>
          </StorybookSurface>
        </motion.form>
      )}

      {/* Main Split Almanac Layout: Interactive Monthly Sheet + Day & Timeline Ledger */}
      <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Monthly Sheet */}
        <div className="lg:col-span-7">
          <StorybookSurface tapeVariant="sage" className="p-4 sm:p-6">
            {/* Month Switcher */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#38271F]/12">
              <div>
                <p className="editorial-kicker">Lembar Bulan</p>
                <h2 className="font-serif text-2xl font-semibold text-[#38271F]">
                  {INDONESIAN_MONTHS[viewMonth]} {viewYear}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="min-w-[44px] min-h-[44px] rounded-lg border border-[#38271F]/16 bg-[#F4EBDD]/60 text-[#38271F] hover:bg-[#EAE0CF] flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleJumpToDate('2026-04-02')}
                  className="min-h-[44px] px-3 rounded-lg border border-[#38271F]/16 bg-[#F4EBDD]/60 text-xs font-medium text-[#743D4A] hover:bg-[#EAE0CF] cursor-pointer whitespace-nowrap"
                >
                  02 Apr
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                  className="min-w-[44px] min-h-[44px] rounded-lg border border-[#38271F]/16 bg-[#F4EBDD]/60 text-[#38271F] hover:bg-[#EAE0CF] flex items-center justify-center cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Header */}
            <div className="mt-4 grid grid-cols-7 text-center text-[11px] font-medium uppercase tracking-wider text-[#38271F]/55">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Day Grid */}
            <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
              {monthCells.map((cell) => {
                const dayEvents = eventsByDate.get(cell.dateKey) ?? [];
                const isSelected = cell.dateKey === selectedDateKey;
                const isToday = cell.dateKey === todayKey;
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(cell.dateKey);
                      setDraftDate(cell.dateKey);
                      if (!cell.inCurrentMonth) {
                        handleJumpToDate(cell.dateKey);
                      }
                    }}
                    aria-label={`${formatIndonesianDateLabel(cell.dateKey)}${
                      hasEvents ? `, ${dayEvents.length} momen tercatat` : ''
                    }`}
                    aria-pressed={isSelected}
                    className={`relative min-h-[48px] sm:min-h-[54px] rounded-lg border p-1.5 flex flex-col items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#38271F] text-[#F4EBDD] border-[#38271F]'
                        : hasEvents
                          ? 'bg-[#F4EBDD]/85 text-[#38271F] border-[#C4A574]/55 hover:border-[#A6533B]'
                          : cell.inCurrentMonth
                            ? 'bg-[#FBF6EE] text-[#38271F] border-[#38271F]/8 hover:bg-[#F4EBDD]/70'
                            : 'bg-transparent text-[#38271F]/35 border-transparent hover:bg-[#F4EBDD]/40'
                    }`}
                  >
                    <span
                      className={`text-xs sm:text-sm tabular-nums ${
                        isSelected || hasEvents ? 'font-semibold' : 'font-normal'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Tiny botanical marker dots for recorded dates */}
                    <div className="flex items-center gap-0.5 h-2">
                      {isToday && !hasEvents && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-[#E8BFC5]' : 'bg-[#455342]'
                          }`}
                        />
                      )}
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: isSelected ? '#E8BFC5' : ev.accentColor,
                          }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </StorybookSurface>
        </div>

        {/* Selected Date Detail Ledger */}
        <div className="lg:col-span-5 space-y-5">
          <StorybookSurface cornerOrnament>
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#38271F]/12">
              <div>
                <p className="editorial-kicker">Tanggal Dipilih</p>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#38271F]">
                  {formatIndonesianDateLabel(selectedDateKey)}
                </h2>
                <p className="font-hand text-lg text-[#455342]">
                  {formatRelativeDaysLabel(selectedDateKey, todayKey)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraftDate(selectedDateKey);
                  setComposerOpen(true);
                }}
                className="min-h-[40px] px-3 rounded-lg border border-[#38271F]/18 bg-[#F4EBDD]/60 text-xs font-medium text-[#38271F] hover:bg-[#EAE0CF] cursor-pointer whitespace-nowrap"
              >
                + Catat Tanggal Ini
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="font-hand text-xl text-[#38271F]/70">
                  Belum ada catatan khusus di tanggal ini.
                </p>
                <p className="text-xs text-[#38271F]/60 leading-relaxed">
                  Klik &ldquo;+ Catat Tanggal Ini&rdquo; kalau mau menambahkan hari spesial, janji jalan, atau pengingat kecil.
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {selectedDayEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className="paper-plate p-3.5 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: ev.accentColor }}
                      >
                        {ev.categoryLabel}
                      </span>
                      {ev.canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomEvent(ev.id)}
                          aria-label={`Hapus ${ev.title}`}
                          className="min-w-[32px] min-h-[32px] rounded-md text-[#A6533B] hover:bg-[#A6533B]/10 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-[#38271F]">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-[#38271F]/72">{ev.subtitle}</p>
                    {ev.note && (
                      <p className="font-hand text-lg text-[#743D4A] leading-snug pt-0.5">
                        “{ev.note}”
                      </p>
                    )}
                    {ev.targetSection !== 'calendar' && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => navigateTo(ev.targetSection)}
                          className="text-xs font-semibold text-[#A6533B] hover:text-[#743D4A] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Kunjungi halaman terkait</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </StorybookSurface>
        </div>
      </div>

      <BotanicalDivider className="my-8" />

      {/* Chronological Timeline of All Special Events */}
      <section aria-label="Kronologi semua tanggal spesial" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="editorial-kicker">Kronologi Dunia Kecil</p>
            <h2 className="editorial-subheading mt-1">
              Semua Hari Spesial &amp; Jadwal Tercatat
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-b border-[#38271F]/12 pb-1">
            {SOURCE_FILTER_TABS.map((tab) => {
              const active = sourceFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSourceFilter(tab.id)}
                  className={`min-h-[40px] py-1 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'text-[#A6533B] border-[#A6533B]'
                      : 'text-[#38271F]/62 border-transparent hover:text-[#38271F]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <StorybookSurface className="text-center py-8">
            <p className="font-hand text-xl text-[#38271F]/70">
              Belum ada tanggal yang tersimpan pada kategori ini.
            </p>
          </StorybookSurface>
        ) : (
          <ol className="divide-y divide-[#38271F]/12 border-y border-[#38271F]/14 bg-[#FBF6EE]/70 rounded-xl px-4 sm:px-6">
            {filteredEvents.map((ev) => {
              const inCurrentMonth = ev.monthKey === currentMonthKey;
              return (
                <li
                  key={ev.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleJumpToDate(ev.dateKey)}
                      className={`shrink-0 w-24 text-left py-1 cursor-pointer group`}
                    >
                      <span className="block font-serif text-base font-semibold text-[#38271F] group-hover:text-[#A6533B] tabular-nums">
                        {formatIndonesianDateLabel(ev.dateKey)}
                      </span>
                      <span className="block text-[11px] text-[#743D4A] tabular-nums">
                        {formatRelativeDaysLabel(ev.dateKey, todayKey)}
                      </span>
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: ev.accentColor }}
                        />
                        <span className="text-[11px] uppercase tracking-wider font-medium text-[#38271F]/62">
                          {ev.categoryLabel}
                        </span>
                        {inCurrentMonth && (
                          <span className="text-[11px] font-hand text-[#455342]">
                            · Bulan ditampilkan
                          </span>
                        )}
                      </div>
                      <h3 className="mt-0.5 font-serif text-lg font-semibold text-[#38271F]">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-[#38271F]/70">{ev.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleJumpToDate(ev.dateKey)}
                      className="min-h-[40px] px-3 rounded-lg border border-[#38271F]/16 text-xs font-medium text-[#38271F] hover:bg-[#EAE0CF] cursor-pointer"
                    >
                      Lihat Tanggal
                    </button>
                    {ev.targetSection !== 'calendar' && (
                      <button
                        type="button"
                        onClick={() => navigateTo(ev.targetSection)}
                        className="min-h-[40px] px-3 rounded-lg bg-[#38271F] text-[#F4EBDD] text-xs font-medium hover:bg-[#4e382d] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Buka</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {ev.canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomEvent(ev.id)}
                        aria-label={`Hapus ${ev.title}`}
                        className="min-w-[40px] min-h-[40px] rounded-lg text-[#A6533B] hover:bg-[#A6533B]/10 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </EditorialSectionShell>
  );
}
