import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Eye,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  AccessConfig,
  CanonicalWishlistVisibility,
  WISHLIST_CATEGORY_META,
  WISHLIST_STATUS_META,
  WISHLIST_VISIBILITY_META,
  WishlistCategory,
  WishlistEntry,
  WishlistStatus,
  WishlistVisibility,
  normalizeWishlistVisibility,
} from '../../data/wishlist';
import { useFirebaseAuth } from '../../lib/FirebaseProvider';
import {
  createWishlistEntry,
  deleteWishlistEntry,
  saveAccessConfig,
  subscribeWishlistEntries,
  updateWishlistEntry,
  updateWishlistVisibility,
} from '../../utils/adminApi';
import { canViewWishlistEntry, filterWishlistEntries } from '../../utils/wishlist';
import { formatSafeUiError } from '../../utils/safeError';
import { WishFormModal } from '../wishlist/WishFormModal';

type PreviewAudience = 'admin' | 'public' | 'couple';

export function WishlistManager() {
  const { user, accessConfig, refreshAccessConfig } = useFirebaseAuth();

  const [wulanEmail, setWulanEmail] = useState(accessConfig.wulanEmail || '');
  const [privacyMode, setPrivacyMode] = useState<'couple-only' | 'admin-only'>(
    accessConfig.wishlistPrivacyMode
  );
  const [savingAccess, setSavingAccess] = useState(false);
  const [accessStatus, setAccessStatus] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<WishlistCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<WishlistStatus | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] =
    useState<CanonicalWishlistVisibility | 'all'>('all');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'oktaf' | 'wulan'>('all');
  const [previewAudience, setPreviewAudience] = useState<PreviewAudience>('admin');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WishlistEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [listError, setListError] = useState('');

  useEffect(() => {
    setWulanEmail(accessConfig.wulanEmail || '');
    setPrivacyMode(accessConfig.wishlistPrivacyMode);
  }, [accessConfig]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub = subscribeWishlistEntries(
      user.email,
      'oktaf',
      (items) => setEntries(items),
      (err) =>
        setListError(formatSafeUiError(err, 'Gagal memuat daftar wishlist.', 'admin'))
    );
    return () => unsub();
  }, [user?.email]);

  const visible = useMemo(() => {
    const filtered = filterWishlistEntries(entries, categoryFilter, statusFilter, {
      visibility: visibilityFilter,
      creatorRole: creatorFilter,
    });
    if (previewAudience === 'public') {
      return filtered.filter((item) => canViewWishlistEntry(item, null, null));
    }
    if (previewAudience === 'couple') {
      return filtered.filter((item) =>
        canViewWishlistEntry(item, accessConfig.wulanEmail || user?.email, 'wulan')
      );
    }
    return filtered;
  }, [
    entries,
    categoryFilter,
    statusFilter,
    visibilityFilter,
    creatorFilter,
    previewAudience,
    accessConfig.wulanEmail,
    user?.email,
  ]);

  const handleSavePrivacy = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAccess(true);
    setAccessStatus(null);
    try {
      const saved: AccessConfig = await saveAccessConfig({
        wulanEmail,
        wishlistPrivacyMode: privacyMode,
      });
      await refreshAccessConfig();
      setAccessStatus({
        type: 'ok',
        text: saved.wulanEmail
          ? `Akses Wulan (${saved.wulanEmail}) dan mode privasi berhasil diperbarui.`
          : 'Pengaturan privasi Our Future Wishlist & Postcards berhasil diperbarui.',
      });
    } catch (err) {
      setAccessStatus({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menyimpan pengaturan akses.', 'admin'),
      });
    } finally {
      setSavingAccess(false);
    }
  };

  const handleQuickVisibility = async (id: string, nextVis: WishlistVisibility) => {
    setListError('');
    try {
      await updateWishlistVisibility(id, nextVis);
    } catch (err) {
      setListError(
        formatSafeUiError(err, 'Gagal memperbarui visibilitas.', 'admin')
      );
    }
  };

  const handleDelete = async (id: string) => {
    setListError('');
    try {
      await deleteWishlistEntry(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setListError(
        formatSafeUiError(err, 'Gagal menghapus wishlist.', 'admin')
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Privacy & Couple Access Configuration */}
      <form
        onSubmit={handleSavePrivacy}
        className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#38271F] inline-flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#455342]" />
              <span>Privasi & Akses Akun Pasangan</span>
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5">
              Tentukan email akun Google Wulan agar dapat melihat catatan private/shared di Wishlist maupun Postcards From The Future.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingAccess}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold hover:bg-[#384435] disabled:opacity-50 cursor-pointer shrink-0"
          >
            {savingAccess ? 'Menyimpan...' : 'Simpan Pengaturan Akses'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">
              Email Akun Google Wulan (Yang Diizinkan)
            </span>
            <input
              type="email"
              value={wulanEmail}
              onChange={(e) => setWulanEmail(e.target.value)}
              placeholder="contoh: wulan@gmail.com"
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Mode Akses Pasangan</span>
            <select
              value={privacyMode}
              onChange={(e) =>
                setPrivacyMode(e.target.value as 'couple-only' | 'admin-only')
              }
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            >
              <option value="couple-only">
                Khusus Berdua (Oktaf + Email Wulan di atas)
              </option>
              <option value="admin-only">
                Hanya Admin (Oktaf saja sementara waktu)
              </option>
            </select>
          </label>
        </div>

        {accessStatus && (
          <p
            role="status"
            className={`rounded-xl px-3.5 py-2.5 text-xs font-medium ${
              accessStatus.type === 'ok'
                ? 'bg-[#455342]/12 text-[#455342]'
                : 'bg-[#A6533B]/12 text-[#A6533B]'
            }`}
          >
            {accessStatus.text}
          </p>
        )}
      </form>

      {/* Entries Moderation & Preview Controls */}
      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#38271F]">
              Daftar Wishlist Tersimpan ({entries.length})
            </h3>
            <p className="text-xs text-[#38271F]/70">
              Filter berdasarkan pemilik, kategori, status, atau visibilitas, lalu ubah antara Public / Private / Shared kapan saja.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingEntry(null);
              setModalOpen(true);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#4e382d] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Impian (Admin)</span>
          </button>
        </div>

        {/* Preview Audience Switch */}
        <div className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/70 p-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#38271F] inline-flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#743D4A]" />
            <span>Mode Pratinjau Tampilan:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['admin', 'Semua (Admin)'],
                ['public', 'Pengunjung (Public saja)'],
                ['couple', 'Pasangan (Oktaf & Wulan)'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreviewAudience(mode)}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                  previewAudience === mode
                    ? 'bg-[#38271F] text-[#F4EBDD]'
                    : 'bg-[#FBF6EE] border border-[#38271F]/16 text-[#38271F]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', 'Semua Kategori'],
                ['your', 'Your Wishes (Oktaf)'],
                ['her', 'Her Wishes (Wulan)'],
                ['our', 'Our Wishes (Bersama)'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setCategoryFilter(val)}
                className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold cursor-pointer ${
                  categoryFilter === val
                    ? 'bg-[#A6533B] text-[#F4EBDD]'
                    : 'bg-[#F4EBDD] border border-[#38271F]/16 text-[#38271F]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#743D4A]">Pembuat:</span>
              {(
                [
                  ['all', 'Semua'],
                  ['oktaf', 'Oktaf'],
                  ['wulan', 'Wulan'],
                ] as const
              ).map(([creator, label]) => (
                <button
                  key={creator}
                  type="button"
                  onClick={() => setCreatorFilter(creator)}
                  className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                    creatorFilter === creator
                      ? 'bg-[#38271F] text-[#F4EBDD]'
                      : 'bg-[#F4EBDD]/70 border border-[#38271F]/14 text-[#38271F]/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#743D4A]">Visibilitas:</span>
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
                  className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                    visibilityFilter === vis
                      ? 'bg-[#455342] text-[#F4EBDD]'
                      : 'bg-[#F4EBDD]/70 border border-[#38271F]/14 text-[#38271F]/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-[#743D4A]">Status:</span>
              {(
                [
                  ['all', 'Semua'],
                  ['dreaming', 'Dreaming'],
                  ['planned', 'Planned'],
                  ['in_progress', 'In Progress'],
                  ['completed', 'Completed'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStatusFilter(val)}
                  className={`min-h-[34px] px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                    statusFilter === val
                      ? 'bg-[#743D4A] text-[#F4EBDD]'
                      : 'bg-[#F4EBDD]/70 border border-[#38271F]/14 text-[#38271F]/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {listError && (
          <p role="alert" className="text-xs text-[#A6533B] font-medium">
            {listError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((entry) => {
          const catMeta = WISHLIST_CATEGORY_META[entry.category];
          const stMeta = WISHLIST_STATUS_META[entry.status];
          const canonicalVis = normalizeWishlistVisibility(entry.visibility);
          return (
            <article
              key={entry.id}
              className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 shadow-polaroid flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#743D4A]">
                    {catMeta.label} · {stMeta.label}
                  </p>
                  <span className="text-[11px] text-[#38271F]/60">
                    {entry.creatorName} ({entry.creatorEmail})
                  </span>
                </div>

                <h4 className="font-serif text-base font-semibold text-[#38271F]">
                  {entry.title}
                </h4>

                {entry.description && (
                  <p className="text-xs text-[#38271F]/75 line-clamp-3">
                    {entry.description}
                  </p>
                )}

                {entry.completionStory && (
                  <p className="rounded-lg bg-[#455342]/10 p-2 text-xs text-[#455342] flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{entry.completionStory}</span>
                  </p>
                )}

                {entry.photos.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                    {entry.photos.map((url, idx) => (
                      <img
                        key={`${url}-${idx}`}
                        src={url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover border border-[#38271F]/15 shrink-0"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-[#38271F]/10 flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 text-[11px] text-[#38271F]">
                  <span className="font-semibold">Visibilitas:</span>
                  <select
                    value={canonicalVis}
                    onChange={(e) =>
                      handleQuickVisibility(entry.id, e.target.value as WishlistVisibility)
                    }
                    className="min-h-[34px] rounded-lg border border-[#38271F]/20 bg-[#F4EBDD] px-2 text-[11px] font-medium text-[#38271F]"
                  >
                    {(['public', 'private', 'shared'] as CanonicalWishlistVisibility[]).map((v) => (
                      <option key={v} value={v}>
                        {WISHLIST_VISIBILITY_META[v].shortLabel}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-center gap-1.5">
                  {entry.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() =>
                        updateWishlistEntry(
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
                            visibility: entry.visibility,
                          },
                          'oktaf'
                        )
                      }
                      className="min-h-[36px] px-2.5 rounded-lg bg-[#455342]/12 text-[#455342] text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Selesai</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntry(entry);
                      setModalOpen(true);
                    }}
                    className="min-h-[36px] px-2.5 rounded-lg border border-[#38271F]/18 text-[11px] font-semibold text-[#38271F] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  {confirmDeleteId === entry.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="min-h-[36px] px-2.5 rounded-lg bg-[#A6533B] text-[#F4EBDD] text-[11px] font-semibold cursor-pointer"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[36px] px-2 rounded-lg border border-[#38271F]/20 text-[11px] cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(entry.id)}
                      aria-label={`Hapus ${entry.title}`}
                      className="min-h-[36px] px-2.5 rounded-lg text-[11px] font-semibold text-[#A6533B] hover:bg-[#A6533B]/10 cursor-pointer"
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

      {modalOpen && (
        <WishFormModal
          mode={editingEntry ? 'edit' : 'create'}
          initialEntry={editingEntry}
          defaultRole="oktaf"
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
                'oktaf'
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
