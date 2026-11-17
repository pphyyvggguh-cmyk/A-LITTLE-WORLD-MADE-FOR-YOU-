import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Edit3,
  Feather,
  LogOut,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  EditorialHeader,
  EditorialSectionShell,
  StorybookButton,
} from '../components/editorial/StorybookPrimitives';
import { BotanicalFlowerSVG } from '../components/Flower';
import { DecorationSVG } from '../components/story/ScrapbookDecorations';
import { WishFormModal } from '../components/wishlist/WishFormModal';
import {
  CanonicalWishlistVisibility,
  WISHLIST_CATEGORY_META,
  WISHLIST_STATUS_META,
  WISHLIST_VISIBILITY_META,
  WishlistCategory,
  WishlistEntry,
  WishlistStatus,
  normalizeWishlistVisibility,
} from '../data/wishlist';
import { useFirebaseAuth } from '../lib/FirebaseProvider';
import {
  createWishlistEntry,
  deleteWishlistEntry,
  subscribeWishlistEntries,
  updateWishlistEntry,
} from '../utils/adminApi';
import { EASE_OUT_EXPO } from '../utils/animation';
import {
  canDeleteWishlistEntry,
  canEditWishlistEntry,
  filterWishlistEntries,
} from '../utils/wishlist';

export function FutureWishlist() {
  const {
    user,
    authReady,
    accessConfig,
    coupleRole,
    authError,
    signInWithGoogle,
    signOutUser,
  } = useFirebaseAuth();

  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [syncError, setSyncError] = useState('');

  const [categoryFilter, setCategoryFilter] = useState<WishlistCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<WishlistStatus | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] =
    useState<CanonicalWishlistVisibility | 'all'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WishlistEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [authNoticeOpen, setAuthNoticeOpen] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    setLoadingList(true);
    setSyncError('');

    const unsub = subscribeWishlistEntries(
      user?.email || null,
      coupleRole,
      (items) => {
        setEntries(items);
        setLoadingList(false);
      },
      (err) => {
        setSyncError(err.message);
        setLoadingList(false);
      }
    );

    return () => unsub();
  }, [authReady, user?.email, coupleRole]);

  const visibleEntries = useMemo(
    () =>
      filterWishlistEntries(entries, categoryFilter, statusFilter, {
        visibility: coupleRole ? visibilityFilter : 'all',
      }),
    [entries, categoryFilter, statusFilter, visibilityFilter, coupleRole]
  );

  const completedCount = useMemo(
    () => entries.filter((item) => item.status === 'completed').length,
    [entries]
  );

  const handleRequestWrite = () => {
    if (!coupleRole) {
      setAuthNoticeOpen(true);
      return;
    }
    setEditingEntry(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (entry: WishlistEntry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setSyncError('');
    try {
      await deleteWishlistEntry(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Gagal menghapus catatan impian.');
    }
  };

  const handleQuickComplete = async (entry: WishlistEntry) => {
    if (!coupleRole) return;
    setSyncError('');
    try {
      await updateWishlistEntry(
        entry.id,
        entry.status,
        {
          title: entry.title,
          description: entry.description,
          category: entry.category,
          targetDate: entry.targetDate,
          status: 'completed',
          photos: entry.photos,
          completionStory: entry.completionStory,
          completedAt: new Date().toISOString(),
        },
        coupleRole
      );
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Gagal menandai tercapai.');
    }
  };

  return (
    <EditorialSectionShell testId="future-wishlist-section">
      <div className="space-y-7">
        {/* Scrapbook Botanical Header — NO lock wall */}
        <EditorialHeader
          kicker="06 · Jurnal Impian Masa Depan"
          metaRight={`${completedCount} kenangan tercapai`}
          title="Our Future Wishlist ♡"
          subtitle="Tempat mencatat rencana perjalanan, doa kecil, dan hal-hal yang pengin kita rayakan satu per satu."
          ornament={
            <div className="hidden sm:block opacity-85 mr-1">
              <BotanicalFlowerSVG species="forgetmenot" className="w-9 h-9" />
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
                <span>{coupleRole ? 'Tulis Impian Baru' : 'Masuk untuk Menulis'}</span>
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
                    {coupleRole
                      ? coupleRole === 'oktaf'
                        ? 'Oktaf'
                        : 'Wulan'
                      : 'Keluar'}
                  </span>
                </StorybookButton>
              )}
            </>
          }
        />

        {/* On-demand inline Google Sign-in note (triggered only when visitor clicks Write or uses non-couple email) */}
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
                  ? `Akun ${user.email} belum terdaftar sebagai penulis jurnal ini`
                  : 'Masuk sebagai Oktaf atau Wulan untuk menulis & melihat catatan privat'}
              </p>
              <p className="text-xs text-[#38271F]/72 leading-relaxed">
                {user && !coupleRole
                  ? 'Catatan terbuka tetap bisa kamu baca di bawah. Untuk menulis atau melihat catatan pribadi, silakan masuk dengan akun Google milik Oktaf atau Wulan.'
                  : 'Impian yang dibagikan secara terbuka tetap bisa kamu baca di sini tanpa perlu masuk akun.'}
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

        {/* Editorial Scrapbook Bookmark Navigation (Zero glossy pills) */}
        <section
          aria-label="Filter halaman wishlist"
          className="border-b border-[#38271F]/14 pb-3 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-5">
              {(
                [
                  ['all', `Semua (${entries.length})`],
                  ['our', WISHLIST_CATEGORY_META.our.label],
                  ['her', WISHLIST_CATEGORY_META.her.label],
                  ['your', WISHLIST_CATEGORY_META.your.label],
                ] as const
              ).map(([cat, label]) => {
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`min-h-[40px] py-1.5 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'text-[#A6533B] border-[#A6533B]'
                        : 'text-[#38271F]/65 border-transparent hover:text-[#38271F]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {coupleRole && (
              <p className="font-hand text-lg text-[#455342]">
                Masuk sebagai {coupleRole === 'oktaf' ? 'Oktaf ♡' : 'Wulan ♡'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#38271F]/70">
            <div className="flex flex-wrap items-center gap-3">
              <span className="uppercase tracking-wider text-[10px] font-semibold text-[#743D4A]">
                Perjalanan:
              </span>
              {(
                [
                  ['all', 'Semua'],
                  ['dreaming', 'Dreaming'],
                  ['planned', 'Planned'],
                  ['in_progress', 'In Progress'],
                  ['completed', 'Completed ♡'],
                ] as const
              ).map(([st, label]) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`min-h-[34px] px-2 transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'font-semibold text-[#38271F] underline underline-offset-4 decoration-[#A6533B]'
                      : 'text-[#38271F]/62 hover:text-[#38271F]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {coupleRole && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="uppercase tracking-wider text-[10px] font-semibold text-[#743D4A]">
                  Visibilitas:
                </span>
                {(
                  [
                    ['all', 'Semua'],
                    ['public', 'Public'],
                    ['private', 'Private'],
                    ['shared', 'Shared'],
                  ] as const
                ).map(([vis, label]) => (
                  <button
                    key={vis}
                    type="button"
                    onClick={() => setVisibilityFilter(vis)}
                    className={`min-h-[34px] px-1.5 transition-colors cursor-pointer ${
                      visibilityFilter === vis
                        ? 'font-semibold text-[#455342] underline underline-offset-4'
                        : 'text-[#38271F]/60 hover:text-[#38271F]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {syncError && (
          <p
            role="alert"
            className="rounded-xl border border-[#A6533B]/30 bg-[#A6533B]/10 px-4 py-3 text-xs font-medium text-[#A6533B]"
          >
            {syncError}
          </p>
        )}

        {/* Scrapbook Entries Ledger */}
        {loadingList ? (
          <div className="journal-lined rounded-xl border border-[#38271F]/14 p-8 text-center font-hand text-2xl text-[#38271F]/70 shadow-polaroid">
            Membuka halaman buku impian...
          </div>
        ) : visibleEntries.length === 0 ? (
          <section className="journal-lined relative rounded-xl border border-[#38271F]/16 p-8 sm:p-10 text-center max-w-2xl mx-auto shadow-polaroid space-y-4">
            <span
              aria-hidden="true"
              className="washi-tape-sage absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 -rotate-1"
            />
            <div className="flex justify-center">
              <DecorationSVG kind="wildflower" className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#38271F]">
              Belum Ada Catatan di Halaman Ini
            </h2>
            <p className="text-sm text-[#38271F]/74 leading-relaxed max-w-md mx-auto">
              {coupleRole
                ? 'Mulai tulis impian kecil, tempat yang ingin dikunjungi, atau rencana kita ke depannya.'
                : 'Belum ada impian terbuka di kategori ini. Masuk dengan akun Oktaf atau Wulan untuk melihat atau menambah catatan pribadi.'}
            </p>
            <button
              type="button"
              onClick={handleRequestWrite}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#4e382d] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E8BFC5]" />
              <span>{coupleRole ? 'Tulis Impian Pertama' : 'Masuk untuk Menulis'}</span>
            </button>
          </section>
        ) : (
          <section
            aria-label="Daftar catatan Our Future Wishlist"
            className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start"
          >
            {visibleEntries.map((entry, idx) => {
              const catMeta = WISHLIST_CATEGORY_META[entry.category];
              const stMeta = WISHLIST_STATUS_META[entry.status];
              const visMeta = WISHLIST_VISIBILITY_META[normalizeWishlistVisibility(entry.visibility)];
              const canEdit = canEditWishlistEntry(entry, user?.email, coupleRole);
              const canDelete = canDeleteWishlistEntry(entry, user?.email, coupleRole);
              const isCompleted = entry.status === 'completed';
              const tapeClass =
                idx % 3 === 0
                  ? 'washi-tape-gold'
                  : idx % 3 === 1
                    ? 'washi-tape-sage'
                    : 'washi-tape';

              return (
                <article
                  key={entry.id}
                  className={`relative border rounded-lg p-5 sm:p-6 shadow-polaroid transition-shadow hover:shadow-polaroid-lifted flex flex-col justify-between gap-4 ${
                    isCompleted
                      ? 'journal-lined border-[#455342]/30'
                      : 'bg-[#FBF6EE] border-[#38271F]/16'
                  }`}
                >
                  {/* Translucent washi tape */}
                  <span
                    aria-hidden="true"
                    className={`absolute -top-2.5 left-8 w-16 h-4 -rotate-2 ${tapeClass}`}
                  />

                  {/* Quiet botanical pressed flower accent on completed keepsakes */}
                  {isCompleted && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-3 right-3 opacity-70 rotate-6"
                    >
                      <DecorationSVG kind="daisy" className="w-7 h-7" />
                    </span>
                  )}

                  <div className="space-y-3">
                    {/* Editorial metadata row + Vintage Stamp Seal (NO pills!) */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-wider font-medium text-[#743D4A]">
                        <span>{catMeta.label}</span>
                        <span className="mx-1.5 text-[#38271F]/35">·</span>
                        <span className="text-[#38271F]/70">Oleh {entry.creatorName}</span>
                        {coupleRole && (
                          <>
                            <span className="mx-1.5 text-[#38271F]/35">·</span>
                            <span className="text-[#455342]">{visMeta.shortLabel}</span>
                          </>
                        )}
                      </p>

                      <span
                        className="postage-stamp px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase shrink-0 rotate-1"
                        style={{ color: stMeta.color }}
                      >
                        {stMeta.stamp}
                      </span>
                    </div>

                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#38271F] leading-snug">
                        {entry.title}
                      </h2>
                      {entry.targetDate && (
                        <p className="mt-1 font-hand text-lg text-[#743D4A]">
                          Target kita: {entry.targetDate}
                        </p>
                      )}
                      {entry.description && (
                        <p className="mt-2 text-sm text-[#38271F]/82 leading-relaxed whitespace-pre-line">
                          {entry.description}
                        </p>
                      )}
                    </div>

                    {/* Completion Story Note */}
                    {isCompleted && entry.completionStory && (
                      <div className="border-l-2 border-[#455342]/45 pl-3.5 py-1 space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#455342]">
                          Catatan Momen Tercapai ♡
                        </p>
                        <p className="font-hand text-xl text-[#38271F] leading-snug whitespace-pre-line">
                          {entry.completionStory}
                        </p>
                      </div>
                    )}

                    {/* Mini Polaroid Photo Strip */}
                    {entry.photos.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-2">
                        {entry.photos.map((photoUrl, pIdx) => (
                          <button
                            key={`${photoUrl}-${pIdx}`}
                            type="button"
                            onClick={() => setLightboxUrl(photoUrl)}
                            className={`bg-[#FBF8F2] p-1.5 pb-4 border border-[#38271F]/14 shadow-polaroid cursor-pointer hover:scale-[1.03] transition-transform ${
                              pIdx % 2 === 0 ? '-rotate-2' : 'rotate-2'
                            }`}
                          >
                            <img
                              src={photoUrl}
                              alt={`${entry.title} foto ${pIdx + 1}`}
                              className="w-20 h-20 object-cover bg-[#EAE0CF]"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-[#38271F]/10 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-[#38271F]/55 tabular-nums">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Baru ditulis'}
                    </span>

                    {(canEdit || canDelete) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {canEdit && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleQuickComplete(entry)}
                            className="min-h-[38px] px-2.5 rounded-lg border border-[#455342]/28 text-[#455342] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#455342]/10 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tercapai</span>
                          </button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(entry)}
                            aria-label={`Edit ${entry.title}`}
                            className="min-h-[38px] px-2.5 rounded-lg border border-[#38271F]/18 bg-[#F4EBDD]/70 text-[#38271F] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#EAE0CF] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}

                        {canDelete && (
                          confirmDeleteId === entry.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(entry.id)}
                                className="min-h-[38px] px-2.5 rounded-lg bg-[#A6533B] text-[#F4EBDD] text-xs font-semibold cursor-pointer"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="min-h-[38px] px-2 rounded-lg border border-[#38271F]/20 text-xs cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(entry.id)}
                              aria-label={`Hapus ${entry.title}`}
                              className="min-h-[38px] px-2 rounded-lg text-xs text-[#A6533B] hover:bg-[#A6533B]/10 inline-flex items-center cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && coupleRole && (
        <WishFormModal
          mode={editingEntry ? 'edit' : 'create'}
          initialEntry={editingEntry}
          defaultRole={coupleRole}
          onClose={() => {
            setModalOpen(false);
            setEditingEntry(null);
          }}
          onSubmit={async (payload) => {
            if (editingEntry) {
              await updateWishlistEntry(
                editingEntry.id,
                editingEntry.status,
                {
                  title: payload.title,
                  description: payload.description,
                  category: payload.category,
                  targetDate: payload.targetDate,
                  status: payload.status,
                  photos: payload.photos,
                  completionStory: payload.completionStory,
                  completedAt: editingEntry.completedAt,
                  visibility: payload.visibility,
                },
                coupleRole
              );
            } else {
              await createWishlistEntry({
                id: payload.id,
                title: payload.title,
                description: payload.description,
                category: payload.category,
                targetDate: payload.targetDate,
                status: payload.status,
                photos: payload.photos,
                completionStory: payload.completionStory,
                visibility: payload.visibility,
                role: coupleRole,
                accessConfig,
              });
            }
          }}
        />
      )}

      {/* Polaroid Photo Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-[#140D0A]/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Foto Kenangan Wishlist"
            className="max-w-full max-h-[85dvh] rounded-lg border-8 border-[#FBF8F2] shadow-2xl object-contain"
          />
        </div>
      )}
    </EditorialSectionShell>
  );
}
