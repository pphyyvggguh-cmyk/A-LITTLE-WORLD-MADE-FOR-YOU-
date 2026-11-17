import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Disc3,
  Eye,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { VinylPlayerConfig, VinylTrack } from '../../data/vinyl';
import { MediaAssetItem, saveVinylConfig, saveVinylPlaylist } from '../../utils/adminApi';
import { SiteContentPayload } from '../../utils/adminContent';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  normalizeVinylOrder,
  reorderVinylTrack,
  validateVinylTrackInput,
} from '../../utils/vinyl';
import { MediaPickerControl } from './MediaPickerControl';

interface VinylManagerProps {
  vinylConfig: VinylPlayerConfig;
  playlist: VinylTrack[];
  mediaAssets: MediaAssetItem[];
  onSaved: (payload: SiteContentPayload) => void;
  onMediaRefresh: () => Promise<void>;
}

export function VinylManager({
  vinylConfig,
  playlist,
  mediaAssets,
  onSaved,
  onMediaRefresh,
}: VinylManagerProps) {
  const [configDraft, setConfigDraft] = useState<VinylPlayerConfig>(vinylConfig);
  const [tracksDraft, setTracksDraft] = useState<VinylTrack[]>(() =>
    normalizeVinylOrder(playlist)
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => playlist[0]?.id ?? null
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showPreviewEmbed, setShowPreviewEmbed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setConfigDraft(vinylConfig);
  }, [vinylConfig]);

  useEffect(() => {
    const normalized = normalizeVinylOrder(playlist);
    setTracksDraft(normalized);
    if (normalized.length > 0 && !normalized.some((t) => t.id === selectedId)) {
      setSelectedId(normalized[0].id);
    }
  }, [playlist]);

  const ordered = normalizeVinylOrder(tracksDraft);
  const current = ordered.find((t) => t.id === selectedId) ?? ordered[0] ?? null;

  const updateCurrent = (patch: Partial<VinylTrack>) => {
    if (!current) return;
    setTracksDraft((prev) =>
      prev.map((item) => {
        if (item.id !== current.id) return item;
        const merged = { ...item, ...patch };
        if (patch.youtubeUrl !== undefined) {
          const parsedId = extractYouTubeVideoId(patch.youtubeUrl);
          if (parsedId) {
            merged.youtubeVideoId = parsedId;
            if (!merged.thumbnailUrl || merged.thumbnailUrl.includes('i.ytimg.com/vi/')) {
              merged.thumbnailUrl = getYouTubeThumbnailUrl(parsedId);
            }
          }
        }
        return merged;
      })
    );
    setStatus(null);
  };

  const handleAddTrack = () => {
    const newTrack: VinylTrack = {
      id: `vinyl-${Date.now()}`,
      youtubeUrl: '',
      youtubeVideoId: '',
      title: `Lagu Kenangan ${ordered.length + 1}`,
      artist: '',
      thumbnailUrl: '',
      order: ordered.length + 1,
      isPublished: true,
    };
    setTracksDraft((prev) => [...prev, newTrack]);
    setSelectedId(newTrack.id);
    setShowPreviewEmbed(false);
    setStatus(null);
  };

  const handleReorder = (id: string, dir: 'up' | 'down') => {
    setTracksDraft((prev) => reorderVinylTrack(prev, id, dir));
    setStatus(null);
  };

  const handleDeleteTrack = (id: string) => {
    const remaining = normalizeVinylOrder(tracksDraft.filter((t) => t.id !== id));
    setTracksDraft(remaining);
    setConfirmDeleteId(null);
    setSelectedId(remaining[0]?.id ?? null);
    setStatus(null);
  };

  const handleSaveAll = async () => {
    setStatus(null);
    for (const track of ordered) {
      const check = validateVinylTrackInput({
        youtubeUrl: track.youtubeUrl || track.youtubeVideoId,
        title: track.title,
        artist: track.artist,
        thumbnailUrl: track.thumbnailUrl,
      });
      if (!check.ok) {
        setSelectedId(track.id);
        setStatus({
          type: 'err',
          text: `${track.title || 'Lagu baru'}: ${check.error}`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      await saveVinylConfig(configDraft);
      const updated = await saveVinylPlaylist(ordered);
      onSaved(updated);
      setStatus({
        type: 'ok',
        text: `Pengaturan Vinyl Player & ${ordered.length} lagu berhasil disimpan ke Cloud Firestore!`,
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menyimpan daftar Vinyl Player.',
      });
    } finally {
      setSaving(false);
    }
  };

  const parsedVideoId = current
    ? extractYouTubeVideoId(current.youtubeUrl || current.youtubeVideoId)
    : null;

  return (
    <div className="space-y-5">
      {/* Global Player Settings */}
      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#38271F] inline-flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-[#A6533B]" />
              <span>Our Little Vinyl Player Manager</span>
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5">
              Kelola playlist YouTube resmi untuk pemutar piringan hitam persisten di pojok kiri bawah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddTrack}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#38271F]/20 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Lagu YouTube</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Playlist Vinyl'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#38271F]/10">
          <label className="flex items-center gap-2.5 rounded-xl border border-[#38271F]/14 bg-[#F4EBDD]/60 px-3.5 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={configDraft.enabled}
              onChange={(e) =>
                setConfigDraft({ ...configDraft, enabled: e.target.checked })
              }
              className="w-5 h-5 accent-[#455342] shrink-0"
            />
            <span className="text-xs font-semibold text-[#38271F]">
              Aktifkan Vinyl Player di Website
            </span>
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-[#38271F]">Judul Pemutar</span>
            <input
              type="text"
              value={configDraft.title}
              onChange={(e) =>
                setConfigDraft({ ...configDraft, title: e.target.value })
              }
              className="w-full min-h-[40px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-xs text-[#38271F]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-[#38271F]">Pesan Petunjuk Putar</span>
            <input
              type="text"
              value={configDraft.autoplayHint}
              onChange={(e) =>
                setConfigDraft({ ...configDraft, autoplayHint: e.target.value })
              }
              className="w-full min-h-[40px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-xs text-[#38271F]"
            />
          </label>
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

        {/* Ordered Playlist Selector */}
        {ordered.length > 0 && (
          <div className="space-y-2 pt-2">
            {ordered.map((track, idx) => {
              const selected = current?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${
                    selected
                      ? 'bg-[#EAE0CF]/80 border-[#38271F]/30'
                      : 'bg-[#F4EBDD]/60 border-[#38271F]/12'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(track.id)}
                    className="flex-1 min-h-[40px] flex items-center gap-2.5 text-left px-1.5 cursor-pointer min-w-0"
                  >
                    {track.thumbnailUrl ? (
                      <img
                        src={track.thumbnailUrl}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover shrink-0 bg-[#EAE0CF]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[#38271F]/12 flex items-center justify-center shrink-0">
                        <Disc3 className="w-4 h-4 text-[#743D4A]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#38271F] truncate">
                        {track.order}. {track.title || 'Lagu Tanpa Judul'}
                        {!track.isPublished && (
                          <span className="ml-1.5 text-[10px] text-[#A6533B]">(Tersembunyi)</span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#38271F]/60 truncate">
                        {track.artist ? `${track.artist} · ` : ''}
                        {track.youtubeVideoId ? `ID: ${track.youtubeVideoId}` : 'Link YouTube belum diisi'}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReorder(track.id, 'up')}
                      disabled={idx === 0}
                      aria-label={`Naikkan urutan ${track.title}`}
                      className="min-w-[36px] min-h-[36px] rounded-lg border border-[#38271F]/16 flex items-center justify-center text-[#38271F] disabled:opacity-30 hover:bg-[#FBF6EE] cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(track.id, 'down')}
                      disabled={idx === ordered.length - 1}
                      aria-label={`Turunkan urutan ${track.title}`}
                      className="min-w-[36px] min-h-[36px] rounded-lg border border-[#38271F]/16 flex items-center justify-center text-[#38271F] disabled:opacity-30 hover:bg-[#FBF6EE] cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Track Editor */}
      {!current ? (
        <div className="rounded-2xl border border-dashed border-[#38271F]/22 bg-[#FBF6EE] p-8 text-center space-y-3">
          <p className="font-serif text-lg text-[#38271F]">Playlist Vinyl Masih Kosong</p>
          <p className="text-xs text-[#38271F]/70 max-w-md mx-auto">
            Tambahkan link lagu YouTube favorit kalian agar Our Little Vinyl Player bisa memutar musik saat Wulan menjelajahi website.
          </p>
          <button
            type="button"
            onClick={handleAddTrack}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Lagu Pertama</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#38271F]">
                Edit Track #{current.order}: {current.title}
              </h3>
              <p className="text-[11px] text-[#38271F]/60">
                Mendukung link youtube.com/watch?v=..., youtu.be/..., /shorts/..., atau Video ID 11 karakter.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {parsedVideoId && (
                <button
                  type="button"
                  onClick={() => setShowPreviewEmbed((v) => !v)}
                  className="min-h-[40px] px-3 rounded-xl border border-[#38271F]/20 text-xs font-semibold text-[#38271F] inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#455342]" />
                  <span>{showPreviewEmbed ? 'Tutup Pratinjau' : 'Pratinjau Lagu'}</span>
                </button>
              )}

              {confirmDeleteId === current.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteTrack(current.id)}
                    className="min-h-[40px] px-3 rounded-xl bg-[#A6533B] text-[#F4EBDD] text-xs font-semibold cursor-pointer"
                  >
                    Ya, Hapus Lagu
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
                  <span>Hapus Lagu</span>
                </button>
              )}
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">
              Link YouTube / Video ID *
            </span>
            <input
              type="text"
              value={current.youtubeUrl}
              onChange={(e) => updateCurrent({ youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            />
            {current.youtubeUrl.trim() && !parsedVideoId && (
              <p className="text-[11px] font-medium text-[#A6533B]">
                Link YouTube atau Video ID belum dikenali (harus memiliki 11 karakter ID valid).
              </p>
            )}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Judul Lagu *</span>
              <input
                type="text"
                value={current.title}
                maxLength={140}
                onChange={(e) => updateCurrent({ title: e.target.value })}
                placeholder="Contoh: Lagu Pertama Kita"
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">
                Nama Penyanyi / Artis (Opsional)
              </span>
              <input
                type="text"
                value={current.artist}
                maxLength={120}
                onChange={(e) => updateCurrent({ artist: e.target.value })}
                placeholder="Contoh: Payung Teduh"
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>
          </div>

          <label className="flex items-center gap-2.5 rounded-xl border border-[#38271F]/14 bg-[#F4EBDD]/50 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={current.isPublished}
              onChange={(e) => updateCurrent({ isPublished: e.target.checked })}
              className="w-5 h-5 accent-[#455342]"
            />
            <span className="text-xs font-medium text-[#38271F]">
              Tampilkan & putar lagu ini di Vinyl Player publik
            </span>
          </label>

          <MediaPickerControl
            label="Cover / Thumbnail Album Kustom (Opsional)"
            kind="image"
            category="images"
            currentUrl={current.thumbnailUrl}
            mediaAssets={mediaAssets}
            onChangeUrl={(url) => updateCurrent({ thumbnailUrl: url })}
            onMediaRefresh={onMediaRefresh}
            allowEmpty
          />

          {showPreviewEmbed && parsedVideoId && (
            <div className="rounded-xl overflow-hidden border border-[#38271F]/16 bg-[#181210] aspect-video max-w-md">
              <iframe
                title={`Pratinjau YouTube ${current.title}`}
                src={`https://www.youtube.com/embed/${parsedVideoId}?rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
