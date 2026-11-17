import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { BirthdayVideoConfig } from '../../data/video';
import { MediaAssetItem, saveBirthdayVideo } from '../../utils/adminApi';
import { SiteContentPayload } from '../../utils/adminContent';
import { MediaPickerControl } from './MediaPickerControl';

interface VideoManagerProps {
  videoConfig: BirthdayVideoConfig;
  mediaAssets: MediaAssetItem[];
  onSaved: (payload: SiteContentPayload) => void;
  onMediaRefresh: () => Promise<void>;
}

export function VideoManager({
  videoConfig,
  mediaAssets,
  onSaved,
  onMediaRefresh,
}: VideoManagerProps) {
  const [draft, setDraft] = useState<BirthdayVideoConfig>(videoConfig);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setDraft(videoConfig);
  }, [videoConfig]);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await saveBirthdayVideo(draft);
      onSaved(updated);
      setStatus({ type: 'ok', text: 'Pengaturan Birthday Video berhasil disimpan.' });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan video.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-[#38271F]">
            Birthday Video Manager
          </h2>
          <p className="text-xs text-[#38271F]/70 mt-0.5">
            Unggah atau ganti video MP4/WEBM ucapan ulang tahun, gambar poster thumbnail, dan judul layar putar.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Video'}</span>
        </button>
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

      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Judul Halaman Video</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Label Subjudul Atas</span>
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Label Tiket Bioskop</span>
            <input
              type="text"
              value={draft.ticketLabel}
              onChange={(e) => setDraft({ ...draft, ticketLabel: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold text-[#38271F]">Deskripsi Video</span>
          <textarea
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="w-full rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 p-3 text-sm text-[#38271F]"
          />
        </label>

        <MediaPickerControl
          label="File Video Ucapan (MP4 / WEBM)"
          kind="video"
          category="videos"
          currentUrl={draft.videoSrc}
          mediaAssets={mediaAssets}
          onChangeUrl={(url) => setDraft({ ...draft, videoSrc: url })}
          onMediaRefresh={onMediaRefresh}
        />

        <MediaPickerControl
          label="Gambar Thumbnail / Poster (Opsional)"
          kind="image"
          category="images"
          currentUrl={draft.thumbnailSrc || ''}
          mediaAssets={mediaAssets}
          onChangeUrl={(url) => setDraft({ ...draft, thumbnailSrc: url })}
          onMediaRefresh={onMediaRefresh}
          allowEmpty
        />

        {draft.videoSrc && (
          <div className="pt-2 border-t border-[#38271F]/10">
            <p className="text-xs font-semibold text-[#38271F] mb-2">Pratinjau Pemutar Video</p>
            <video
              key={draft.videoSrc}
              src={draft.videoSrc}
              poster={draft.thumbnailSrc || undefined}
              controls
              playsInline
              preload="metadata"
              className="w-full max-w-xl aspect-video rounded-xl bg-[#120E0D]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
