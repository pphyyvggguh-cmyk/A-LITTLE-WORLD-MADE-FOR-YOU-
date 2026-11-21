import { ChangeEvent, FormEvent, useId, useState } from 'react';
import { Camera, Sparkles, Trash2, X } from 'lucide-react';
import {
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
import { uploadWishlistPhoto } from '../../utils/adminApi';
import { validateWishlistFormInput } from '../../utils/wishlist';
import { formatSafeUiError } from '../../utils/safeError';
import { CloudMediaImg } from '../CloudMediaImg';

interface WishFormModalProps {
  mode: 'create' | 'edit';
  initialEntry?: WishlistEntry | null;
  defaultRole: 'oktaf' | 'wulan';
  onClose: () => void;
  onSubmit: (payload: {
    id: string;
    title: string;
    description: string;
    category: WishlistCategory;
    targetDate: string;
    status: WishlistStatus;
    photos: string[];
    completionStory: string;
    visibility: WishlistVisibility;
  }) => Promise<void>;
}

export function WishFormModal({
  mode,
  initialEntry,
  defaultRole,
  onClose,
  onSubmit,
}: WishFormModalProps) {
  const photoInputId = useId();
  const [wishId] = useState<string>(
    () =>
      initialEntry?.id ||
      `wish-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [description, setDescription] = useState(initialEntry?.description || '');
  const [category, setCategory] = useState<WishlistCategory>(
    initialEntry?.category || (defaultRole === 'oktaf' ? 'our' : 'her')
  );
  const [visibility, setVisibility] = useState<CanonicalWishlistVisibility>(
    initialEntry ? normalizeWishlistVisibility(initialEntry.visibility) : 'private'
  );
  const [targetDate, setTargetDate] = useState(initialEntry?.targetDate || '');
  const [status, setStatus] = useState<WishlistStatus>(
    initialEntry?.status || 'dreaming'
  );
  const [photos, setPhotos] = useState<string[]>(initialEntry?.photos || []);
  const [completionStory, setCompletionStory] = useState(
    initialEntry?.completionStory || ''
  );

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isLockedTerminalNonAdmin =
    mode === 'edit' &&
    defaultRole !== 'oktaf' &&
    initialEntry?.status === 'completed';

  const canChangeVisibility =
    !isLockedTerminalNonAdmin &&
    (defaultRole === 'oktaf' || mode === 'create' || initialEntry?.creatorRole === defaultRole);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (photos.length >= 6) {
      setError('Maksimal 6 foto per kartu impian.');
      return;
    }

    setError('');
    setUploadingPhoto(true);
    setUploadProgress(0);
    try {
      const url = await uploadWishlistPhoto(wishId, file, (pct) =>
        setUploadProgress(pct)
      );
      setPhotos((prev) => [...prev, url]);
    } catch (err) {
      setError(
        formatSafeUiError(err, 'Foto belum berhasil diunggah. Coba lagi sebentar ya.', 'public')
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const check = validateWishlistFormInput({
      title,
      description,
      category,
      targetDate,
      status,
      photos,
      completionStory,
      visibility,
    });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        id: wishId,
        title: title.trim(),
        description: description.trim(),
        category,
        targetDate: targetDate.trim(),
        status,
        photos,
        completionStory: completionStory.trim(),
        visibility,
      });
      onClose();
    } catch (err) {
      setError(
        formatSafeUiError(err, 'Catatan impian belum berhasil disimpan. Coba lagi sebentar ya.', 'public')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1B130F]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wish-modal-title"
    >
      <div className="relative w-full sm:max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-[#38271F]/20 bg-[#FBF6EE] p-5 sm:p-6 shadow-polaroid-lifted scrapbook-scroll">
        <span
          aria-hidden="true"
          className="washi-tape-gold hidden sm:block absolute -top-2.5 left-10 w-20 h-4 -rotate-2"
        />

        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#38271F]/12">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#743D4A] font-semibold">
              {mode === 'create' ? 'Tulis Catatan Baru' : 'Sunting Catatan Impian'}
            </p>
            <h2
              id="wish-modal-title"
              className="font-serif text-xl sm:text-2xl font-semibold text-[#38271F]"
            >
              Our Future Wishlist ♡
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form wishlist"
            className="min-w-[42px] min-h-[42px] rounded-xl border border-[#38271F]/15 bg-[#F4EBDD] flex items-center justify-center text-[#38271F] hover:bg-[#EAE0CF] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLockedTerminalNonAdmin && (
          <p className="mt-3 rounded-xl bg-[#455342]/10 border border-[#455342]/25 px-3.5 py-2.5 text-xs text-[#455342]">
            Impian ini sudah tercapai ♡. Kamu tetap dapat menambahkan foto kenangan dan cerita pencapaian di bawah.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Judul Impian *</span>
            <input
              type="text"
              value={title}
              disabled={isLockedTerminalNonAdmin}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="Contoh: Menonton kembang api di Kyoto bersama"
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3.5 text-sm text-[#38271F] disabled:opacity-60"
              required
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Kategori</span>
              <select
                value={category}
                disabled={isLockedTerminalNonAdmin}
                onChange={(e) => setCategory(e.target.value as WishlistCategory)}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F] disabled:opacity-60"
              >
                {(['our', 'her', 'your'] as WishlistCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {WISHLIST_CATEGORY_META[cat].label} ({WISHLIST_CATEGORY_META[cat].badge})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Status Perjalanan</span>
              <select
                value={status}
                disabled={isLockedTerminalNonAdmin}
                onChange={(e) => setStatus(e.target.value as WishlistStatus)}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F] disabled:opacity-60"
              >
                {(['dreaming', 'planned', 'in_progress', 'completed'] as WishlistStatus[]).map(
                  (st) => (
                    <option key={st} value={st}>
                      {WISHLIST_STATUS_META[st].label}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Visibilitas Catatan</span>
              <select
                value={visibility}
                disabled={!canChangeVisibility}
                onChange={(e) => setVisibility(e.target.value as CanonicalWishlistVisibility)}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F] disabled:opacity-60"
              >
                {(['public', 'private', 'shared'] as CanonicalWishlistVisibility[]).map((vis) => (
                  <option key={vis} value={vis}>
                    {WISHLIST_VISIBILITY_META[vis].label}
                  </option>
                ))}
              </select>
              <span className="block text-[11px] text-[#38271F]/62">
                {WISHLIST_VISIBILITY_META[visibility].description}
              </span>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">
                Target Tanggal / Musim (Opsional)
              </span>
              <input
                type="text"
                value={targetDate}
                disabled={isLockedTerminalNonAdmin}
                onChange={(e) => setTargetDate(e.target.value)}
                maxLength={40}
                placeholder="Contoh: Musim Semi 2027"
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3.5 text-sm text-[#38271F] disabled:opacity-60"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Catatan / Cerita Impian</span>
            <textarea
              rows={3}
              value={description}
              disabled={isLockedTerminalNonAdmin}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="Ceritakan kenapa impian ini berarti bagi kita..."
              className="w-full rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 p-3 text-sm text-[#38271F] disabled:opacity-60"
            />
          </label>

          {/* Completion Story */}
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#455342] inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {status === 'completed'
                  ? 'Cerita Kenangan Setelah Tercapai ♡'
                  : 'Catatan Pencapaian (Opsional — Terutama Saat Completed)'}
              </span>
            </span>
            <textarea
              rows={3}
              value={completionStory}
              onChange={(e) => setCompletionStory(e.target.value)}
              maxLength={3000}
              placeholder="Bagaimana rasanya saat momen ini akhirnya terjadi?"
              className="w-full rounded-xl border border-[#455342]/25 bg-[#F4EBDD]/70 p-3 text-sm text-[#38271F]"
            />
          </label>

          {/* Photos Upload (Firebase Storage) */}
          <div className="rounded-xl border border-[#38271F]/14 bg-[#F4EBDD]/60 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#38271F]">
                Foto Impian / Kenangan ({photos.length}/6)
              </span>
              <label
                htmlFor={photoInputId}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  uploadingPhoto || photos.length >= 6 ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {uploadingPhoto ? `Mengunggah ${uploadProgress}%...` : 'Unggah Foto'}
                </span>
              </label>
              <input
                id={photoInputId}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto || photos.length >= 6}
                className="sr-only"
              />
            </div>

            {uploadingPhoto && (
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-[#38271F]/12 overflow-hidden">
                  <div
                    className="h-full bg-[#455342] transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#455342] font-medium tabular-nums">
                  Mengunggah foto: {uploadProgress}%
                </p>
              </div>
            )}

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-[#38271F]/15 bg-[#EAE0CF]"
                  >
                    <CloudMediaImg
                      src={url}
                      alt={`Foto wishlist ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      aria-label={`Hapus foto ${idx + 1}`}
                      className="absolute top-1 right-1 w-7 h-7 rounded-full bg-[#38271F]/85 text-[#F4EBDD] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-[#A6533B]/12 border border-[#A6533B]/30 px-3.5 py-2.5 text-xs font-medium text-[#A6533B]"
            >
              {error}
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#38271F]/20 text-xs font-semibold text-[#38271F] hover:bg-[#EAE0CF] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold hover:bg-[#384435] disabled:opacity-50 cursor-pointer"
            >
              {saving
                ? 'Menyimpan...'
                : mode === 'create'
                  ? 'Simpan ke Wishlist ♡'
                  : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
