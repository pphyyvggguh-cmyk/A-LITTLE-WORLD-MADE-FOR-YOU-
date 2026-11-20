import { ChangeEvent, FormEvent, useEffect, useId, useState } from 'react';
import { Camera, Trash2, X } from 'lucide-react';
import {
  POSTCARD_DESIGN_META,
  POSTCARD_RECIPIENT_META,
  POSTCARD_STAMP_META,
  POSTCARD_VISIBILITY_META,
  PostcardDesignTheme,
  PostcardEnvelope,
  PostcardRecipient,
  PostcardStampStyle,
  PostcardVisibility,
} from '../../data/postcards';
import { fetchPostcardSecret, uploadPostcardPhoto } from '../../utils/adminApi';
import { validatePostcardInput } from '../../utils/postcards';
import { formatSafeUiError } from '../../utils/safeError';

interface PostcardFormModalProps {
  mode: 'create' | 'edit';
  initialEnvelope?: PostcardEnvelope | null;
  defaultRole: 'oktaf' | 'wulan';
  nextOrder?: number;
  onClose: () => void;
  onSubmit: (payload: {
    id: string;
    title: string;
    recipient: PostcardRecipient;
    visibility: PostcardVisibility;
    unlockAtIso: string;
    location: string;
    stampStyle: PostcardStampStyle;
    designTheme: PostcardDesignTheme;
    message: string;
    photoUrl: string;
    order: number;
    updateSecret: boolean;
  }) => Promise<void>;
}

function toLocalDateTimeInput(iso: string | undefined): string {
  const base = iso ? new Date(iso) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (!Number.isFinite(base.getTime())) {
    return toLocalDateTimeInput(undefined);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(
    base.getHours()
  )}:${pad(base.getMinutes())}`;
}

export function PostcardFormModal({
  mode,
  initialEnvelope,
  defaultRole,
  nextOrder = 1,
  onClose,
  onSubmit,
}: PostcardFormModalProps) {
  const photoInputId = useId();
  const [postcardId] = useState<string>(
    () =>
      initialEnvelope?.id ||
      `postcard-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  );

  const [title, setTitle] = useState(initialEnvelope?.title || '');
  const [recipient, setRecipient] = useState<PostcardRecipient>(
    initialEnvelope?.recipient || (defaultRole === 'oktaf' ? 'wulan' : 'oktaf')
  );
  const [visibility, setVisibility] = useState<PostcardVisibility>(
    initialEnvelope?.visibility || 'private'
  );
  const [unlockLocal, setUnlockLocal] = useState<string>(() =>
    toLocalDateTimeInput(initialEnvelope?.unlockAt)
  );
  const [location, setLocation] = useState(initialEnvelope?.location || '');
  const [stampStyle, setStampStyle] = useState<PostcardStampStyle>(
    initialEnvelope?.stampStyle || 'par_avion'
  );
  const [designTheme, setDesignTheme] = useState<PostcardDesignTheme>(
    initialEnvelope?.designTheme || 'vintage_cream'
  );
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [secretEditable, setSecretEditable] = useState(mode === 'create');
  const [loadingSecret, setLoadingSecret] = useState(mode === 'edit');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit' || !initialEnvelope) return;
    let active = true;
    setLoadingSecret(true);
    fetchPostcardSecret(initialEnvelope.id)
      .then((secret) => {
        if (!active) return;
        if (secret) {
          setMessage(secret.message);
          setPhotoUrl(secret.photoUrl);
          setSecretEditable(true);
        } else {
          setSecretEditable(false);
        }
      })
      .finally(() => {
        if (active) setLoadingSecret(false);
      });

    return () => {
      active = false;
    };
  }, [mode, initialEnvelope]);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploadingPhoto(true);
    setUploadProgress(0);
    try {
      const url = await uploadPostcardPhoto(postcardId, file, (pct) =>
        setUploadProgress(pct)
      );
      setPhotoUrl(url);
    } catch (err) {
      setError(
        formatSafeUiError(err, 'Gagal mengunggah foto kartu pos.', 'public')
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = new Date(unlockLocal);
    const unlockAtIso = Number.isFinite(parsed.getTime()) ? parsed.toISOString() : '';

    const check = validatePostcardInput({
      title,
      recipient,
      visibility,
      unlockAtIso,
      location,
      stampStyle,
      designTheme,
      message: secretEditable ? message : 'placeholder-locked-secret',
      photoUrl: secretEditable ? photoUrl : '',
    });

    if (!check.ok) {
      setError(check.error);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        id: postcardId,
        title: title.trim(),
        recipient,
        visibility,
        unlockAtIso,
        location: location.trim(),
        stampStyle,
        designTheme,
        message: message.trim(),
        photoUrl: photoUrl.trim(),
        order: initialEnvelope?.order ?? nextOrder,
        updateSecret: secretEditable,
      });
      onClose();
    } catch (err) {
      setError(
        formatSafeUiError(err, 'Kartu pos belum berhasil disimpan. Coba lagi sebentar ya.', 'public')
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
      aria-labelledby="postcard-modal-title"
    >
      <div className="relative w-full sm:max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-[#38271F]/20 bg-[#FBF6EE] p-5 sm:p-6 shadow-polaroid-lifted scrapbook-scroll">
        <span
          aria-hidden="true"
          className="washi-tape-gold hidden sm:block absolute -top-2.5 left-10 w-20 h-4 -rotate-2"
        />

        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#38271F]/12">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#743D4A] font-semibold">
              {mode === 'create' ? 'Tulis Kartu Pos Masa Depan' : 'Sunting Kartu Pos'}
            </p>
            <h2
              id="postcard-modal-title"
              className="font-serif text-xl sm:text-2xl font-semibold text-[#38271F]"
            >
              Postcards From The Future ♡
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir kartu pos"
            className="min-w-[42px] min-h-[42px] rounded-xl border border-[#38271F]/15 bg-[#F4EBDD] flex items-center justify-center text-[#38271F] hover:bg-[#EAE0CF] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">
              Judul / Sampul Kartu Pos *
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="Contoh: Untuk Wulan di Ulang Tahun Berikutnya ♡"
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3.5 text-sm text-[#38271F]"
              required
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Penerima</span>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value as PostcardRecipient)}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F]"
              >
                {(['wulan', 'oktaf', 'both'] as PostcardRecipient[]).map((rec) => (
                  <option key={rec} value={rec}>
                    {POSTCARD_RECIPIENT_META[rec].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Visibilitas</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as PostcardVisibility)}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F]"
              >
                {(['private', 'shared', 'public'] as PostcardVisibility[]).map((vis) => (
                  <option key={vis} value={vis}>
                    {POSTCARD_VISIBILITY_META[vis].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">
                Tanggal & Waktu Buka *
              </span>
              <input
                type="datetime-local"
                value={unlockLocal}
                onChange={(e) => setUnlockLocal(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F]"
                required
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">
                Kota / Cap Pos (Opsional)
              </span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={120}
                placeholder="Contoh: Bandung · Musim Hujan"
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3.5 text-sm text-[#38271F]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Tema Kertas</span>
              <select
                value={designTheme}
                onChange={(e) => setDesignTheme(e.target.value as PostcardDesignTheme)}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F]"
              >
                {(Object.keys(POSTCARD_DESIGN_META) as PostcardDesignTheme[]).map((theme) => (
                  <option key={theme} value={theme}>
                    {POSTCARD_DESIGN_META[theme].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Motif Perangko</span>
              <select
                value={stampStyle}
                onChange={(e) => setStampStyle(e.target.value as PostcardStampStyle)}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3 text-sm text-[#38271F]"
              >
                {(Object.keys(POSTCARD_STAMP_META) as PostcardStampStyle[]).map((st) => (
                  <option key={st} value={st}>
                    {POSTCARD_STAMP_META[st].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loadingSecret ? (
            <p className="rounded-xl bg-[#F4EBDD]/80 px-4 py-3 text-xs text-[#38271F]/70">
              Memeriksa isi pesan tersegel...
            </p>
          ) : secretEditable ? (
            <>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[#38271F]">
                  Isi Pesan Tulisan Tangan (Tersegel hingga Waktu Buka) *
                </span>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={4000}
                  placeholder="Tulis pesan hangat yang baru boleh dibaca saat waktunya tiba..."
                  className="w-full rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 p-3 font-hand text-xl text-[#38271F] leading-relaxed"
                  required
                />
              </label>

              {/* Optional Photo Upload */}
              <div className="rounded-xl border border-[#38271F]/14 bg-[#F4EBDD]/60 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#38271F]">
                    Foto Kenangan Opsional (Ikut Tersegel)
                  </span>
                  <div className="flex items-center gap-2">
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="min-h-[38px] px-2.5 rounded-lg text-xs text-[#A6533B] hover:bg-[#A6533B]/10 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                    <label
                      htmlFor={photoInputId}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        uploadingPhoto ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>
                        {uploadingPhoto
                          ? `Mengunggah ${uploadProgress}%...`
                          : photoUrl
                            ? 'Ganti Foto'
                            : 'Unggah Foto'}
                      </span>
                    </label>
                    <input
                      id={photoInputId}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="sr-only"
                    />
                  </div>
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

                {photoUrl && (
                  <div className="w-28 bg-[#FBF8F2] p-1.5 pb-4 border border-[#38271F]/14 shadow-polaroid -rotate-1">
                    <img
                      src={photoUrl}
                      alt="Pratinjau foto kartu pos"
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-[#743D4A]/25 bg-[#743D4A]/8 px-4 py-3 text-xs text-[#743D4A] leading-relaxed">
              Isi surat dan foto untuk kartu pos ini masih tersegel rapat hingga tanggal bukanya tiba. Kamu hanya dapat mengubah sampul dan pengaturan waktunya.
            </p>
          )}

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
                ? 'Menyegel & Menyimpan...'
                : mode === 'create'
                  ? 'Segel & Kirim ke Masa Depan ♡'
                  : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
