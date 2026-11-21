import { ChangeEvent, useId, useState } from 'react';
import { ImageOff, RefreshCw, Trash2, Upload } from 'lucide-react';
import {
  MediaAssetItem,
  deleteMediaFile,
  uploadMediaFile,
} from '../../utils/adminApi';
import { MediaKind } from '../../utils/adminContent';
import { isLegacyEphemeralUploadUrl } from '../../utils/imageOptimizer';
import { formatSafeUiError } from '../../utils/safeError';

interface MediaLibraryManagerProps {
  mediaAssets: MediaAssetItem[];
  onRefresh: () => Promise<void>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MediaLibraryManager({
  mediaAssets,
  onRefresh,
}: MediaLibraryManagerProps) {
  const uploadInputId = useId();
  const [filterKind, setFilterKind] = useState<'all' | MediaKind>('all');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmDeleteUrl, setConfirmDeleteUrl] = useState<string | null>(null);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const visibleAssets = mediaAssets.filter((item) =>
    filterKind === 'all' ? true : item.kind === filterKind
  );

  const handleUploadNew = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setStatus(null);
    try {
      const res = await uploadMediaFile(file, 'auto', (pct) => setProgress(pct));
      await onRefresh();
      setStatus({ type: 'ok', text: `File berhasil diunggah ke ${res.url}` });
    } catch (err) {
      setStatus({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal mengunggah file.', 'admin'),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceExisting = async (
    targetAsset: MediaAssetItem,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setStatus(null);
    try {
      const cat =
        targetAsset.category === 'friends-audio'
          ? 'friends-audio'
          : targetAsset.kind === 'image'
            ? 'images'
            : targetAsset.kind === 'audio'
              ? 'audio'
              : 'videos';
      const res = await uploadMediaFile(
        file,
        cat,
        (pct) => setProgress(pct),
        targetAsset.url
      );
      await onRefresh();
      setStatus({ type: 'ok', text: `File diganti di lokasi ${res.url}` });
    } catch (err) {
      setStatus({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal mengganti file.', 'admin'),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    setStatus(null);
    try {
      await deleteMediaFile(url);
      setConfirmDeleteUrl(null);
      await onRefresh();
      setStatus({ type: 'ok', text: `File ${url} dihapus.` });
    } catch (err) {
      setStatus({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menghapus file.', 'admin'),
      });
      setConfirmDeleteUrl(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#38271F]">
              Media Library · {mediaAssets.length} File
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5">
              Kelola foto (JPG/PNG/WEBP), audio (MP3/OGG), dan video (MP4/WEBM) langsung dari Android.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={uploadInputId}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#4e382d] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? `Mengunggah ${progress}%...` : 'Unggah File Baru'}</span>
            </label>
            <input
              id={uploadInputId}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.mp3,.ogg,.mp4,.webm,image/jpeg,image/png,image/webp,audio/mpeg,audio/ogg,video/mp4,video/webm"
              onChange={handleUploadNew}
              disabled={uploading}
              className="sr-only"
            />
          </div>
        </div>

        {uploading && (
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-[#38271F]/12 overflow-hidden">
              <div
                className="h-full bg-[#455342] transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-[#455342] font-medium tabular-nums">
              Mengunggah: {progress}%
            </p>
          </div>
        )}

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

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['all', 'Semua'],
              ['image', 'Gambar'],
              ['audio', 'Audio'],
              ['video', 'Video'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilterKind(val)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                filterKind === val
                  ? 'bg-[#A6533B] text-[#F4EBDD]'
                  : 'bg-[#F4EBDD] border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleAssets.map((asset) => (
          <article
            key={asset.url}
            className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 shadow-polaroid flex flex-col justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              {asset.kind === 'image' && (
                brokenUrls[asset.url] ? (
                  <div
                    aria-label={`Pratinjau ${asset.filename} tidak tersedia`}
                    className="w-16 h-16 rounded-xl shrink-0 bg-[#EAE0CF] border border-[#A6533B]/25 flex items-center justify-center text-[#A6533B]"
                  >
                    <ImageOff className="w-5 h-5" />
                  </div>
                ) : (
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    onError={() =>
                      setBrokenUrls((prev) =>
                        prev[asset.url] ? prev : { ...prev, [asset.url]: true }
                      )
                    }
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#EAE0CF] border border-[#38271F]/12"
                    loading="lazy"
                  />
                )
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#EAE0CF] text-[10px] font-semibold uppercase text-[#38271F]">
                    {asset.kind}
                  </span>
                  <span className="text-[11px] text-[#38271F]/60 tabular-nums">
                    {formatBytes(asset.sizeBytes)}
                  </span>
                  {(brokenUrls[asset.url] || isLegacyEphemeralUploadUrl(asset.url)) && (
                    <span className="px-2 py-0.5 rounded bg-[#A6533B]/15 text-[#A6533B] text-[10px] font-semibold">
                      File lama hilang
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold text-[#38271F] truncate">
                  {asset.filename}
                </p>
                <p className="text-[11px] text-[#38271F]/55 truncate">{asset.url}</p>
              </div>
            </div>

            {asset.kind === 'audio' && (
              <audio src={asset.url} controls preload="metadata" className="w-full h-9" />
            )}

            {asset.kind === 'video' && (
              <video
                src={asset.url}
                controls
                playsInline
                preload="metadata"
                className="w-full aspect-video rounded-xl bg-[#120E0D]"
              />
            )}

            {/* Usage Tracking Badges */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-[#743D4A]">Digunakan di:</p>
              {asset.usedIn.length === 0 ? (
                <p className="text-[11px] text-[#38271F]/55">Belum terhubung ke kartu/halaman mana pun</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {asset.usedIn.map((loc) => (
                    <span
                      key={loc}
                      className="px-2 py-0.5 rounded-md bg-[#455342]/12 text-[#455342] text-[10px] font-medium"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#38271F]/10 flex flex-wrap items-center justify-between gap-2">
              <label className="min-h-[38px] px-3 rounded-xl border border-[#38271F]/20 text-xs font-medium text-[#38271F] inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ganti File</span>
                <input
                  type="file"
                  accept={
                    asset.kind === 'image'
                      ? '.jpg,.jpeg,.png,.webp'
                      : asset.kind === 'audio'
                        ? '.mp3,.ogg'
                        : '.mp4,.webm'
                  }
                  onChange={(e) => handleReplaceExisting(asset, e)}
                  className="sr-only"
                />
              </label>

              {asset.deletable && asset.usedIn.length === 0 ? (
                confirmDeleteUrl === asset.url ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(asset.url)}
                      className="min-h-[38px] px-3 rounded-xl bg-[#A6533B] text-[#F4EBDD] text-xs font-semibold cursor-pointer"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUrl(null)}
                      className="min-h-[38px] px-2.5 rounded-xl border border-[#38271F]/20 text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteUrl(asset.url)}
                    className="min-h-[38px] px-3 rounded-xl text-xs font-semibold text-[#A6533B] hover:bg-[#A6533B]/10 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )
              ) : (
                <span className="text-[11px] text-[#38271F]/45">
                  {asset.usedIn.length > 0 ? 'Sedang digunakan' : 'Aset bawaan'}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
