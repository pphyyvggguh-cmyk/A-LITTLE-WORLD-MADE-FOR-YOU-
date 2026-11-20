import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Heart,
  ImagePlus,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import {
  DEFAULT_HEART_GALLERY_PHOTOS,
  HEART_GALLERY_THEMES,
  HeartGalleryPhoto,
  HeartGalleryTheme,
} from '../../data/quests';
import {
  MediaAssetItem,
  createHeartGalleryPhoto,
  deleteHeartGalleryPhoto,
  reorderHeartGalleryPhotos,
  updateHeartGalleryPhoto,
} from '../../utils/adminApi';
import { SiteContentPayload } from '../../utils/adminContent';
import {
  normalizeHeartGalleryOrder,
  reorderHeartGalleryPhoto,
} from '../../utils/quests';
import { formatSafeUiError } from '../../utils/safeError';
import { HeartGalleryCanvas } from '../quests/HeartGalleryModal';
import { MediaPickerControl } from './MediaPickerControl';

interface HeartGalleryManagerProps {
  photos: HeartGalleryPhoto[];
  mediaAssets: MediaAssetItem[];
  onSaved: (payload: SiteContentPayload) => void;
  onMediaRefresh: () => Promise<void>;
}

export function HeartGalleryManager({
  photos,
  mediaAssets,
  onSaved,
  onMediaRefresh,
}: HeartGalleryManagerProps) {
  const effectiveSource =
    photos.length > 0 ? photos : DEFAULT_HEART_GALLERY_PHOTOS;

  const [draft, setDraft] = useState<HeartGalleryPhoto[]>(() =>
    normalizeHeartGalleryOrder(effectiveSource)
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => normalizeHeartGalleryOrder(effectiveSource)[0]?.id ?? null
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHeartPreview, setShowHeartPreview] = useState(false);

  // Add New Photo form state
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newDateLabel, setNewDateLabel] = useState('');
  const [newTheme, setNewTheme] = useState<HeartGalleryTheme>('flowers');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    const source = photos.length > 0 ? photos : DEFAULT_HEART_GALLERY_PHOTOS;
    const normalized = normalizeHeartGalleryOrder(source);
    setDraft(normalized);
    if (
      normalized.length > 0 &&
      !normalized.some((item) => item.id === selectedId)
    ) {
      setSelectedId(normalized[0].id);
    }
  }, [photos]);

  const orderedDraft = normalizeHeartGalleryOrder(draft);
  const current =
    orderedDraft.find((p) => p.id === selectedId) ?? orderedDraft[0] ?? null;

  const updateCurrentDraft = (patch: Partial<HeartGalleryPhoto>) => {
    if (!current) return;
    setDraft((prev) =>
      prev.map((item) =>
        item.id === current.id
          ? { ...item, ...patch, updatedAt: new Date().toISOString() }
          : item
      )
    );
    setStatus(null);
  };

  const handleAddPhoto = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!newImageUrl.trim()) {
      setStatus({
        type: 'err',
        text: 'Pilih atau unggah foto terlebih dahulu sebelum menambahkan ke Heart Gallery.',
      });
      return;
    }
    if (!newCaption.trim()) {
      setStatus({
        type: 'err',
        text: 'Caption foto wajib diisi ya.',
      });
      return;
    }

    setBusy(true);
    try {
      const updated = await createHeartGalleryPhoto({
        imageUrl: newImageUrl.trim(),
        caption: newCaption.trim(),
        dateLabel: newDateLabel.trim(),
        theme: newTheme,
        order: orderedDraft.length + 1,
      });
      onSaved(updated);
      await onMediaRefresh();
      setNewImageUrl('');
      setNewCaption('');
      setNewDateLabel('');
      setNewTheme('flowers');
      setShowAddForm(false);
      setStatus({
        type: 'ok',
        text: 'Foto baru berhasil ditambahkan ke Our Little Heart Gallery ♡',
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: formatSafeUiError(
          err,
          'Gagal menambahkan foto ke Heart Gallery.',
          'admin'
        ),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCurrent = async () => {
    if (!current) return;
    setStatus(null);
    setBusy(true);
    try {
      const updated = await updateHeartGalleryPhoto(current.id, {
        imageUrl: current.imageUrl,
        storagePath: current.storagePath,
        caption: current.caption,
        dateLabel: current.dateLabel,
        theme: current.theme,
        order: current.order,
        isPublished: current.isPublished !== false,
      });
      onSaved(updated);
      await onMediaRefresh();
      setStatus({
        type: 'ok',
        text: `Foto #${current.order} "${current.caption}" berhasil diperbarui.`,
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal memperbarui foto Heart Gallery.', 'admin'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReorder = async (id: string, dir: 'up' | 'down') => {
    const reordered = reorderHeartGalleryPhoto(orderedDraft, id, dir);
    setDraft(reordered);
    setStatus(null);
    setBusy(true);
    try {
      const updated = await reorderHeartGalleryPhotos(reordered);
      onSaved(updated);
      setStatus({
        type: 'ok',
        text: 'Urutan foto di susunan hati berhasil diperbarui.',
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal mengubah urutan Heart Gallery.', 'admin'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    setBusy(true);
    setStatus(null);
    try {
      const updated = await deleteHeartGalleryPhoto(photoId);
      setConfirmDeleteId(null);
      onSaved(updated);
      setStatus({
        type: 'ok',
        text: 'Foto berhasil dihapus dari Heart Gallery.',
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menghapus foto Heart Gallery.', 'admin'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5" data-testid="heart-gallery-manager">
      {/* Header & Actions */}
      <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#38271F] flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#A6533B] fill-[#E8BFC5]" />
              <span>Our Little Heart Gallery · {orderedDraft.length} Foto</span>
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5">
              Kelola foto kenangan yang membentuk susunan hati di hadiah Quest 3 (Find the Polaroids). Unggah dari HP, ganti foto tertentu, pilih 6 tema hiasan, atau atur urutan tampil.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowHeartPreview((v) => !v)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#38271F]/20 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#743D4A]" />
              <span>{showHeartPreview ? 'Tutup Pratinjau Hati' : 'Pratinjau Susunan Hati'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAddForm((v) => !v);
                setStatus(null);
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#384435] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Tutup Form Tambah' : 'Tambah Foto Baru'}</span>
            </button>
          </div>
        </div>

        {status && (
          <p
            role="status"
            className={`rounded-xl px-3.5 py-2.5 text-xs font-medium ${
              status.type === 'ok'
                ? 'bg-[#455342]/12 text-[#455342]'
                : 'bg-[#A6533B]/12 text-[#A6533B]'
            }`}
          >
            {status.text}
          </p>
        )}

        {/* Live Heart Shape Preview */}
        {showHeartPreview && (
          <div className="rounded-2xl border border-[#C4A574]/40 bg-[#F4EBDD]/60 p-4">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-[#743D4A] text-center mb-2">
              Pratinjau Langsung Susunan Hati ({orderedDraft.filter((p) => p.isPublished !== false).length} foto aktif)
            </p>
            <HeartGalleryCanvas
              photos={orderedDraft}
              compact
              onSelectPhoto={(photo) => setSelectedId(photo.id)}
            />
          </div>
        )}

        {/* Add New Photo Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddPhoto}
            className="rounded-xl border border-[#455342]/25 bg-[#F4EBDD]/65 p-4 space-y-3"
          >
            <h3 className="font-serif text-base font-semibold text-[#38271F] flex items-center gap-1.5">
              <ImagePlus className="w-4 h-4 text-[#455342]" />
              <span>Tambah Foto Baru ke Susunan Hati</span>
            </h3>

            <MediaPickerControl
              label="Pilih atau Unggah Foto"
              kind="image"
              category="images"
              currentUrl={newImageUrl}
              mediaAssets={mediaAssets}
              onChangeUrl={(url) => setNewImageUrl(url)}
              onMediaRefresh={onMediaRefresh}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[#38271F]">Caption Foto *</span>
                <input
                  type="text"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  maxLength={180}
                  placeholder="Contoh: Sore hangat di sudut kota favorit"
                  className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-3 text-sm text-[#38271F]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[#38271F]">
                  Label Tanggal / Momen (Opsional)
                </span>
                <input
                  type="text"
                  value={newDateLabel}
                  onChange={(e) => setNewDateLabel(e.target.value)}
                  maxLength={60}
                  placeholder="Contoh: Mei 2026"
                  className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-3 text-sm text-[#38271F]"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#38271F]">
                Tema Bingkai Polaroid
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HEART_GALLERY_THEMES.map((t) => {
                  const selected = newTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewTheme(t.id)}
                      style={{ backgroundColor: selected ? t.bgTint : undefined }}
                      className={`min-h-[44px] rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#A6533B] ring-1 ring-[#A6533B]/35 font-semibold'
                          : 'border-[#38271F]/16 bg-[#FBF6EE] hover:bg-[#EAE0CF]/60'
                      }`}
                    >
                      <span className="block text-xs text-[#38271F]">{t.label}</span>
                      <span className="block text-[10px] text-[#38271F]/62 truncate">
                        {t.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="min-h-[42px] px-3.5 rounded-xl border border-[#38271F]/20 text-xs font-semibold text-[#38271F] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[42px] px-4 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#4e382d] disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{busy ? 'Menambahkan...' : 'Tambahkan ke Heart Gallery'}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Split Photo List + Slot Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Ordered Photo List */}
        <section className="lg:col-span-5 rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-3 sm:p-4 shadow-polaroid space-y-2 max-h-[560px] overflow-y-auto scrapbook-scroll">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#743D4A] px-1">
            Daftar Foto Berurutan ({orderedDraft.length})
          </p>

          {orderedDraft.map((item, idx) => {
            const selected = current?.id === item.id;
            const themeMeta =
              HEART_GALLERY_THEMES.find((t) => t.id === item.theme) ??
              HEART_GALLERY_THEMES[5];

            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${
                  selected
                    ? 'bg-[#EAE0CF]/80 border-[#38271F]/35'
                    : 'bg-[#F4EBDD]/55 border-[#38271F]/12'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="flex-1 min-w-0 flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.caption}
                    className="w-11 h-11 rounded-md object-cover bg-[#EAE0CF] border border-[#38271F]/12 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#38271F] truncate">
                      #{item.order} · {item.caption}
                    </p>
                    <p className="text-[11px] text-[#743D4A] truncate">
                      {themeMeta.label}
                      {item.dateLabel ? ` · ${item.dateLabel}` : ''}
                      {item.isPublished === false ? ' · Disembunyikan' : ''}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={busy || idx === 0}
                    onClick={() => handleReorder(item.id, 'up')}
                    aria-label={`Naikkan posisi ${item.caption}`}
                    className="min-w-[36px] min-h-[36px] rounded-lg border border-[#38271F]/16 flex items-center justify-center text-[#38271F] disabled:opacity-30 hover:bg-[#FBF6EE] cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || idx === orderedDraft.length - 1}
                    onClick={() => handleReorder(item.id, 'down')}
                    aria-label={`Turunkan posisi ${item.caption}`}
                    className="min-w-[36px] min-h-[36px] rounded-lg border border-[#38271F]/16 flex items-center justify-center text-[#38271F] disabled:opacity-30 hover:bg-[#FBF6EE] cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Active Slot Editor */}
        <section className="lg:col-span-7 rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4">
          {!current ? (
            <p className="text-sm text-[#38271F]/70 text-center py-8">
              Belum ada foto dipilih. Tambahkan foto baru atau pilih dari daftar di samping.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#743D4A]">
                    Slot #{current.order}
                  </p>
                  <h3 className="font-serif text-lg font-semibold text-[#38271F]">
                    Edit & Ganti Foto
                  </h3>
                </div>

                {confirmDeleteId === current.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(current.id)}
                      className="min-h-[40px] px-3 rounded-xl bg-[#A6533B] text-[#F4EBDD] text-xs font-semibold cursor-pointer"
                    >
                      Ya, Hapus Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="min-h-[40px] px-2.5 rounded-xl border border-[#38271F]/20 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(current.id)}
                    className="min-h-[40px] px-3 rounded-xl text-xs font-semibold text-[#A6533B] hover:bg-[#A6533B]/10 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>

              <MediaPickerControl
                label="Foto Polaroid Slot Ini (Unggah Pengganti atau Pilih dari Pustaka)"
                kind="image"
                category="images"
                currentUrl={current.imageUrl}
                mediaAssets={mediaAssets}
                onChangeUrl={(url) => updateCurrentDraft({ imageUrl: url })}
                onMediaRefresh={onMediaRefresh}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-[#38271F]">Caption Foto</span>
                  <input
                    type="text"
                    value={current.caption}
                    onChange={(e) => updateCurrentDraft({ caption: e.target.value })}
                    maxLength={180}
                    className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-[#38271F]">
                    Label Tanggal / Momen
                  </span>
                  <input
                    type="text"
                    value={current.dateLabel || ''}
                    onChange={(e) => updateCurrentDraft({ dateLabel: e.target.value })}
                    maxLength={60}
                    className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#38271F]">
                  Tema Hiasan Bingkai
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {HEART_GALLERY_THEMES.map((t) => {
                    const selected = current.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateCurrentDraft({ theme: t.id })}
                        style={{ backgroundColor: selected ? t.bgTint : undefined }}
                        className={`min-h-[44px] rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#A6533B] ring-1 ring-[#A6533B]/35 font-semibold'
                            : 'border-[#38271F]/16 bg-[#F4EBDD]/50 hover:bg-[#EAE0CF]/60'
                        }`}
                      >
                        <span className="block text-xs text-[#38271F]">{t.label}</span>
                        <span className="block text-[10px] text-[#38271F]/62 truncate">
                          {t.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-medium text-[#38271F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={current.isPublished !== false}
                  onChange={(e) =>
                    updateCurrentDraft({ isPublished: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#455342]"
                />
                <span>Tampilkan foto ini di susunan hati untuk Wulan</span>
              </label>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSaveCurrent}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{busy ? 'Menyimpan...' : 'Simpan Perubahan Foto Ini'}</span>
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
