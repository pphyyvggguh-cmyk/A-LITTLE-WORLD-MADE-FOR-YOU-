import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Eye,
  Lock,
  MailOpen,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import {
  POSTCARD_DESIGN_META,
  POSTCARD_RECIPIENT_META,
  POSTCARD_STAMP_META,
  POSTCARD_VISIBILITY_META,
  PostcardBucket,
  PostcardEnvelope,
  PostcardRecipient,
  PostcardSecret,
} from '../../data/postcards';
import { useFirebaseAuth } from '../../lib/FirebaseProvider';
import {
  createPostcard,
  deletePostcard,
  fetchPostcardSecret,
  reorderPostcards,
  subscribePostcardEnvelopes,
  updatePostcard,
} from '../../utils/adminApi';
import { classifyPostcardBucket } from '../../utils/postcards';
import { fetchTrustedServerNowMs, getTrustedNowMs } from '../../utils/serverTime';
import { PostcardFormModal } from '../postcards/PostcardFormModal';

export function PostcardsManager() {
  const { user, accessConfig } = useFirebaseAuth();

  const [envelopes, setEnvelopes] = useState<PostcardEnvelope[]>([]);
  const [trustedNowMs, setTrustedNowMs] = useState<number>(() => getTrustedNowMs());
  const [bucketFilter, setBucketFilter] = useState<PostcardBucket | 'all'>('all');
  const [recipientFilter, setRecipientFilter] = useState<PostcardRecipient | 'all'>('all');
  const [previewUnlockedIds, setPreviewUnlockedIds] = useState<Record<string, boolean>>({});
  const [secretsById, setSecretsById] = useState<Record<string, PostcardSecret | null>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEnvelope, setEditingEnvelope] = useState<PostcardEnvelope | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [listError, setListError] = useState('');

  useEffect(() => {
    void fetchTrustedServerNowMs().then((ms) => setTrustedNowMs(ms));
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    const unsub = subscribePostcardEnvelopes(
      user.email,
      'oktaf',
      (items) => setEnvelopes(items),
      (err) => setListError(err.message)
    );
    return () => unsub();
  }, [user?.email]);

  const filtered = useMemo(() => {
    return envelopes.filter((item) => {
      if (
        bucketFilter !== 'all' &&
        classifyPostcardBucket(item, trustedNowMs) !== bucketFilter
      ) {
        return false;
      }
      if (recipientFilter !== 'all' && item.recipient !== recipientFilter) {
        return false;
      }
      return true;
    });
  }, [envelopes, bucketFilter, recipientFilter, trustedNowMs]);

  const togglePreviewState = async (envelope: PostcardEnvelope) => {
    const nextOpen = !previewUnlockedIds[envelope.id];
    setPreviewUnlockedIds((prev) => ({ ...prev, [envelope.id]: nextOpen }));
    if (nextOpen && !(envelope.id in secretsById)) {
      const secret = await fetchPostcardSecret(envelope.id);
      setSecretsById((prev) => ({ ...prev, [envelope.id]: secret }));
    }
  };

  const handleMove = async (index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= envelopes.length) return;
    const next = [...envelopes];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setListError('');
    try {
      await reorderPostcards(next);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Gagal mengubah urutan kartu pos.');
    }
  };

  const handleDelete = async (id: string) => {
    setListError('');
    try {
      await deletePostcard(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Gagal menghapus kartu pos.');
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#38271F] inline-flex items-center gap-2">
              <Send className="w-5 h-5 text-[#A6533B]" />
              <span>Postcards From The Future Manager ({envelopes.length})</span>
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5">
              Buat & jadwalkan kartu pos masa depan, unggah foto kenangan, atur urutan tampil, serta pratinjau kondisi tersegel vs terbuka.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingEnvelope(null);
              setModalOpen(true);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#4e382d] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kartu Pos Baru</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#743D4A]">Status:</span>
            {(
              [
                ['all', 'Semua'],
                ['waiting', 'Menunggu Waktu'],
                ['ready', 'Siap Dibuka'],
                ['opened', 'Sudah Dibuka'],
              ] as const
            ).map(([b, label]) => (
              <button
                key={b}
                type="button"
                onClick={() => setBucketFilter(b)}
                className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                  bucketFilter === b
                    ? 'bg-[#A6533B] text-[#F4EBDD]'
                    : 'bg-[#F4EBDD] border border-[#38271F]/14 text-[#38271F]/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#743D4A]">Penerima:</span>
            {(
              [
                ['all', 'Semua'],
                ['wulan', 'Untuk Wulan'],
                ['oktaf', 'Untuk Oktaf'],
                ['both', 'Berdua'],
              ] as const
            ).map(([rec, label]) => (
              <button
                key={rec}
                type="button"
                onClick={() => setRecipientFilter(rec)}
                className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                  recipientFilter === rec
                    ? 'bg-[#455342] text-[#F4EBDD]'
                    : 'bg-[#F4EBDD] border border-[#38271F]/14 text-[#38271F]/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {listError && (
          <p role="alert" className="text-xs text-[#A6533B] font-medium">
            {listError}
          </p>
        )}
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#38271F]/22 bg-[#FBF6EE] p-8 text-center text-sm text-[#38271F]/70">
          Belum ada kartu pos di filter ini. Ketuk &ldquo;Buat Kartu Pos Baru&rdquo; untuk mengirim pesan ke masa depan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((env) => {
            const globalIdx = envelopes.findIndex((x) => x.id === env.id);
            const bucket = classifyPostcardBucket(env, trustedNowMs);
            const design = POSTCARD_DESIGN_META[env.designTheme] ?? POSTCARD_DESIGN_META.vintage_cream;
            const stamp = POSTCARD_STAMP_META[env.stampStyle] ?? POSTCARD_STAMP_META.par_avion;
            const recMeta = POSTCARD_RECIPIENT_META[env.recipient] ?? POSTCARD_RECIPIENT_META.both;
            const visMeta = POSTCARD_VISIBILITY_META[env.visibility] ?? POSTCARD_VISIBILITY_META.private;
            const previewOpen = Boolean(previewUnlockedIds[env.id]);
            const secret = secretsById[env.id];

            return (
              <article
                key={env.id}
                style={{ backgroundColor: design.paperBg }}
                className="rounded-2xl border border-[#38271F]/16 p-4 shadow-polaroid flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-[#743D4A]">
                        #{env.order} · {env.senderName} → {recMeta.shortLabel} · {visMeta.shortLabel}
                      </p>
                      <h3 className="font-serif text-lg font-semibold text-[#38271F]">
                        {env.title}
                      </h3>
                    </div>
                    <span className="postage-stamp px-2 py-0.5 text-[9px] font-semibold uppercase text-[#743D4A]">
                      {stamp.stampText}
                    </span>
                  </div>

                  <p className="text-xs text-[#38271F]/75">
                    Tanggal buka: <strong>{env.unlockDateLabel}</strong> ·{' '}
                    <span className="font-semibold text-[#455342]">
                      {bucket === 'waiting'
                        ? 'Tersegel (Menunggu)'
                        : bucket === 'opened'
                          ? 'Sudah Dibuka'
                          : 'Siap Dibuka'}
                    </span>
                  </p>

                  {/* Locked vs Unlocked Preview Box */}
                  {!previewOpen ? (
                    <div className="rounded-xl border border-[#38271F]/14 bg-[#F4EBDD]/75 p-3 text-xs text-[#38271F]/75 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#743D4A] shrink-0" />
                      <span>
                        Pratinjau Tersegel: Pengunjung/penerima hanya melihat sampul, judul, dan jadwal buka.
                      </span>
                    </div>
                  ) : (
                    <div className="journal-lined rounded-xl border border-[#455342]/28 p-3.5 space-y-2">
                      {secret ? (
                        <>
                          <p className="font-hand text-xl text-[#38271F] leading-relaxed whitespace-pre-line">
                            {secret.message}
                          </p>
                          {secret.photoUrl && (
                            <img
                              src={secret.photoUrl}
                              alt=""
                              className="w-24 h-24 rounded-lg object-cover border border-[#38271F]/16"
                            />
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-[#743D4A] flex items-center gap-1.5">
                          <MailOpen className="w-4 h-4 shrink-0" />
                          <span>
                            Kartu pos kejutan dari {env.senderName} untukmu masih disegel oleh server hingga {env.unlockDateLabel} ♡.
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-[#38271F]/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(globalIdx, -1)}
                      disabled={globalIdx <= 0}
                      aria-label="Naikkan urutan"
                      className="min-w-[34px] min-h-[34px] rounded-lg border border-[#38271F]/16 bg-[#FBF6EE] flex items-center justify-center disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(globalIdx, 1)}
                      disabled={globalIdx < 0 || globalIdx >= envelopes.length - 1}
                      aria-label="Turunkan urutan"
                      className="min-w-[34px] min-h-[34px] rounded-lg border border-[#38271F]/16 bg-[#FBF6EE] flex items-center justify-center disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePreviewState(env)}
                      className="min-h-[34px] px-2.5 rounded-lg border border-[#38271F]/16 bg-[#F4EBDD] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-[#455342]" />
                      <span>{previewOpen ? 'Lihat Tersegel' : 'Pratinjau Terbuka'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEnvelope(env);
                        setModalOpen(true);
                      }}
                      className="min-h-[34px] px-2.5 rounded-lg border border-[#38271F]/18 bg-[#FBF6EE] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {confirmDeleteId === env.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(env.id)}
                          className="min-h-[34px] px-2.5 rounded-lg bg-[#A6533B] text-[#F4EBDD] text-[11px] font-semibold cursor-pointer"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[34px] px-2 rounded-lg border border-[#38271F]/20 text-[11px] cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(env.id)}
                        aria-label={`Hapus ${env.title}`}
                        className="min-h-[34px] px-2 rounded-lg text-[#A6533B] hover:bg-[#A6533B]/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <PostcardFormModal
          mode={editingEnvelope ? 'edit' : 'create'}
          initialEnvelope={editingEnvelope}
          defaultRole="oktaf"
          nextOrder={envelopes.length + 1}
          onClose={() => {
            setModalOpen(false);
            setEditingEnvelope(null);
          }}
          onSubmit={async (payload) => {
            if (editingEnvelope) {
              await updatePostcard(editingEnvelope.id, {
                title: payload.title,
                recipient: payload.recipient,
                visibility: payload.visibility,
                unlockAtIso: payload.unlockAtIso,
                location: payload.location,
                stampStyle: payload.stampStyle,
                designTheme: payload.designTheme,
                message: payload.message,
                photoUrl: payload.photoUrl,
                updateSecret: payload.updateSecret,
              });
              setSecretsById((prev) => {
                const copy = { ...prev };
                delete copy[editingEnvelope.id];
                return copy;
              });
            } else {
              await createPostcard({
                id: payload.id,
                title: payload.title,
                recipient: payload.recipient,
                visibility: payload.visibility,
                unlockAtIso: payload.unlockAtIso,
                location: payload.location,
                stampStyle: payload.stampStyle,
                designTheme: payload.designTheme,
                message: payload.message,
                photoUrl: payload.photoUrl,
                order: payload.order,
                role: 'oktaf',
                accessConfig,
              });
            }
          }}
        />
      )}
    </div>
  );
}
