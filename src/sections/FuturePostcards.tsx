import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Feather, LogOut, Mail, X } from 'lucide-react';
import {
  EditorialHeader,
  EditorialSectionShell,
  StorybookButton,
} from '../components/editorial/StorybookPrimitives';
import { BotanicalFlowerSVG } from '../components/Flower';
import { HiddenPolaroidSpot } from '../components/quests/HiddenPolaroidSpot';
import { PostcardCard } from '../components/postcards/PostcardCard';
import { PostcardFormModal } from '../components/postcards/PostcardFormModal';
import { DecorationSVG } from '../components/story/ScrapbookDecorations';
import { CloudMediaImg } from '../components/CloudMediaImg';
import {
  PostcardBucket,
  PostcardEnvelope,
  PostcardSecret,
} from '../data/postcards';
import { useFirebaseAuth } from '../lib/FirebaseProvider';
import {
  createPostcard,
  deletePostcard,
  fetchPostcardSecret,
  markPostcardOpened,
  subscribePostcardEnvelopes,
  updatePostcard,
} from '../utils/adminApi';
import { EASE_OUT_EXPO } from '../utils/animation';
import {
  canDeletePostcard,
  canEditPostcard,
  canOpenPostcard,
  canReadPostcardSecret,
  classifyPostcardBucket,
} from '../utils/postcards';
import { fetchTrustedServerNowMs, getTrustedNowMs } from '../utils/serverTime';
import { formatSafeUiError } from '../utils/safeError';

export function FuturePostcards() {
  const {
    user,
    authReady,
    accessConfig,
    coupleRole,
    authError,
    signInWithGoogle,
    signOutUser,
  } = useFirebaseAuth();

  const [envelopes, setEnvelopes] = useState<PostcardEnvelope[]>([]);
  const [secretsById, setSecretsById] = useState<Record<string, PostcardSecret>>({});
  const [loadingSecretId, setLoadingSecretId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [syncError, setSyncError] = useState('');

  const [trustedNowMs, setTrustedNowMs] = useState<number>(() => getTrustedNowMs());
  const [activeBucket, setActiveBucket] = useState<PostcardBucket | 'all'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEnvelope, setEditingEnvelope] = useState<PostcardEnvelope | null>(null);
  const [authNoticeOpen, setAuthNoticeOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Sync authoritative server UTC time on mount & advance monotonically (resistant to OS clock tampering)
  useEffect(() => {
    let mounted = true;
    void fetchTrustedServerNowMs().then((ms) => {
      if (mounted) setTrustedNowMs(ms);
    });
    const interval = window.setInterval(() => {
      setTrustedNowMs(getTrustedNowMs());
    }, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    setLoadingList(true);
    setSyncError('');

    const unsub = subscribePostcardEnvelopes(
      user?.email || null,
      coupleRole,
      (items) => {
        setEnvelopes(items);
        setLoadingList(false);
      },
      (err) => {
        setSyncError(formatSafeUiError(err, 'Gagal memuat kartu pos.', 'public'));
        setLoadingList(false);
      }
    );

    return () => unsub();
  }, [authReady, user?.email, coupleRole]);

  const bucketCounts = useMemo(() => {
    const counts = { waiting: 0, ready: 0, opened: 0 };
    for (const item of envelopes) {
      const b = classifyPostcardBucket(item, trustedNowMs);
      counts[b] += 1;
    }
    return counts;
  }, [envelopes, trustedNowMs]);

  const visibleEnvelopes = useMemo(() => {
    if (activeBucket === 'all') return envelopes;
    return envelopes.filter((item) => classifyPostcardBucket(item, trustedNowMs) === activeBucket);
  }, [envelopes, activeBucket, trustedNowMs]);

  const handleRequestWrite = () => {
    if (!coupleRole) {
      setAuthNoticeOpen(true);
      return;
    }
    setEditingEnvelope(null);
    setModalOpen(true);
  };

  const handleRevealPostcard = async (envelope: PostcardEnvelope) => {
    setSyncError('');
    setLoadingSecretId(envelope.id);
    try {
      const freshServerNow = await fetchTrustedServerNowMs();
      setTrustedNowMs(freshServerNow);

      const allowed = canReadPostcardSecret(
        envelope,
        user?.email,
        coupleRole,
        freshServerNow
      );
      if (!allowed) {
        setSyncError('Kartu pos ini masih tersegel hingga tanggal bukanya tiba.');
        return;
      }

      const secret = await fetchPostcardSecret(envelope.id);
      if (!secret) {
        setSyncError('Kartu pos ini masih tersegel rapat hingga waktunya tiba.');
        return;
      }

      setSecretsById((prev) => ({ ...prev, [envelope.id]: secret }));

      if (
        !envelope.isOpened &&
        coupleRole &&
        canOpenPostcard(envelope, user?.email, coupleRole, freshServerNow)
      ) {
        await markPostcardOpened(envelope.id).catch(() => {});
      }
    } finally {
      setLoadingSecretId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setSyncError('');
    try {
      await deletePostcard(id);
    } catch (err) {
      setSyncError(formatSafeUiError(err, 'Gagal menghapus kartu pos.', 'public'));
    }
  };

  return (
    <EditorialSectionShell testId="future-postcards-section">
      <div className="space-y-7">
        {/* Vintage Desk Header */}
        <EditorialHeader
          kicker="07 · Meja Surat Masa Depan"
          metaRight={`${bucketCounts.ready} siap dibuka · ${bucketCounts.waiting} menunggu`}
          title="Postcards From The Future ♡"
          subtitle="Surat-surat kecil bertanggal buka—disimpan dulu hingga hari yang dituju benar-benar tiba."
          ornament={
            <div className="hidden sm:block opacity-85 mr-1">
              <BotanicalFlowerSVG species="lavender" className="w-9 h-9" />
            </div>
          }
          actions={
            <>
              <StorybookButton
                type="button"
                variant="primary"
                onClick={handleRequestWrite}
              >
                <Feather className="w-3.5 h-3.5 text-[#E8BFC5]" />
                <span>{coupleRole ? 'Kirim Kartu Pos Baru' : 'Masuk untuk Menulis'}</span>
              </StorybookButton>

              {user && (
                <StorybookButton
                  type="button"
                  variant="secondary"
                  onClick={signOutUser}
                  aria-label="Keluar dari akun Google"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#A6533B]" />
                  <span>
                    {coupleRole ? (coupleRole === 'oktaf' ? 'Oktaf' : 'Wulan') : 'Keluar'}
                  </span>
                </StorybookButton>
              )}
            </>
          }
        />

        {/* Inline Google Auth prompt on demand */}
        {(authNoticeOpen || (user && !coupleRole)) && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="journal-lined relative rounded-xl border border-[#38271F]/16 p-4 sm:p-5 shadow-polaroid flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <span
              aria-hidden="true"
              className="washi-tape absolute -top-2.5 left-6 w-16 h-3.5 -rotate-2"
            />
            <div className="space-y-1 pr-6">
              <p className="font-serif text-base font-semibold text-[#38271F]">
                {user && !coupleRole
                  ? 'Akun Google yang sedang masuk belum terdaftar sebagai Oktaf atau Wulan'
                  : 'Masuk sebagai Oktaf atau Wulan untuk menulis & membuka kartu pos pribadi'}
              </p>
              <p className="text-xs text-[#38271F]/72 leading-relaxed">
                Kartu pos yang dibagikan secara terbuka tetap terlihat di sini, dan isinya baru terbuka saat tanggal bukanya tiba.
              </p>
              {authError && (
                <p role="alert" className="text-xs font-medium text-[#A6533B]">
                  {authError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  const logged = await signInWithGoogle();
                  if (logged) setAuthNoticeOpen(false);
                }}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[#455342] text-[#F4EBDD] text-xs font-semibold hover:bg-[#384435] cursor-pointer"
              >
                {user ? 'Ganti Akun Google' : 'Masuk dengan Google'}
              </button>
              <button
                type="button"
                onClick={() => setAuthNoticeOpen(false)}
                aria-label="Tutup pemberitahuan"
                className="min-w-[40px] min-h-[40px] rounded-lg border border-[#38271F]/16 flex items-center justify-center text-[#38271F]/70 hover:bg-[#EAE0CF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.section>
        )}

        {/* Bucket Navigation: Waiting · Ready · Opened */}
        <section
          aria-label="Status kartu pos masa depan"
          className="border-b border-[#38271F]/14 pb-2 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-5">
            {(
              [
                ['all', `Semua (${envelopes.length})`],
                ['waiting', `Menunggu Waktu (${bucketCounts.waiting})`],
                ['ready', `Siap Dibuka ♡ (${bucketCounts.ready})`],
                ['opened', `Sudah Dibuka (${bucketCounts.opened})`],
              ] as const
            ).map(([bucket, label]) => {
              const active = activeBucket === bucket;
              return (
                <button
                  key={bucket}
                  type="button"
                  onClick={() => setActiveBucket(bucket)}
                  className={`min-h-[40px] py-1.5 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'text-[#552E3D] border-[#A95F70]'
                      : 'text-[#6E5F63] border-transparent hover:text-[#30272A]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-[#38271F]/55">
            Waktu buka mengikuti tanggal sebenarnya
          </span>
        </section>

        {syncError && (
          <p
            role="alert"
            className="rounded-xl border border-[#A6533B]/30 bg-[#A6533B]/10 px-4 py-3 text-xs font-medium text-[#A6533B]"
          >
            {syncError}
          </p>
        )}

        {/* Postcard Collection */}
        {loadingList ? (
          <div className="journal-lined rounded-xl border border-[#38271F]/14 p-8 text-center font-hand text-2xl text-[#38271F]/70 shadow-polaroid">
            Memeriksa kotak surat masa depan...
          </div>
        ) : visibleEnvelopes.length === 0 ? (
          <section className="journal-lined relative rounded-xl border border-[#38271F]/16 p-8 sm:p-10 text-center max-w-2xl mx-auto shadow-polaroid space-y-4">
            <span
              aria-hidden="true"
              className="washi-tape-gold absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 -rotate-1"
            />
            <div className="flex justify-center">
              <DecorationSVG kind="rose" className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#38271F]">
              {activeBucket === 'all'
                ? 'Belum Ada Kartu Pos Dari Masa Depan'
                : 'Belum Ada Kartu Pos di Bagian Ini'}
            </h2>
            <p className="text-sm text-[#38271F]/74 leading-relaxed max-w-md mx-auto">
              {coupleRole
                ? 'Tulis kartu pos untuk ulang tahun berikutnya, hari spesial, atau sekadar pengingat buat diri kita nanti.'
                : 'Belum ada kartu pos terbuka di bagian ini. Masuk dengan akun Oktaf atau Wulan untuk melihat atau menulis kartu pos pribadi.'}
            </p>
            <button
              type="button"
              onClick={handleRequestWrite}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#3f202c] cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#EBC9CB]" />
              <span>{coupleRole ? 'Tulis Kartu Pos Pertama' : 'Masuk untuk Menulis'}</span>
            </button>
          </section>
        ) : (
          <section
            aria-label="Koleksi Postcards From The Future"
            className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start"
          >
            {visibleEnvelopes.map((envelope) => {
              const revealAllowed = canOpenPostcard(
                envelope,
                user?.email,
                coupleRole,
                trustedNowMs
              );
              const editAllowed = canEditPostcard(envelope, user?.email, coupleRole);
              const deleteAllowed = canDeletePostcard(envelope, user?.email, coupleRole);

              return (
                <PostcardCard
                  key={envelope.id}
                  envelope={envelope}
                  trustedNowMs={trustedNowMs}
                  canReveal={revealAllowed}
                  canEdit={editAllowed}
                  canDelete={deleteAllowed}
                  secret={secretsById[envelope.id] ?? null}
                  loadingSecret={loadingSecretId === envelope.id}
                  onRevealRequest={handleRevealPostcard}
                  onEdit={(env) => {
                    setEditingEnvelope(env);
                    setModalOpen(true);
                  }}
                  onDelete={handleDelete}
                  onPhotoClick={(url) => setLightboxUrl(url)}
                />
              );
            })}
          </section>
        )}

        {/* Subtle desk center Polaroid collectible (Quest 3) */}
        <div className="pt-2 pb-12 sm:pb-4 flex items-center justify-center">
          <HiddenPolaroidSpot polaroidId="polaroid-postcards" />
        </div>
      </div>

      {/* Create / Edit Postcard Modal */}
      {modalOpen && coupleRole && (
        <PostcardFormModal
          mode={editingEnvelope ? 'edit' : 'create'}
          initialEnvelope={editingEnvelope}
          defaultRole={coupleRole}
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
                role: coupleRole,
                accessConfig,
              });
            }
          }}
        />
      )}

      {/* Photo Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-[#140D0A]/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxUrl(null)}
        >
          <CloudMediaImg
            src={lightboxUrl}
            alt="Foto Kenangan Kartu Pos"
            className="max-w-full max-h-[85dvh] rounded-lg border-8 border-[#FBF8F2] shadow-2xl object-contain"
          />
        </div>
      )}
    </EditorialSectionShell>
  );
}
