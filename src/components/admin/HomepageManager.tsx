import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Eye,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  DEFAULT_HOMEPAGE_CONFIG,
  HOMEPAGE_TARGET_OPTIONS,
  HomepageChapterTarget,
  HomepageConfig,
  HomepageFeaturedMemory,
  HomepageHeroFrame,
} from '../../data/homepage';
import { MediaAssetItem, saveHomepageConfig } from '../../utils/adminApi';
import { SiteContentPayload } from '../../utils/adminContent';
import {
  normalizeHomepageConfig,
  reorderFeaturedMemory,
  swapHeroFrameMedia,
  validateHomepageConfig,
} from '../../utils/homepageContent';
import { formatSafeUiError } from '../../utils/safeError';
import { MediaPickerControl } from './MediaPickerControl';

interface HomepageManagerProps {
  homepage: HomepageConfig;
  mediaAssets: MediaAssetItem[];
  onSaved: (payload: SiteContentPayload) => void;
  onMediaRefresh: () => Promise<void>;
}

const TILT_OPTIONS: { id: HomepageFeaturedMemory['tiltClass']; label: string }[] = [
  { id: '-rotate-1', label: 'Miring Kiri (-1°)' },
  { id: 'rotate-0', label: 'Lurus (0°)' },
  { id: 'rotate-1', label: 'Miring Kanan (+1°)' },
];

export function HomepageManager({
  homepage,
  mediaAssets,
  onSaved,
  onMediaRefresh,
}: HomepageManagerProps) {
  const [draft, setDraft] = useState<HomepageConfig>(() =>
    normalizeHomepageConfig(homepage)
  );
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setDraft(normalizeHomepageConfig(homepage));
  }, [homepage]);

  const updateHeroFrame = (id: string, patch: Partial<HomepageHeroFrame>) => {
    setDraft((prev) => ({
      ...prev,
      heroFrames: prev.heroFrames.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
    setStatus(null);
  };

  const updateFeatured = (id: string, patch: Partial<HomepageFeaturedMemory>) => {
    setDraft((prev) => ({
      ...prev,
      featuredMemories: prev.featuredMemories.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    }));
    setStatus(null);
  };

  const handleSwapPolaroids = () => {
    setDraft((prev) => ({
      ...prev,
      heroFrames: swapHeroFrameMedia(prev.heroFrames, 'polaroid-top', 'polaroid-bottom'),
    }));
    setStatus(null);
  };

  const handleReorderFeatured = (id: string, dir: 'up' | 'down') => {
    setDraft((prev) => ({
      ...prev,
      featuredMemories: reorderFeaturedMemory(prev.featuredMemories, id, dir),
    }));
    setStatus(null);
  };

  const handleResetDefaults = () => {
    setDraft(structuredClone(DEFAULT_HOMEPAGE_CONFIG));
    setConfirmReset(false);
    setStatus({
      type: 'ok',
      text: 'Draf Beranda dikembalikan ke bawaan. Klik “Simpan Beranda” untuk menerapkannya ke situs publik.',
    });
  };

  const handleSave = async () => {
    setStatus(null);
    const check = validateHomepageConfig(draft);
    if (!check.ok) {
      setStatus({ type: 'err', text: check.error });
      return;
    }

    setSaving(true);
    try {
      const updated = await saveHomepageConfig(check.data);
      onSaved(updated);
      setStatus({
        type: 'ok',
        text: 'Foto Hero & Featured Memories Beranda berhasil disimpan & diterapkan ke halaman utama Wulan!',
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menyimpan konfigurasi Beranda.', 'admin'),
      });
    } finally {
      setSaving(false);
    }
  };

  const orderedFeatured = [...draft.featuredMemories].sort((a, b) => a.order - b.order);
  const heroMain =
    draft.heroFrames.find((f) => f.id === 'hero-main') ?? draft.heroFrames[0];
  const polaroidTop =
    draft.heroFrames.find((f) => f.id === 'polaroid-top') ?? draft.heroFrames[1];
  const polaroidBottom =
    draft.heroFrames.find((f) => f.id === 'polaroid-bottom') ?? draft.heroFrames[2];

  return (
    <div className="space-y-6" data-testid="admin-homepage-manager">
      {/* Top Action Header */}
      <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#38271F]">
              Pengelola Beranda Utama (Hero Collage & Featured Memories)
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5 leading-relaxed">
              Kelola foto pembuka di halaman depan beserta keterangan dan kartu Featured Memories
              secara terpisah tanpa memengaruhi galeri Our Story, Our World, maupun Heart Gallery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {confirmReset ? (
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="min-h-[42px] px-3 rounded-xl bg-[#A6533B] text-[#F4EBDD] text-xs font-semibold cursor-pointer"
                >
                  Ya, Reset Draf
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[42px] px-3 rounded-xl border border-[#38271F]/20 text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#38271F]/20 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#A6533B]" />
                <span>Reset Default</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Beranda'}</span>
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
      </section>

      {/* Live Visual Preview Panel */}
      <section className="rounded-2xl border border-[#38271F]/14 bg-[#F4EBDD] p-4 sm:p-6 shadow-polaroid space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#38271F]/10 pb-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#743D4A]">
            <Eye className="w-4 h-4" />
            <span>Pratinjau Langsung Tata Letak Beranda</span>
          </div>
          <span className="text-[11px] text-[#38271F]/60">
            Rasio & kemiringan bingkai otomatis dijaga identik dengan Hub publik
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Miniature Hero Collage Preview */}
          <div className="lg:col-span-5 space-y-2">
            <p className="text-xs font-semibold text-[#38271F]">Kolase Hero (3 Bingkai)</p>
            <div className="relative max-w-xs mx-auto pt-4 pb-6">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#EBC9CB]/35 via-[#E8BBA5]/20 to-[#A8B29B]/20 pointer-events-none"
              />
              {heroMain && (
                <figure className="relative z-10 w-[78%] editorial-photo-frame -rotate-1 p-2">
                  <div className="aspect-[3/4] overflow-hidden rounded-[4px] bg-[#EFE5D8]">
                    <img
                      src={heroMain.image}
                      alt={heroMain.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
                    <span className="font-hand text-sm text-[#552E3D] truncate">
                      {heroMain.caption}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-[#6E5F63]">
                      {heroMain.badgeLabel || 'Vol. 01'}
                    </span>
                  </figcaption>
                </figure>
              )}

              {polaroidTop && (
                <figure className="absolute top-0 right-0 z-20 w-[44%] editorial-photo-frame rotate-3 p-1.5 shadow-polaroid-lifted">
                  <div className="aspect-[4/3] overflow-hidden rounded-[4px] bg-[#EFE5D8]">
                    <img
                      src={polaroidTop.image}
                      alt={polaroidTop.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-1 font-hand text-xs text-[#30272A]/85 text-center truncate">
                    {polaroidTop.caption}
                  </figcaption>
                </figure>
              )}

              {polaroidBottom && (
                <figure className="absolute bottom-0 right-1 z-20 w-[46%] editorial-photo-frame -rotate-2 p-1.5 shadow-polaroid-lifted">
                  <div className="aspect-[4/3] overflow-hidden rounded-[4px] bg-[#EFE5D8]">
                    <img
                      src={polaroidBottom.image}
                      alt={polaroidBottom.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-1 font-hand text-xs text-[#552E3D] text-center truncate">
                    {polaroidBottom.caption}
                  </figcaption>
                </figure>
              )}
            </div>
          </div>

          {/* Miniature Featured Memories 3-Column Preview */}
          <div className="lg:col-span-7 space-y-2">
            <p className="text-xs font-semibold text-[#38271F]">
              Kartu Featured Memories ({orderedFeatured.length} Kartu)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {orderedFeatured.map((item) => (
                <figure
                  key={item.id}
                  className={`editorial-photo-frame p-2 transition-transform ${item.tiltClass}`}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-[4px] bg-[#EFE5D8]">
                    <img
                      src={item.image}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="pt-2 px-1 space-y-1">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[#A95F70] truncate">
                      {item.kicker}
                    </p>
                    <p className="font-serif text-xs font-semibold text-[#30272A] leading-snug line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-[#6E5F63] line-clamp-2">{item.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section A: Hero Collage Editor */}
      <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#38271F]/10">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#38271F]">
              1. Foto Kolase Hero (3 Slot Tetap)
            </h3>
            <p className="text-xs text-[#38271F]/65">
              Bingkai utama rasio 3:4 dan 2 Polaroid dekoratif rasio 4:3 di sisi kanan Hero.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSwapPolaroids}
            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[#38271F]/20 bg-[#F4EBDD] text-xs font-semibold text-[#38271F] inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#A6533B]" />
            <span>Tukar Polaroid Atas ↔ Bawah</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {draft.heroFrames.map((frame) => (
            <div
              key={frame.id}
              className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/50 p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-serif text-base font-semibold text-[#38271F]">
                  {frame.slotLabel}
                </h4>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#743D4A]">
                  {frame.role === 'hero-main' ? '3:4 Utama' : '4:3 Polaroid'}
                </span>
              </div>

              <MediaPickerControl
                label="Pilih / Unggah Gambar"
                kind="image"
                category="images"
                currentUrl={frame.image}
                mediaAssets={mediaAssets}
                onChangeUrl={(url) => updateHeroFrame(frame.id, { image: url })}
                onMediaRefresh={onMediaRefresh}
              />

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[#38271F]">
                  Tulisan Tangan (Caption Polaroid)
                </span>
                <input
                  type="text"
                  maxLength={120}
                  value={frame.caption}
                  onChange={(e) => updateHeroFrame(frame.id, { caption: e.target.value })}
                  className="w-full min-h-[40px] rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] px-3 text-sm text-[#38271F]"
                />
              </label>

              {frame.role === 'hero-main' && (
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-[#38271F]">
                    Label Kecil Kanan (Badge)
                  </span>
                  <input
                    type="text"
                    maxLength={32}
                    value={frame.badgeLabel}
                    onChange={(e) => updateHeroFrame(frame.id, { badgeLabel: e.target.value })}
                    placeholder="Vol. 01"
                    className="w-full min-h-[40px] rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] px-3 text-sm text-[#38271F]"
                  />
                </label>
              )}

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-[#38271F]">
                  Deskripsi Foto (Alt Text)
                </span>
                <input
                  type="text"
                  maxLength={260}
                  value={frame.alt}
                  onChange={(e) => updateHeroFrame(frame.id, { alt: e.target.value })}
                  className="w-full min-h-[40px] rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] px-3 text-xs text-[#38271F]"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Section B: Featured Memories Editor */}
      <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#38271F]">
            2. Kartu Featured Memories (Urutan & Isi)
          </h3>
          <p className="text-xs text-[#38271F]/65">
            Atur urutan tampil, foto, judul, kutipan singkat, dan bab tujuan saat kartu diketuk.
          </p>
        </div>

        <div className="space-y-4">
          {orderedFeatured.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#38271F]/14 bg-[#F4EBDD]/50 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#38271F]/10">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#38271F] text-[#F4EBDD] text-xs font-semibold">
                    {item.order}
                  </span>
                  <h4 className="font-serif text-base font-semibold text-[#38271F]">
                    {item.title || `Featured Memory #${item.order}`}
                  </h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleReorderFeatured(item.id, 'up')}
                    disabled={idx === 0}
                    aria-label={`Naikkan urutan ${item.title}`}
                    className="min-w-[36px] min-h-[36px] rounded-lg border border-[#38271F]/16 flex items-center justify-center text-[#38271F] disabled:opacity-30 hover:bg-[#FBF6EE] cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorderFeatured(item.id, 'down')}
                    disabled={idx === orderedFeatured.length - 1}
                    aria-label={`Turunkan urutan ${item.title}`}
                    className="min-w-[36px] min-h-[36px] rounded-lg border border-[#38271F]/16 flex items-center justify-center text-[#38271F] disabled:opacity-30 hover:bg-[#FBF6EE] cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5">
                  <MediaPickerControl
                    label="Foto Kartu Kenangan (4:3)"
                    kind="image"
                    category="images"
                    currentUrl={item.image}
                    mediaAssets={mediaAssets}
                    onChangeUrl={(url) => updateFeatured(item.id, { image: url })}
                    onMediaRefresh={onMediaRefresh}
                  />
                </div>

                <div className="lg:col-span-7 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-[#38271F]">Label Atas (Kicker)</span>
                      <input
                        type="text"
                        maxLength={80}
                        value={item.kicker}
                        onChange={(e) => updateFeatured(item.id, { kicker: e.target.value })}
                        className="w-full min-h-[40px] rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] px-3 text-sm text-[#38271F]"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-[#38271F]">Bab Tujuan Saat Diketuk</span>
                      <select
                        value={item.target}
                        onChange={(e) =>
                          updateFeatured(item.id, {
                            target: e.target.value as HomepageChapterTarget,
                          })
                        }
                        className="w-full min-h-[40px] rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] px-3 text-sm text-[#38271F]"
                      >
                        {HOMEPAGE_TARGET_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-[#38271F]">Judul Kartu</span>
                    <input
                      type="text"
                      maxLength={140}
                      value={item.title}
                      onChange={(e) => updateFeatured(item.id, { title: e.target.value })}
                      className="w-full min-h-[40px] rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] px-3 text-sm text-[#38271F]"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-[#38271F]">Keterangan Singkat</span>
                    <textarea
                      rows={2}
                      maxLength={280}
                      value={item.caption}
                      onChange={(e) => updateFeatured(item.id, { caption: e.target.value })}
                      className="w-full rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] p-2.5 text-sm text-[#38271F]"
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-[#38271F]">Kemiringan Bingkai</span>
                      <select
                        value={item.tiltClass}
                        onChange={(e) =>
                          updateFeatured(item.id, {
                            tiltClass: e.target.value as HomepageFeaturedMemory['tiltClass'],
                          })
                        }
                        className="w-full min-h-[40px] rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] px-3 text-sm text-[#38271F]"
                      >
                        {TILT_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-semibold text-[#38271F]">Alt Text Foto</span>
                      <input
                        type="text"
                        maxLength={260}
                        value={item.alt}
                        onChange={(e) => updateFeatured(item.id, { alt: e.target.value })}
                        className="w-full min-h-[40px] rounded-xl border border-[#38271F]/18 bg-[#FBF6EE] px-3 text-xs text-[#38271F]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
