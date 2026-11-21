import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Filter,
  Flower2,
  Mic,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  ANONYMOUS_AUTHOR_LABEL,
  getJarPaperStyleOption,
} from '../../data/jarOfThoughts';
import { VOICE_FLOWER_OPTIONS } from '../../data/voices';
import { approveJarThought, rejectJarThought } from '../../utils/jarApi';
import { formatAudioTime } from '../../utils/adminContent';
import { formatSafeUiError } from '../../utils/safeError';
import {
  approveUnifiedBundleAdmin,
  approveVoiceSubmissionAdmin,
  deleteUnifiedBundleAdmin,
  rejectUnifiedBundleAdmin,
  rejectVoiceSubmissionAdmin,
  subscribeUnifiedContributions,
  UnifiedContributionBundle,
} from '../../utils/unifiedContributionApi';
import { VoiceBouquetDisplay } from '../voices/VoiceBouquetDisplay';

type ContributionFilter = 'all' | 'pending' | 'approved' | 'flagged' | 'rejected';

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

function getStatusBadge(status: 'pending' | 'approved' | 'rejected' | undefined) {
  if (status === 'approved') {
    return {
      label: 'Disetujui',
      className: 'bg-[#455342]/12 text-[#455342] border border-[#455342]/20',
    };
  }
  if (status === 'rejected') {
    return {
      label: 'Ditolak',
      className: 'bg-[#A6533B]/12 text-[#A6533B] border border-[#A6533B]/20',
    };
  }
  return {
    label: 'Menunggu Tinjauan',
    className: 'bg-[#C4A574]/20 text-[#38271F] border border-[#C4A574]/35',
  };
}

export function ContributionsManager() {
  const [bundles, setBundles] = useState<UnifiedContributionBundle[]>([]);
  const [filter, setFilter] = useState<ContributionFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [listError, setListError] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    const unsub = subscribeUnifiedContributions(
      (next) => {
        if (!active) return;
        setBundles(next);
        setListError('');
      },
      (err) => {
        if (!active) return;
        setListError(
          formatSafeUiError(err, 'Gagal memuat daftar kontribusi terpadu.', 'admin')
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

  const summary = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let flagged = 0;
    let rejected = 0;

    for (const item of bundles) {
      const jarStatus = item.jarThought?.status;
      const voiceStatus = item.voiceSubmission?.status;
      if (jarStatus === 'pending' || voiceStatus === 'pending') pending += 1;
      if (jarStatus === 'approved' && voiceStatus === 'approved') approved += 1;
      if (jarStatus === 'rejected' && voiceStatus === 'rejected') rejected += 1;
      if (
        item.batch.screeningStatus === 'flagged' ||
        item.jarThought?.screeningStatus === 'flagged' ||
        item.voiceSubmission?.screeningStatus === 'flagged'
      ) {
        flagged += 1;
      }
    }

    return {
      total: bundles.length,
      pending,
      approved,
      flagged,
      rejected,
    };
  }, [bundles]);

  const filteredBundles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bundles.filter((item) => {
      const jarStatus = item.jarThought?.status;
      const voiceStatus = item.voiceSubmission?.status;
      const isFlagged =
        item.batch.screeningStatus === 'flagged' ||
        item.jarThought?.screeningStatus === 'flagged' ||
        item.voiceSubmission?.screeningStatus === 'flagged';

      if (filter === 'pending' && jarStatus !== 'pending' && voiceStatus !== 'pending') {
        return false;
      }
      if (filter === 'approved' && (jarStatus !== 'approved' || voiceStatus !== 'approved')) {
        return false;
      }
      if (filter === 'rejected' && (jarStatus !== 'rejected' || voiceStatus !== 'rejected')) {
        return false;
      }
      if (filter === 'flagged' && !isFlagged) {
        return false;
      }

      if (!q) return true;
      return (
        item.batch.contributorLabel.toLowerCase().includes(q) ||
        (item.jarThought?.message || '').toLowerCase().includes(q) ||
        (item.jarThought?.senderInitial || '').toLowerCase().includes(q) ||
        (item.voiceSubmission?.senderName || '').toLowerCase().includes(q) ||
        (item.voiceSubmission?.caption || '').toLowerCase().includes(q)
      );
    });
  }, [bundles, filter, searchQuery]);

  const handleCopyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setStatusMsg({ type: 'err', text: `Salin tautan secara manual: ${publicUrl}` });
    }
  };

  const runAction = async (key: string, fn: () => Promise<unknown>, okText: string) => {
    setBusyKey(key);
    setStatusMsg(null);
    try {
      await fn();
      setStatusMsg({ type: 'ok', text: okText });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal memproses tindakan moderasi.', 'admin'),
      });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-5" data-testid="admin-contributions-manager">
      {/* Header & Summary */}
      <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#38271F]">
              Moderasi Kontribusi Terpadu (Toples & Voices of Love)
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5 leading-relaxed">
              Setiap kiriman dari <strong className="font-semibold">/leave-a-thought</strong> masuk
              berpasangan dengan ID terhubung. Tidak ada pesan atau suara yang tampil ke publik sebelum
              kamu setujui di sini.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyPublicUrl}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#38271F]/20 bg-[#F4EBDD] text-xs font-semibold text-[#38271F] inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer shrink-0"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#455342]" />
                <span>Link Kontribusi Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#A6533B]" />
                <span>Salin Link Form Teman</span>
              </>
            )}
          </button>
        </div>

        {/* Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/60 px-3 py-2.5">
            <p className="text-[11px] text-[#38271F]/65">Total Paket Kiriman</p>
            <p className="font-serif text-xl font-semibold text-[#38271F] tabular-nums">
              {summary.total}
            </p>
          </div>
          <div className="rounded-xl border border-[#C4A574]/35 bg-[#C4A574]/12 px-3 py-2.5">
            <p className="text-[11px] text-[#38271F]/75">Menunggu Tinjauan</p>
            <p className="font-serif text-xl font-semibold text-[#A6533B] tabular-nums">
              {summary.pending}
            </p>
          </div>
          <div className="rounded-xl border border-[#455342]/20 bg-[#455342]/8 px-3 py-2.5">
            <p className="text-[11px] text-[#455342]">Keduanya Disetujui</p>
            <p className="font-serif text-xl font-semibold text-[#455342] tabular-nums">
              {summary.approved}
            </p>
          </div>
          <div className="rounded-xl border border-[#A6533B]/25 bg-[#A6533B]/8 px-3 py-2.5">
            <p className="text-[11px] text-[#A6533B]">Catatan Screening</p>
            <p className="font-serif text-xl font-semibold text-[#A6533B] tabular-nums">
              {summary.flagged}
            </p>
          </div>
        </div>

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
          <p role="alert" className="rounded-xl px-3.5 py-2.5 text-xs font-medium bg-[#A6533B]/12 text-[#A6533B]">
            {listError}
          </p>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter status kontribusi">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#38271F]/65 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </span>
            {(
              [
                { id: 'all', label: `Semua (${bundles.length})` },
                { id: 'pending', label: `Menunggu (${summary.pending})` },
                { id: 'approved', label: `Disetujui (${summary.approved})` },
                { id: 'flagged', label: `Screening (${summary.flagged})` },
                { id: 'rejected', label: `Ditolak (${summary.rejected})` },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  filter === opt.id
                    ? 'bg-[#38271F] text-[#F4EBDD]'
                    : 'bg-[#F4EBDD] text-[#38271F]/80 border border-[#38271F]/14 hover:bg-[#EAE0CF]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#38271F]/45 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pengirim atau pesan..."
              className="w-full min-h-[38px] rounded-xl border border-[#38271F]/16 bg-[#F4EBDD]/70 pl-8 pr-3 text-xs text-[#38271F]"
            />
          </label>
        </div>
      </section>

      {/* Bundle Cards List */}
      {filteredBundles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#38271F]/20 bg-[#FBF6EE] p-8 text-center space-y-2">
          <p className="font-serif text-lg text-[#38271F]">
            Belum ada kontribusi yang cocok dengan filter ini
          </p>
          <p className="text-xs text-[#38271F]/65 max-w-md mx-auto">
            Saat teman mengirim pesan + suara dan menyetujui consent “YA” di halaman{' '}
            <code className="font-mono">/#/leave-a-thought</code>, paket kiriman terhubung akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBundles.map((bundle) => {
            const { batch, jarThought, voiceSubmission } = bundle;
            const jarBadge = getStatusBadge(jarThought?.status);
            const voiceBadge = getStatusBadge(voiceSubmission?.status);
            const paperOpt = getJarPaperStyleOption(jarThought?.paperStyle);
            const flowerMeta = voiceSubmission
              ? VOICE_FLOWER_OPTIONS.find((f) => f.id === voiceSubmission.flowerType) ??
                VOICE_FLOWER_OPTIONS[0]
              : null;

            const combinedFlags = Array.from(
              new Set([
                ...(batch.screeningFlags || []),
                ...(jarThought?.screeningFlags || []),
                ...(voiceSubmission?.screeningFlags || []),
              ])
            );
            const isFlagged =
              batch.screeningStatus === 'flagged' ||
              jarThought?.screeningStatus === 'flagged' ||
              voiceSubmission?.screeningStatus === 'flagged' ||
              combinedFlags.length > 0;

            const isBatchBusy = busyKey?.startsWith(`${batch.id}:`) || false;

            return (
              <article
                key={batch.id}
                data-testid={`contribution-bundle-${batch.id}`}
                className="rounded-2xl border border-[#38271F]/16 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4"
              >
                {/* Bundle Top Meta Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-lg font-semibold text-[#38271F]">
                        {batch.contributorLabel || voiceSubmission?.senderName || 'Pengirim'}
                      </h3>
                      {isFlagged ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#A6533B]/12 border border-[#A6533B]/25 px-2 py-0.5 text-[11px] font-semibold text-[#A6533B]">
                          <ShieldAlert className="w-3 h-3" />
                          Perlu Perhatian
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#455342]/10 border border-[#455342]/20 px-2 py-0.5 text-[11px] font-semibold text-[#455342]">
                          <ShieldCheck className="w-3 h-3" />
                          Screening Bersih
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#38271F]/60">
                      Dikirim {formatShortDate(batch.createdAt)} · Persetujuan Publik:{' '}
                      <strong className="font-semibold text-[#455342]">
                        {batch.consentConfirmed ? 'YA' : 'Tidak'}
                      </strong>{' '}
                      · ID: <span className="font-mono">{batch.submissionId}</span>
                    </p>
                  </div>

                  {/* Batch Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isBatchBusy}
                      onClick={() =>
                        runAction(
                          `${batch.id}:approve-all`,
                          () => approveUnifiedBundleAdmin(bundle),
                          `Paket "${batch.contributorLabel}" disetujui (Toples + Voices of Love dipublikasikan).`
                        )
                      }
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#384435] disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui Keduanya</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBatchBusy}
                      onClick={() =>
                        runAction(
                          `${batch.id}:reject-all`,
                          () => rejectUnifiedBundleAdmin(bundle),
                          `Paket "${batch.contributorLabel}" ditolak.`
                        )
                      }
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#A6533B]/30 bg-[#A6533B]/8 text-[#A6533B] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#A6533B]/15 disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak Keduanya</span>
                    </button>

                    {confirmDeleteId === batch.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isBatchBusy}
                          onClick={() =>
                            runAction(
                              `${batch.id}:delete`,
                              async () => {
                                await deleteUnifiedBundleAdmin(bundle);
                                setConfirmDeleteId(null);
                              },
                              'Paket kontribusi & rekaman terkait berhasil dihapus.'
                            )
                          }
                          className="min-h-[38px] px-2.5 rounded-xl bg-[#A6533B] text-[#F4EBDD] text-xs font-semibold cursor-pointer"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[38px] px-2.5 rounded-xl border border-[#38271F]/20 text-xs cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(batch.id)}
                        aria-label={`Hapus paket kontribusi ${batch.contributorLabel}`}
                        className="min-h-[38px] px-2.5 rounded-xl text-xs font-semibold text-[#A6533B] hover:bg-[#A6533B]/10 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Automated Screening Details if flagged */}
                {isFlagged && (
                  <div className="rounded-xl border border-[#A6533B]/25 bg-[#A6533B]/8 px-3.5 py-2.5 text-xs text-[#A6533B] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Peringatan Pemeriksaan Teks Otomatis:</p>
                      <p className="mt-0.5 text-[11px]">
                        {combinedFlags.length > 0
                          ? combinedFlags.join(' · ')
                          : 'Teks ditandai untuk tinjauan manual sebelum dipublikasikan.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Linked Two-Part Body */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Jar Full of Thoughts */}
                  <div className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/55 p-3.5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#38271F]">
                          <Sparkles className="w-3.5 h-3.5 text-[#A6533B]" />
                          Bagian 1 · A Jar Full of Thoughts
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${jarBadge.className}`}>
                          {jarBadge.label}
                        </span>
                      </div>

                      {jarThought ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#38271F]/75">
                            <span>
                              Inisial: <strong className="text-[#38271F]">{jarThought.senderInitial}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Tampil publik:{' '}
                              <strong className="text-[#743D4A]">
                                {jarThought.isAnonymous
                                  ? `${ANONYMOUS_AUTHOR_LABEL} (Anonim)`
                                  : jarThought.senderInitial}
                              </strong>
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <span
                                className="inline-block w-3 h-3 rounded-full border"
                                style={{
                                  backgroundColor: paperOpt.paperBg,
                                  borderColor: paperOpt.accentColor,
                                }}
                              />
                              {paperOpt.label}
                            </span>
                          </div>

                          <div
                            className="rounded-xl border p-3 text-sm leading-relaxed whitespace-pre-line"
                            style={{
                              backgroundColor: paperOpt.paperBg,
                              borderColor: paperOpt.borderColor,
                              color: paperOpt.inkColor,
                            }}
                          >
                            “{jarThought.message}”
                          </div>
                        </>
                      ) : (
                        <p className="text-xs italic text-[#38271F]/55">
                          Dokumen pesan toples tidak lagi ditemukan (mungkin telah dihapus terpisah).
                        </p>
                      )}
                    </div>

                    {jarThought && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#38271F]/10">
                        <button
                          type="button"
                          disabled={busyKey === `${batch.id}:jar` || jarThought.status === 'approved'}
                          onClick={() =>
                            runAction(
                              `${batch.id}:jar`,
                              () => approveJarThought(jarThought),
                              'Pesan Toples disetujui dan dimasukkan ke toples Wulan.'
                            )
                          }
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-[#455342] text-[#F4EBDD] text-xs font-semibold disabled:opacity-45 cursor-pointer"
                        >
                          {jarThought.status === 'approved' ? 'Sudah di Toples' : 'Setujui Toples'}
                        </button>
                        <button
                          type="button"
                          disabled={busyKey === `${batch.id}:jar` || jarThought.status === 'rejected'}
                          onClick={() =>
                            runAction(
                              `${batch.id}:jar`,
                              () => rejectJarThought(jarThought.id),
                              'Pesan Toples ditolak.'
                            )
                          }
                          className="min-h-[36px] px-3 py-1 rounded-lg border border-[#A6533B]/30 text-[#A6533B] text-xs font-semibold disabled:opacity-45 cursor-pointer"
                        >
                          Tolak Toples
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Voices of Love */}
                  <div className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/55 p-3.5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#38271F]">
                          <Mic className="w-3.5 h-3.5 text-[#743D4A]" />
                          Bagian 2 · Voices of Love (Non-Anonim)
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${voiceBadge.className}`}>
                          {voiceBadge.label}
                        </span>
                      </div>

                      {voiceSubmission ? (
                        <>
                          <div className="flex items-center gap-3">
                            <VoiceBouquetDisplay
                              flowerType={voiceSubmission.flowerType}
                              quantity={voiceSubmission.flowerQuantity}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-sm font-serif font-semibold text-[#38271F] truncate">
                                {voiceSubmission.senderName}
                              </p>
                              <p className="text-xs text-[#743D4A] inline-flex items-center gap-1">
                                <Flower2 className="w-3 h-3" />
                                <span>
                                  {voiceSubmission.flowerQuantity}× {flowerMeta?.label || voiceSubmission.flowerType}
                                </span>
                              </p>
                              <p className="text-[11px] text-[#38271F]/60 truncate">
                                {voiceSubmission.audioFileName}
                                {voiceSubmission.audioDurationSec
                                  ? ` · ${formatAudioTime(voiceSubmission.audioDurationSec)}`
                                  : ''}
                              </p>
                            </div>
                          </div>

                          {voiceSubmission.caption && (
                            <p className="rounded-xl border border-[#38271F]/10 bg-[#FBF6EE] px-3 py-2 text-xs text-[#38271F]/85 italic">
                              “{voiceSubmission.caption}”
                            </p>
                          )}

                          {voiceSubmission.audioUrl ? (
                            <audio
                              src={voiceSubmission.audioUrl}
                              controls
                              preload="metadata"
                              className="w-full h-9"
                            />
                          ) : (
                            <p className="text-xs text-[#A6533B]">Audio URL tidak tersedia.</p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs italic text-[#38271F]/55">
                          Data rekaman suara tidak ditemukan.
                        </p>
                      )}
                    </div>

                    {voiceSubmission && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#38271F]/10">
                        <button
                          type="button"
                          disabled={
                            busyKey === `${batch.id}:voice` || voiceSubmission.status === 'approved'
                          }
                          onClick={() =>
                            runAction(
                              `${batch.id}:voice`,
                              () => approveVoiceSubmissionAdmin(voiceSubmission),
                              `Suara & buket ${voiceSubmission.flowerQuantity}× bunga milik "${voiceSubmission.senderName}" dipublikasikan ke Voices of Love.`
                            )
                          }
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-[#455342] text-[#F4EBDD] text-xs font-semibold disabled:opacity-45 cursor-pointer"
                        >
                          {voiceSubmission.status === 'approved' ? 'Sudah Terbit' : 'Setujui Suara'}
                        </button>
                        <button
                          type="button"
                          disabled={
                            busyKey === `${batch.id}:voice` || voiceSubmission.status === 'rejected'
                          }
                          onClick={() =>
                            runAction(
                              `${batch.id}:voice`,
                              () => rejectVoiceSubmissionAdmin(voiceSubmission),
                              `Suara milik "${voiceSubmission.senderName}" ditolak.`
                            )
                          }
                          className="min-h-[36px] px-3 py-1 rounded-lg border border-[#A6533B]/30 text-[#A6533B] text-xs font-semibold disabled:opacity-45 cursor-pointer"
                        >
                          Tolak Suara
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
