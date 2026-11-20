import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  EyeOff,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  ANONYMOUS_AUTHOR_LABEL,
  DEFAULT_JAR_SETTINGS,
  getJarPaperStyleOption,
  JAR_LIMITS,
  JAR_PAPER_STYLES,
  JarCooldownState,
  JarFeatureSettings,
  JarPaperStyle,
  JarThoughtSubmission,
} from '../../data/jarOfThoughts';
import {
  approveJarThought,
  createAdminJarThought,
  deleteJarThought,
  fetchJarSettings,
  rejectJarThought,
  resetJarCooldownAdmin,
  saveJarSettings,
  subscribeJarAdminData,
} from '../../utils/jarApi';
import { summarizeJarStats, validateJarSubmissionInput } from '../../utils/jarOfThoughts';
import { formatSafeUiError } from '../../utils/safeError';

type JarSubTab = 'moderation' | 'compose';
type JarFilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'opened';

function formatShortDate(iso: string | undefined): string {
  if (!iso) return 'Baru saja';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function JarManager() {
  const [subTab, setSubTab] = useState<JarSubTab>('moderation');
  const [thoughts, setThoughts] = useState<JarThoughtSubmission[]>([]);
  const [cooldownState, setCooldownState] = useState<JarCooldownState | null>(null);
  const [settings, setSettings] = useState<JarFeatureSettings>(DEFAULT_JAR_SETTINGS);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JarFilterStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetCooldown, setConfirmResetCooldown] = useState(false);
  const [resettingCooldown, setResettingCooldown] = useState(false);

  const [savingSettings, setSavingSettings] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [listError, setListError] = useState('');

  // Manual compose form state
  const [draftInitial, setDraftInitial] = useState('Oktaf');
  const [draftMessage, setDraftMessage] = useState('');
  const [draftPaperStyle, setDraftPaperStyle] = useState<JarPaperStyle>('ivory-linen');
  const [draftAnonymous, setDraftAnonymous] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);

  useEffect(() => {
    let active = true;
    fetchJarSettings()
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch(() => {});

    const unsub = subscribeJarAdminData(
      ({ thoughts: nextThoughts, cooldownState: nextCooldown }) => {
        if (!active) return;
        setThoughts(nextThoughts);
        setCooldownState(nextCooldown);
        setListError('');
      },
      (err) => {
        if (!active) return;
        setListError(
          formatSafeUiError(err, 'Gagal memuat daftar kiriman toples.', 'admin')
        );
      }
    );

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/#/leave-a-thought';
    return `${window.location.origin}/#/leave-a-thought`;
  }, []);

  const stats = useMemo(() => summarizeJarStats(thoughts), [thoughts]);

  const filteredThoughts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return thoughts.filter((item) => {
      if (statusFilter === 'pending' && item.status !== 'pending') return false;
      if (statusFilter === 'approved' && item.status !== 'approved') return false;
      if (statusFilter === 'rejected' && item.status !== 'rejected') return false;
      if (statusFilter === 'opened' && !item.opened) return false;

      if (!q) return true;
      return (
        item.senderInitial.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q)
      );
    });
  }, [thoughts, statusFilter, searchQuery]);

  const handleCopyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2200);
    } catch {
      setStatusMsg({
        type: 'err',
        text: `Salin tautan secara manual: ${publicUrl}`,
      });
    }
  };

  const handleSaveSettings = async (next: JarFeatureSettings) => {
    setSavingSettings(true);
    setStatusMsg(null);
    try {
      const saved = await saveJarSettings(next);
      setSettings(saved);
      setStatusMsg({
        type: 'ok',
        text: saved.enabled
          ? 'Pengaturan Jar Full of Thoughts disimpan & fitur aktif.'
          : 'Pengaturan disimpan · Fitur toples dinonaktifkan sementara.',
      });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menyimpan pengaturan toples.', 'admin'),
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApprove = async (item: JarThoughtSubmission) => {
    setBusyId(item.id);
    setStatusMsg(null);
    try {
      await approveJarThought(item);
      setStatusMsg({
        type: 'ok',
        text: 'Pesan disetujui dan langsung dimasukkan ke dalam toples Wulan.',
      });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menyetujui pesan.', 'admin'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (thoughtId: string) => {
    setBusyId(thoughtId);
    setStatusMsg(null);
    try {
      await rejectJarThought(thoughtId);
      setStatusMsg({
        type: 'ok',
        text: 'Pesan ditolak dan dikeluarkan dari antrean toples.',
      });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menolak pesan.', 'admin'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (thoughtId: string) => {
    setBusyId(thoughtId);
    setStatusMsg(null);
    try {
      await deleteJarThought(thoughtId);
      setConfirmDeleteId(null);
      setStatusMsg({ type: 'ok', text: 'Pesan dihapus permanen.' });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menghapus pesan.', 'admin'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleResetCooldown = async () => {
    setResettingCooldown(true);
    setStatusMsg(null);
    try {
      await resetJarCooldownAdmin();
      setConfirmResetCooldown(false);
      setStatusMsg({
        type: 'ok',
        text: 'Cooldown 24 jam berhasil direset. Wulan dapat membuka 1 surat baru lagi.',
      });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal mereset cooldown toples.', 'admin'),
      });
    } finally {
      setResettingCooldown(false);
    }
  };

  const handleCreateManual = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const check = validateJarSubmissionInput({
      senderInitial: draftInitial,
      message: draftMessage,
      paperStyle: draftPaperStyle,
      isAnonymous: draftAnonymous,
    });
    if (!check.ok) {
      setStatusMsg({ type: 'err', text: check.error });
      return;
    }

    setCreatingNote(true);
    try {
      await createAdminJarThought(check.data);
      setDraftMessage('');
      setDraftAnonymous(false);
      setStatusMsg({
        type: 'ok',
        text: 'Pesan baru berhasil ditambahkan langsung ke toples Wulan.',
      });
      setSubTab('moderation');
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menambahkan pesan baru.', 'admin'),
      });
    } finally {
      setCreatingNote(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-jar-manager">
      {/* Top Bar: Public Link, Feature Toggle & Cooldown Utility */}
      <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-5 sm:p-6 shadow-polaroid space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest font-semibold text-[#743D4A]">
              Bab 08 · A Jar Full of Thoughts ♡
            </p>
            <h2 className="font-serif text-2xl font-semibold text-[#38271F]">
              Pengelola Toples Pesan & Moderasi Kiriman Sahabat
            </h2>
            <p className="text-xs sm:text-sm text-[#38271F]/72">
              Tinjau pesan dari link publik teman, tulis pesan kejutan langsung ke toples, atau atur masa tunggu 24 jam.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                void handleSaveSettings({ ...settings, enabled: !settings.enabled })
              }
              disabled={savingSettings}
              aria-pressed={settings.enabled}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                settings.enabled
                  ? 'bg-[#455342] text-[#F4EBDD] border-[#455342]'
                  : 'bg-[#F4EBDD] text-[#A6533B] border-[#A6533B]/35'
              }`}
            >
              {settings.enabled ? 'Status Fitur: Aktif' : 'Status Fitur: Nonaktif'}
            </button>

            {!confirmResetCooldown ? (
              <button
                type="button"
                onClick={() => setConfirmResetCooldown(true)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#38271F]/18 bg-[#F4EBDD] text-xs font-semibold text-[#38271F] hover:bg-[#EAE0CF] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#A6533B]" />
                <span>Reset Cooldown</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl border border-[#A6533B]/35 bg-[#A6533B]/10 px-2.5 py-1">
                <span className="text-[11px] font-medium text-[#A6533B]">Reset 24j?</span>
                <button
                  type="button"
                  onClick={() => void handleResetCooldown()}
                  disabled={resettingCooldown}
                  className="px-2.5 py-1 rounded-lg bg-[#A6533B] text-[#FBF6EE] text-[11px] font-semibold cursor-pointer"
                >
                  {resettingCooldown ? '...' : 'Ya'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetCooldown(false)}
                  className="px-2 py-1 text-[11px] font-medium text-[#38271F]/70 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Shareable Public Link Row */}
        <div className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/65 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#743D4A]">
              Tautan Publik Untuk Teman (Tanpa Password)
            </p>
            <p className="font-mono text-xs sm:text-sm text-[#38271F] truncate select-all">
              {publicUrl}
            </p>
          </div>
          <button
            type="button"
            data-testid="copy-jar-public-url-btn"
            onClick={() => void handleCopyPublicUrl()}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#4e382d] cursor-pointer shrink-0 whitespace-nowrap"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#E8BFC5]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'Tersalin!' : 'Salin Link Teman'}</span>
          </button>
        </div>

        {/* Metrics Strip (Zero Pills, Clean Hairline Grid, Tabular Nums) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { label: 'Total Kiriman', value: stats.total, tone: 'text-[#38271F]' },
            { label: 'Menunggu', value: stats.pending, tone: 'text-[#A6533B]' },
            { label: 'Disetujui', value: stats.approved, tone: 'text-[#455342]' },
            { label: 'Ditolak', value: stats.rejected, tone: 'text-[#743D4A]' },
            { label: 'Sudah Dibuka', value: stats.opened, tone: 'text-[#38271F]' },
            { label: 'Siap di Toples', value: stats.availableInPool, tone: 'text-[#455342]' },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/45 px-3 py-2.5"
            >
              <p className="text-[11px] text-[#38271F]/65">{metric.label}</p>
              <p className={`mt-0.5 font-serif text-xl font-semibold tabular-nums ${metric.tone}`}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {cooldownState?.lastOpenedAt && (
          <p className="text-xs text-[#38271F]/68 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#A6533B]" />
            <span>
              Pembukaan terakhir Wulan: {formatShortDate(cooldownState.lastOpenedAt)} · Total pernah dibuka: {cooldownState.totalOpenedCount}
            </span>
          </p>
        )}

        {/* Intro Text Copy Editor */}
        <details className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/40 px-4 py-3">
          <summary className="text-xs font-semibold text-[#38271F] cursor-pointer select-none">
            Sunting Judul & Deskripsi Pembuka Halaman Wulan
          </summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[11px] font-semibold text-[#38271F]/75">
                  Judul Halaman
                </label>
                <input
                  type="text"
                  value={settings.introTitle}
                  onChange={(e) => setSettings({ ...settings, introTitle: e.target.value })}
                  className="w-full min-h-[40px] px-3 rounded-lg border border-[#38271F]/16 bg-[#FBF6EE] text-sm"
                />
              </div>
              <div className="sm:col-span-7 space-y-1">
                <label className="text-[11px] font-semibold text-[#38271F]/75">
                  Subjudul Pengantar
                </label>
                <input
                  type="text"
                  value={settings.introSubtitle}
                  onChange={(e) => setSettings({ ...settings, introSubtitle: e.target.value })}
                  className="w-full min-h-[40px] px-3 rounded-lg border border-[#38271F]/16 bg-[#FBF6EE] text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveSettings(settings)}
              disabled={savingSettings}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#38271F] text-[#F4EBDD] text-xs font-semibold hover:bg-[#4e382d] cursor-pointer"
            >
              {savingSettings ? 'Menyimpan...' : 'Simpan Teks Pengantar'}
            </button>
          </div>
        </details>

        {statusMsg && (
          <p
            role="status"
            className={`rounded-xl px-3.5 py-2.5 text-xs font-medium ${
              statusMsg.type === 'ok'
                ? 'bg-[#455342]/12 text-[#455342]'
                : 'bg-[#A6533B]/12 text-[#A6533B]'
            }`}
          >
            {statusMsg.text}
          </p>
        )}

        {listError && (
          <p role="alert" className="rounded-xl bg-[#A6533B]/12 px-3.5 py-2.5 text-xs text-[#A6533B]">
            {listError}
          </p>
        )}
      </section>

      {/* Sub-Navigation Tabs: Moderation Queue vs Manual Compose */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSubTab('moderation')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
            subTab === 'moderation'
              ? 'bg-[#38271F] text-[#F4EBDD]'
              : 'bg-[#FBF6EE] border border-[#38271F]/14 text-[#38271F]/80 hover:bg-[#EAE0CF]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Moderasi Kiriman ({thoughts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('compose')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
            subTab === 'compose'
              ? 'bg-[#38271F] text-[#F4EBDD]'
              : 'bg-[#FBF6EE] border border-[#38271F]/14 text-[#38271F]/80 hover:bg-[#EAE0CF]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tulis Pesan Baru</span>
        </button>
      </div>

      {/* TAB 1: MODERATION QUEUE */}
      {subTab === 'moderation' && (
        <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-5 sm:p-6 shadow-polaroid space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#38271F]/45 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari inisial pengirim atau isi pesan..."
                className="w-full min-h-[42px] pl-9 pr-3.5 py-2 rounded-xl border border-[#38271F]/16 bg-[#F4EBDD]/50 text-xs sm:text-sm text-[#38271F] focus:outline-none focus:ring-2 focus:ring-[#A6533B]/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#F4EBDD] border border-[#38271F]/12">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'pending', label: 'Menunggu' },
                  { id: 'approved', label: 'Disetujui' },
                  { id: 'rejected', label: 'Ditolak' },
                  { id: 'opened', label: 'Sudah Dibuka' },
                ] as { id: JarFilterStatus; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusFilter(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    statusFilter === item.id
                      ? 'bg-[#38271F] text-[#F4EBDD]'
                      : 'text-[#38271F]/72 hover:text-[#38271F]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {filteredThoughts.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#38271F]/65">
              Belum ada kiriman pesan yang cocok dengan filter ini.
            </div>
          ) : (
            <div className="divide-y divide-[#38271F]/10">
              {filteredThoughts.map((item) => {
                const style = getJarPaperStyleOption(item.paperStyle);
                const isBusy = busyId === item.id;
                return (
                  <article key={item.id} className="py-4 first:pt-1 last:pb-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        {/* Unboxed Typographic Metadata Row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#38271F]/65">
                          <span
                            className={`font-semibold ${
                              item.status === 'approved'
                                ? 'text-[#455342]'
                                : item.status === 'rejected'
                                  ? 'text-[#743D4A]'
                                  : 'text-[#A6533B]'
                            }`}
                          >
                            {item.status === 'approved'
                              ? 'Disetujui'
                              : item.status === 'rejected'
                                ? 'Ditolak'
                                : 'Menunggu Moderasi'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.source === 'admin' ? 'Buatan Admin' : 'Kiriman Publik'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{style.label}</span>
                          {item.opened && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#455342] font-medium">
                                Sudah dibuka ({formatShortDate(item.openedAt)})
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{formatShortDate(item.createdAt)}</span>
                        </div>

                        <p className="text-xs font-medium text-[#38271F]">
                          {item.isAnonymous ? (
                            <>
                              Tampil ke Wulan:{' '}
                              <span className="font-semibold text-[#743D4A]">
                                {ANONYMOUS_AUTHOR_LABEL}
                              </span>{' '}
                              <span className="text-[#38271F]/65">
                                (Inisial asli untuk admin: {item.senderInitial})
                              </span>
                            </>
                          ) : (
                            <>
                              Pengirim:{' '}
                              <span className="font-semibold text-[#743D4A]">
                                {item.senderInitial}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {item.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => void handleApprove(item)}
                            disabled={isBusy}
                            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#384435] cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                        )}

                        {item.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => void handleReject(item.id)}
                            disabled={isBusy}
                            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#743D4A]/30 bg-[#FBF6EE] text-[#743D4A] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#FAF0F2] cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        )}

                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id)}
                              disabled={isBusy}
                              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#A6533B] text-[#FBF6EE] text-xs font-semibold cursor-pointer"
                            >
                              Konfirmasi Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-[38px] px-2.5 py-1.5 text-xs text-[#38271F]/70 cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            aria-label={`Hapus pesan dari ${item.senderInitial}`}
                            className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[#38271F]/16 text-[#38271F]/65 hover:text-[#A6533B] hover:border-[#A6533B]/35 inline-flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div
                      className="rounded-lg border p-3.5 text-sm leading-relaxed whitespace-pre-line"
                      style={{
                        backgroundColor: style.paperBg,
                        borderColor: style.borderColor,
                        color: style.inkColor,
                      }}
                    >
                      {item.message}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: MANUAL ADMIN COMPOSER */}
      {subTab === 'compose' && (
        <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-5 sm:p-6 shadow-polaroid">
          <form onSubmit={handleCreateManual} className="space-y-5 max-w-2xl">
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-semibold text-[#38271F]">
                Tambah Surat Langsung ke Toples
              </h3>
              <p className="text-xs text-[#38271F]/70">
                Pesan yang ditulis dari Control Room akan otomatis disetujui dan langsung siap diundi oleh Wulan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              <div className="sm:col-span-6 space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <label className="font-semibold text-[#38271F]">
                    Inisial / Nama Pengirim
                  </label>
                  <span className="text-[#38271F]/55 tabular-nums">
                    {draftInitial.length}/{JAR_LIMITS.SENDER_INITIAL_MAX}
                  </span>
                </div>
                <input
                  type="text"
                  value={draftInitial}
                  onChange={(e) =>
                    setDraftInitial(e.target.value.slice(0, JAR_LIMITS.SENDER_INITIAL_MAX))
                  }
                  maxLength={JAR_LIMITS.SENDER_INITIAL_MAX}
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-[#38271F]/16 bg-[#F4EBDD]/50 text-sm"
                />
              </div>

              <div className="sm:col-span-6 sm:pt-6">
                <label className="flex items-center gap-2 min-h-[42px] px-3 rounded-lg border border-[#38271F]/14 bg-[#F4EBDD]/50 text-xs font-medium text-[#38271F] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftAnonymous}
                    onChange={(e) => setDraftAnonymous(e.target.checked)}
                    className="w-4 h-4 accent-[#743D4A]"
                  />
                  <EyeOff className="w-3.5 h-3.5 text-[#743D4A]" />
                  <span>Tampilkan sebagai “Someone Special”</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#38271F]">Gaya Kertas</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {JAR_PAPER_STYLES.map((style) => {
                  const active = draftPaperStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setDraftPaperStyle(style.id)}
                      aria-pressed={active}
                      className={`p-2.5 rounded-lg border text-left text-[11px] font-semibold cursor-pointer ${
                        active ? 'ring-2 ring-[#38271F]/70' : ''
                      }`}
                      style={{
                        backgroundColor: style.paperBg,
                        borderColor: active ? style.accentColor : style.borderColor,
                        color: style.inkColor,
                      }}
                    >
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between text-xs">
                <label className="font-semibold text-[#38271F]">Isi Pesan (Maks 500 karakter)</label>
                <span className="text-[#38271F]/55 tabular-nums">
                  {draftMessage.length}/{JAR_LIMITS.MESSAGE_MAX}
                </span>
              </div>
              <textarea
                value={draftMessage}
                onChange={(e) =>
                  setDraftMessage(e.target.value.slice(0, JAR_LIMITS.MESSAGE_MAX))
                }
                rows={4}
                maxLength={JAR_LIMITS.MESSAGE_MAX}
                placeholder="Tulis pesan manis untuk dimasukkan ke dalam toples Wulan..."
                className="w-full p-3.5 rounded-xl border border-[#38271F]/16 bg-[#F4EBDD]/40 text-sm leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={creatingNote}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#4e382d] cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 text-[#E8BFC5]" />
              <span>{creatingNote ? 'Menyimpan...' : 'Masukkan ke Toples Sekarang'}</span>
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
