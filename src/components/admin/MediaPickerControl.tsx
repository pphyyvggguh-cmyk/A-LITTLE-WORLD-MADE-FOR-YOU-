import { ChangeEvent, useId, useState } from 'react';
import { FolderOpen, Upload } from 'lucide-react';
import { MediaAssetItem, uploadMediaFile } from '../../utils/adminApi';
import { MediaKind } from '../../utils/adminContent';
import { formatSafeUiError } from '../../utils/safeError';

interface MediaPickerControlProps {
  label: string;
  kind: MediaKind;
  category: 'friends-audio' | 'images' | 'audio' | 'videos';
  currentUrl?: string;
  mediaAssets: MediaAssetItem[];
  onChangeUrl: (url: string, filename?: string) => void;
  onMediaRefresh: () => Promise<void>;
  replaceTargetUrl?: string;
  allowEmpty?: boolean;
}

export function MediaPickerControl({
  label,
  kind,
  category,
  currentUrl = '',
  mediaAssets,
  onChangeUrl,
  onMediaRefresh,
  replaceTargetUrl,
  allowEmpty = false,
}: MediaPickerControlProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);

  const acceptMap: Record<MediaKind, string> = {
    image: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp',
    audio: '.mp3,.ogg,audio/mpeg,audio/ogg',
    video: '.mp4,.webm,video/mp4,video/webm',
  };

  const formatHint: Record<MediaKind, string> = {
    image: 'JPG, JPEG, PNG, WEBP',
    audio: 'MP3 atau OGG',
    video: 'MP4 atau WEBM',
  };

  const filteredAssets = mediaAssets.filter((item) => item.kind === kind);

  const handleFilePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadMediaFile(
        file,
        category,
        (pct) => setProgress(pct),
        replaceTargetUrl
      );
      onChangeUrl(result.url, result.filename);
      await onMediaRefresh();
    } catch (err) {
      setError(formatSafeUiError(err, 'Gagal mengunggah file.', 'admin'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#38271F]/14 bg-[#F4EBDD]/60 p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#38271F]">{label}</span>
        <span className="text-[11px] text-[#38271F]/60">{formatHint[kind]}</span>
      </div>

      {currentUrl && (
        <div className="flex items-center gap-3 rounded-lg bg-[#FBF6EE] border border-[#38271F]/10 p-2">
          {kind === 'image' && (
            <img
              src={currentUrl}
              alt={label}
              className="w-12 h-12 rounded-md object-cover shrink-0 bg-[#EAE0CF]"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[#38271F] truncate">{currentUrl}</p>
            {kind === 'audio' && (
              <audio src={currentUrl} controls preload="metadata" className="mt-1.5 w-full h-8" />
            )}
          </div>
          {allowEmpty && (
            <button
              type="button"
              onClick={() => onChangeUrl('', '')}
              className="min-h-[36px] px-2.5 rounded-lg border border-[#A6533B]/30 text-[11px] font-semibold text-[#A6533B] hover:bg-[#A6533B]/10 cursor-pointer shrink-0"
            >
              Hapus
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#4e382d] cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{uploading ? `Mengunggah ${progress}%...` : 'Unggah dari HP / Device'}</span>
        </label>
        <input
          id={inputId}
          type="file"
          accept={acceptMap[kind]}
          onChange={handleFilePick}
          disabled={uploading}
          className="sr-only"
        />

        <button
          type="button"
          onClick={() => setShowLibrary((v) => !v)}
          className="min-h-[44px] px-3 py-2 rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] text-[#38271F] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#743D4A]" />
          <span>{showLibrary ? 'Tutup Pustaka' : `Pilih Media (${filteredAssets.length})`}</span>
        </button>
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
            Progres unggahan: {progress}%
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-[#A6533B]">
          {error}
        </p>
      )}

      {showLibrary && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-[#38271F]/14 bg-[#FBF6EE] p-2 space-y-1.5 scrapbook-scroll">
          {filteredAssets.length === 0 ? (
            <p className="text-xs text-[#38271F]/60 py-2 text-center">
              Belum ada file {kind} di pustaka.
            </p>
          ) : (
            filteredAssets.map((item) => (
              <button
                key={item.url}
                type="button"
                onClick={() => {
                  onChangeUrl(item.url, item.filename);
                  setShowLibrary(false);
                }}
                className={`w-full min-h-[40px] flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer ${
                  currentUrl === item.url
                    ? 'bg-[#E8BFC5]/45 text-[#38271F]'
                    : 'hover:bg-[#F4EBDD] text-[#38271F]'
                }`}
              >
                {kind === 'image' && (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-8 h-8 rounded object-cover shrink-0 bg-[#EAE0CF]"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{item.filename}</p>
                  <p className="text-[10px] text-[#38271F]/55 truncate">{item.url}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
