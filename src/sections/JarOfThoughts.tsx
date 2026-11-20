import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Heart,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DEFAULT_JAR_SETTINGS,
  getJarPaperStyleOption,
  JarPoolThought,
} from '../data/jarOfThoughts';
import { useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';
import {
  fetchWulanJarSnapshot,
  revealDailyJarThought,
  WulanJarSnapshot,
} from '../utils/jarApi';
import {
  computeCooldownStatus,
  JarCooldownStatus,
} from '../utils/jarOfThoughts';
import { formatSafeUiError } from '../utils/safeError';
import {
  JarAnimationPhase,
  JarSlipPreview,
  MagicGlassJar,
  playJarRevealChime,
} from '../components/jar/MagicGlassJar';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}

function formatOpenedDate(iso: string | undefined): string {
  if (!iso) return 'Baru saja dibuka';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Tersimpan';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function JarOfThoughts() {
  const navigateTo = useStore((s) => s.navigateTo);
  const reducedMotion = usePrefersReducedMotion();

  const [snapshot, setSnapshot] = useState<WulanJarSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sound FX is strictly OFF by default per user instructions
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [phase, setPhase] = useState<JarAnimationPhase>('idle');
  const [revealing, setRevealing] = useState(false);
  const [revealedThought, setRevealedThought] = useState<JarPoolThought | null>(null);
  const [inspectedKeepsake, setInspectedKeepsake] = useState<JarPoolThought | null>(null);

  // Server-anchored monotonic clock offset: serverTimeMs - Date.now()
  const serverClockOffsetRef = useRef<number>(0);
  const [tickNowMs, setTickNowMs] = useState<number>(() => Date.now());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadSnapshot = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg('');

    try {
      const next = await fetchWulanJarSnapshot();
      if (!mountedRef.current) return;
      serverClockOffsetRef.current = next.serverNowMs - Date.now();
      setTickNowMs(next.serverNowMs);
      setSnapshot(next);

      if (next.cooldownStatus.isCoolingDown) {
        setPhase('cooldown');
      } else if (next.unopenedCount === 0) {
        setPhase('empty');
      } else {
        setPhase('idle');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setErrorMsg(
        formatSafeUiError(err, 'Gagal memuat isi toples pesan saat ini.', 'public')
      );
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadSnapshot(false);
  }, [loadSnapshot]);

  const liveCooldownStatus: JarCooldownStatus = useMemo(() => {
    const lastMs = snapshot?.cooldownState?.lastOpenedAtMs ?? null;
    const hours = snapshot?.settings.cooldownHours ?? 24;
    return computeCooldownStatus(lastMs, tickNowMs, hours);
  }, [snapshot, tickNowMs]);

  useEffect(() => {
    if (!liveCooldownStatus.isCoolingDown) return;
    const timer = window.setInterval(() => {
      const trustedNow = Date.now() + serverClockOffsetRef.current;
      setTickNowMs(trustedNow);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [liveCooldownStatus.isCoolingDown]);

  // Automatically transition out of cooldown UI when timer hits zero
  useEffect(() => {
    if (phase === 'cooldown' && !liveCooldownStatus.isCoolingDown && snapshot) {
      setPhase(snapshot.unopenedCount > 0 ? 'idle' : 'empty');
    }
  }, [phase, liveCooldownStatus.isCoolingDown, snapshot]);

  const handleOpenThought = async () => {
    if (revealing || liveCooldownStatus.isCoolingDown) return;
    if (!snapshot?.settings.enabled) return;
    if ((snapshot?.unopenedCount ?? 0) === 0) {
      setPhase('empty');
      return;
    }

    setErrorMsg('');
    setRevealing(true);
    setInspectedKeepsake(null);

    if (!reducedMotion) {
      setPhase('shaking');
      await new Promise((r) => window.setTimeout(r, 420));
      if (!mountedRef.current) return;
      setPhase('opening');
      await new Promise((r) => window.setTimeout(r, 320));
      if (!mountedRef.current) return;
    } else {
      setPhase('opening');
    }

    const result = await revealDailyJarThought();
    if (!mountedRef.current) return;

    if (result.status === 'revealed') {
      if (!reducedMotion) {
        setPhase('floating');
        await new Promise((r) => window.setTimeout(r, 680));
        if (!mountedRef.current) return;
      }

      if (soundEnabled) {
        playJarRevealChime();
      }

      serverClockOffsetRef.current = result.serverNowMs - Date.now();
      setTickNowMs(result.serverNowMs);
      setRevealedThought(result.thought);
      setPhase('revealed');

      // Refresh snapshot quietly so keepsake list & cooldown state stay synchronized
      const refreshed = await fetchWulanJarSnapshot().catch(() => null);
      if (mountedRef.current && refreshed) {
        serverClockOffsetRef.current = refreshed.serverNowMs - Date.now();
        setSnapshot(refreshed);
      }
      setRevealing(false);
      return;
    }

    if (result.status === 'cooldown') {
      setErrorMsg('');
      setPhase('cooldown');
      await loadSnapshot(true);
    } else if (result.status === 'empty') {
      setPhase('empty');
      setErrorMsg(result.message);
    } else {
      setPhase(snapshot.unopenedCount > 0 ? 'idle' : 'empty');
      setErrorMsg(result.message);
    }
    setRevealing(false);
  };

  const handleDismissRevealed = () => {
    setRevealedThought(null);
    if (liveCooldownStatus.isCoolingDown) {
      setPhase('cooldown');
    } else if ((snapshot?.unopenedCount ?? 0) === 0) {
      setPhase('empty');
    } else {
      setPhase('idle');
    }
  };

  const jarSlips: JarSlipPreview[] = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.pool
      .filter((item) => !item.opened)
      .map((item) => ({
        id: item.id,
        paperStyle: item.paperStyle,
        sortSeed: item.sortSeed,
      }));
  }, [snapshot]);

  const settings = snapshot?.settings ?? DEFAULT_JAR_SETTINGS;
  const activeStyle = getJarPaperStyleOption(revealedThought?.paperStyle);
  const inspectedStyle = getJarPaperStyleOption(inspectedKeepsake?.paperStyle);
  const keptThoughts = snapshot?.openedKeepsakes ?? [];

  return (
    <main
      data-testid="jar-of-thoughts-page"
      className="paper-canvas min-h-full w-full px-4 sm:px-8 pt-4 sm:pt-6 pb-40 md:pb-24"
    >
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
        <div>
          <button
            type="button"
            onClick={() => navigateTo('hub')}
            className="min-h-[38px] -ml-1.5 px-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#6E5F63] hover:text-[#552E3D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>

        {/* Chapter Header */}
        <header className="paper-sheet p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div className="space-y-1 max-w-2xl">
            <p className="editorial-kicker">
              08 · Satu Surat Setiap {settings.cooldownHours} Jam
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#30272A] tracking-tight">
              {settings.introTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E5F63] leading-relaxed">
              {settings.introSubtitle}
            </p>
          </div>

          {/* Utility Controls: Optional Sound Toggle & Refresh */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Matikan suara lonceng lembut' : 'Nyalakan suara lonceng lembut'}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#30272A]/16 bg-[#F8F1E8]/85 text-xs font-medium text-[#30272A] hover:bg-[#EFE4D6] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#A95F70]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-[#6E5F63]" />
              )}
              <span>{soundEnabled ? 'Suara Nyala' : 'Suara Mati'}</span>
            </button>

            <button
              type="button"
              onClick={() => void loadSnapshot(true)}
              disabled={refreshing}
              aria-label="Segarkan isi toples"
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#30272A]/16 bg-[#FFFDFC] text-xs font-medium text-[#30272A] hover:bg-[#F8F1E8] inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </header>

        {/* Main 2-Column Interactive Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Interactive Glass Jar & Daily Reveal Stage */}
          <section
            aria-label="Toples Kaca Interaktif"
            className="lg:col-span-7 paper-sheet p-4 sm:p-6 flex flex-col items-center text-center gap-4"
          >
            {loading ? (
              <div className="py-12 space-y-2.5 text-sm text-[#6E5F63]">
                <p className="font-serif text-lg text-[#30272A]">Menyiapkan toples kacamu...</p>
                <p className="text-xs">Menyinkronkan catatan dan waktu server dengan aman.</p>
              </div>
            ) : !settings.enabled ? (
              <div className="py-10 max-w-md space-y-2.5">
                <p className="font-serif text-2xl font-semibold text-[#30272A]">
                  Toples Sedang Beristirahat
                </p>
                <p className="text-sm text-[#6E5F63] leading-relaxed">
                  Bagian ini sedang diistirahatkan sementara waktu. Coba kembali lagi nanti ya ♡
                </p>
              </div>
            ) : snapshot?.permissionDenied ? (
              <div className="py-3 sm:py-4 max-w-md space-y-3">
                <MagicGlassJar
                  slips={[]}
                  phase="empty"
                  reducedMotion={reducedMotion}
                />
                <div className="space-y-1">
                  <p className="font-serif text-lg sm:text-xl font-semibold text-[#30272A]">
                    Toples Sedang Disiapkan Sebentar
                  </p>
                  <p className="text-xs sm:text-sm text-[#6E5F63] leading-relaxed">
                    Catatan di dalam toples sedang disinkronkan. Coba klik segarkan sebentar lagi ya ♡
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Glass Jar Visual Centerpiece */}
                <MagicGlassJar
                  slips={jarSlips}
                  phase={phase}
                  activePaperStyle={revealedThought?.paperStyle}
                  reducedMotion={reducedMotion}
                />

                {/* Unboxed quiet status line */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#6E5F63] tabular-nums">
                  <span>{snapshot?.unopenedCount ?? 0} surat menunggu dibuka</span>
                  <span aria-hidden="true">·</span>
                  <span>{keptThoughts.length} sudah disimpan</span>
                </div>

                {/* Unfolded Note Reveal Card OR Action/Cooldown UI */}
                <AnimatePresence>
                  {revealedThought ? (
                    <motion.article
                      key={revealedThought.id}
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                      data-testid="jar-revealed-card"
                      className="w-full max-w-lg rounded-2xl p-6 sm:p-7 text-left shadow-polaroid space-y-4 border"
                      style={{
                        backgroundColor: activeStyle.paperBg,
                        borderColor: activeStyle.borderColor,
                        color: activeStyle.inkColor,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#30272A]/12 text-xs">
                        <span
                          className="font-medium uppercase tracking-wider"
                          style={{ color: activeStyle.accentColor }}
                        >
                          Surat Hari Ini ♡
                        </span>
                        <span className="text-[#6E5F63]">
                          {activeStyle.label}
                        </span>
                      </div>

                      <p className="font-serif text-base sm:text-lg leading-relaxed whitespace-pre-line">
                        “{revealedThought.message}”
                      </p>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#30272A]/10">
                        <p className="font-hand text-xl text-[#552E3D]">
                          — Dari: {revealedThought.displayAuthor}
                        </p>
                        <button
                          type="button"
                          onClick={handleDismissRevealed}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-xs font-medium hover:bg-[#3f202c] transition-colors cursor-pointer"
                        >
                          Simpan ke Arsip
                        </button>
                      </div>
                    </motion.article>
                  ) : liveCooldownStatus.isCoolingDown ? (
                    <motion.div
                      key="cooldown-panel"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      data-testid="jar-cooldown-panel"
                      className="w-full max-w-md rounded-2xl border border-[#C9A879]/42 bg-[#F8F1E8]/80 p-5 space-y-3"
                    >
                      <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-[#552E3D]">
                        <Clock className="w-3.5 h-3.5 text-[#A95F70]" />
                        <span>Menunggu Siklus Berikutnya</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-serif text-lg sm:text-xl font-semibold text-[#30272A]">
                          A little thought has already been opened today.
                        </p>
                        <p className="text-sm text-[#6E5F63]">
                          Come back when another 24 hours have passed. ♡
                        </p>
                      </div>
                      <div className="pt-1">
                        <p
                          aria-live="polite"
                          className="font-mono text-2xl sm:text-3xl font-semibold tracking-wider text-[#A95F70] tabular-nums"
                        >
                          {liveCooldownStatus.formattedCountdown}
                        </p>
                        <p className="text-[11px] text-[#6E5F63] mt-0.5">
                          Waktu dihitung dari jam server agar tetap adil
                        </p>
                      </div>
                    </motion.div>
                  ) : (snapshot?.unopenedCount ?? 0) === 0 ? (
                    <motion.div
                      key="empty-pool-panel"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full max-w-md rounded-2xl border border-[#30272A]/12 bg-[#F8F1E8]/75 p-5 space-y-2"
                    >
                      <p className="font-serif text-lg font-semibold text-[#30272A]">
                        Toples Masih Menunggu Surat Baru
                      </p>
                      <p className="text-sm text-[#6E5F63] leading-relaxed">
                        Belum ada surat baru yang belum dibuka saat ini. Jatah buka harianmu tetap aman dan belum terpakai. ♡
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ready-action"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <button
                        type="button"
                        data-testid="jar-open-thought-btn"
                        onClick={() => void handleOpenThought()}
                        disabled={revealing}
                        className="min-h-[48px] px-7 py-3 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-sm font-medium hover:bg-[#3f202c] active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 shadow-polaroid cursor-pointer disabled:opacity-65"
                      >
                        <Sparkles className="w-4 h-4 text-[#EBC9CB]" />
                        <span>{revealing ? 'Mengambil Satu Surat...' : 'Open a Thought ♡'}</span>
                      </button>
                      <p className="text-xs text-[#6E5F63]">
                        Setiap pembukaan mengambil 1 pesan secara acak dan mengunci toples selama {settings.cooldownHours} jam.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {errorMsg && (
                  <p role="alert" className="text-xs text-[#A95F70] max-w-md pt-1">
                    {errorMsg}
                  </p>
                )}
              </>
            )}
          </section>

          {/* RIGHT: Opened Keepsakes Archive */}
          <aside
            aria-label="Arsip Surat yang Sudah Dibuka"
            className="lg:col-span-5 paper-sheet p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[#30272A]/12">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#552E3D]">
                  Keepsakes
                </p>
                <h2 className="font-serif text-xl font-semibold text-[#30272A]">
                  Surat yang Sudah Terbuka
                </h2>
              </div>
              <span className="text-xs text-[#6E5F63] tabular-nums">
                {keptThoughts.length} surat
              </span>
            </div>

            {keptThoughts.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <BookOpen className="w-6 h-6 text-[#C9A879] mx-auto opacity-85" />
                <p className="text-sm text-[#6E5F63] leading-relaxed">
                  Belum ada surat yang dibuka dari toples ini. Surat pertama yang kamu buka akan tersimpan rapi di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrapbook-scroll">
                {keptThoughts.map((item) => {
                  const style = getJarPaperStyleOption(item.paperStyle);
                  const isSelected = inspectedKeepsake?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setInspectedKeepsake(isSelected ? null : item)
                      }
                      className="w-full text-left rounded-xl border p-3.5 transition-all hover:shadow-sm cursor-pointer space-y-1.5"
                      style={{
                        backgroundColor: style.paperBg,
                        borderColor: isSelected ? style.accentColor : style.borderColor,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#6E5F63]">
                        <span className="font-medium text-[#552E3D]">
                          Dari: {item.displayAuthor}
                        </span>
                        <span>{formatOpenedDate(item.openedAt)}</span>
                      </div>
                      <p
                        className={`text-sm text-[#30272A] leading-relaxed ${
                          isSelected ? 'whitespace-pre-line' : 'line-clamp-2'
                        }`}
                      >
                        {item.message}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {inspectedKeepsake && (
              <div
                className="rounded-xl border p-4 space-y-2"
                style={{
                  backgroundColor: inspectedStyle.paperBg,
                  borderColor: inspectedStyle.borderColor,
                }}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-[#552E3D]">
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-[#EBC9CB]" />
                    <span>Dari: {inspectedKeepsake.displayAuthor}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectedKeepsake(null)}
                    className="text-[#6E5F63] hover:text-[#30272A] underline cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
                <p className="font-serif text-sm text-[#30272A] leading-relaxed whitespace-pre-line">
                  {inspectedKeepsake.message}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
