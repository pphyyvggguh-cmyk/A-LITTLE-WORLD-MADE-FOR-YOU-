import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Plus, Save, Trash2 } from 'lucide-react';
import {
  VOICE_FLOWER_OPTIONS,
  VOICE_FLOWER_QUANTITY_MAX,
  VOICE_FLOWER_QUANTITY_MIN,
  VoiceFlowerType,
  VoiceOfLoveEntry,
} from '../../data/voices';
import { MediaAssetItem, saveVoicesOfLove } from '../../utils/adminApi';
import {
  normalizeVoicesOrder,
  reorderVoiceEntry,
  SiteContentPayload,
} from '../../utils/adminContent';
import { clampFlowerQuantity } from '../../utils/unifiedContribution';
import { formatSafeUiError } from '../../utils/safeError';
import { VoiceBouquetDisplay } from '../voices/VoiceBouquetDisplay';
import { VoiceFlowerSVG } from '../voices/VoiceFlowerSVG';
import { MediaPickerControl } from './MediaPickerControl';

interface VoicesManagerProps {
  voices: VoiceOfLoveEntry[];
  mediaAssets: MediaAssetItem[];
  onSaved: (payload: SiteContentPayload) => void;
  onMediaRefresh: () => Promise<void>;
}

export function VoicesManager({
  voices,
  mediaAssets,
  onSaved,
  onMediaRefresh,
}: VoicesManagerProps) {
  const [draft, setDraft] = useState<VoiceOfLoveEntry[]>(() => normalizeVoicesOrder(voices));
  const [selectedId, setSelectedId] = useState<string | null>(() => voices[0]?.id ?? null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const normalized = normalizeVoicesOrder(voices);
    setDraft(normalized);
    if (normalized.length > 0 && !normalized.some((v) => v.id === selectedId)) {
      setSelectedId(normalized[0].id);
    }
  }, [voices]);

  const orderedDraft = normalizeVoicesOrder(draft);
  const current = orderedDraft.find((v) => v.id === selectedId) ?? orderedDraft[0] ?? null;

  const updateCurrent = (patch: Partial<VoiceOfLoveEntry>) => {
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

  const handleAddFriend = () => {
    const now = new Date().toISOString();
    const usedCount = draft.length;
    const flower = VOICE_FLOWER_OPTIONS[usedCount % VOICE_FLOWER_OPTIONS.length].id;
    const newEntry: VoiceOfLoveEntry = {
      id: `voice-${Date.now()}`,
      name: `Sahabat ${usedCount + 1}`,
      flowerType: flower,
      flowerQuantity: 1,
      audioUrl: '',
      audioFileName: '',
      photoUrl: '',
      message: '',
      order: usedCount + 1,
      permissionConfirmed: false,
      createdAt: now,
      updatedAt: now,
    };
    setDraft((prev) => [...prev, newEntry]);
    setSelectedId(newEntry.id);
    setStatus(null);
  };

  const handleReorder = (id: string, dir: 'up' | 'down') => {
    setDraft((prev) => reorderVoiceEntry(prev, id, dir));
    setStatus(null);
  };

  const handleDeleteFriend = async (id: string) => {
    const remaining = normalizeVoicesOrder(draft.filter((v) => v.id !== id));
    setDraft(remaining);
    setConfirmDeleteId(null);
    setSelectedId(remaining[0]?.id ?? null);

    // Persist removal immediately if all remaining items are valid, or save full list
    const hasIncomplete = remaining.some(
      (item) => !item.name.trim() || !item.audioUrl.trim() || !item.permissionConfirmed
    );
    if (!hasIncomplete) {
      setSaving(true);
      try {
        const updated = await saveVoicesOfLove(remaining);
        onSaved(updated);
        setStatus({ type: 'ok', text: 'Kartu sahabat dihapus dan daftar diperbarui.' });
      } catch (err) {
        setStatus({
          type: 'err',
          text: formatSafeUiError(err, 'Gagal menghapus kartu.', 'admin'),
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveAll = async () => {
    setStatus(null);
    for (const item of orderedDraft) {
      if (!item.name.trim()) {
        setSelectedId(item.id);
        setStatus({ type: 'err', text: 'Setiap kartu sahabat wajib memiliki nama tampilan.' });
        return;
      }
      if (!item.audioUrl.trim()) {
        setSelectedId(item.id);
        setStatus({
          type: 'err',
          text: `Unggah file audio MP3/OGG untuk "${item.name}" sebelum menyimpan.`,
        });
        return;
      }
      if (!item.permissionConfirmed) {
        setSelectedId(item.id);
        setStatus({
          type: 'err',
          text: `Centang konfirmasi izin rekaman asli untuk "${item.name}" terlebih dahulu.`,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const updated = await saveVoicesOfLove(orderedDraft);
      onSaved(updated);
      setStatus({
        type: 'ok',
        text: `Voices of Love (${orderedDraft.length} sahabat) berhasil disimpan & dipublikasikan!`,
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: formatSafeUiError(err, 'Gagal menyimpan Voices of Love.', 'admin'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#38271F]">
              Voices of Love Manager · {orderedDraft.length} Sahabat
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5">
              Unggah file rekaman MP3/OGG asli dari sahabat langsung ke{' '}
              <strong className="font-semibold text-[#743D4A]">Firebase Storage</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddFriend}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#38271F]/20 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sahabat</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Voices of Love'}</span>
            </button>
          </div>
        </div>

        {status && (
          <p
            role="status"
            className={`mt-3 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
              status.type === 'ok'
                ? 'bg-[#455342]/12 text-[#455342]'
                : 'bg-[#A6533B]/12 text-[#A6533B]'
            }`}
          >
            {status.text}
          </p>
        )}

        {/* Order & Friend Selector List */}
        {orderedDraft.length > 0 && (
          <div className="mt-4 space-y-2">
            {orderedDraft.map((item, idx) => {
              const selected = current?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${
                    selected
                      ? 'bg-[#EAE0CF]/75 border-[#38271F]/30'
                      : 'bg-[#F4EBDD]/60 border-[#38271F]/12'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="flex-1 min-h-[40px] flex items-center gap-2.5 text-left px-1.5 cursor-pointer"
                  >
                    <VoiceBouquetDisplay
                      flowerType={item.flowerType}
                      quantity={item.flowerQuantity ?? 1}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#38271F] truncate">
                        {item.order}. {item.name} · {clampFlowerQuantity(item.flowerQuantity ?? 1)}× bunga
                      </p>
                      <p className="text-[11px] text-[#38271F]/60 truncate">
                        {item.audioUrl ? item.audioFileName || item.audioUrl : 'Belum ada file MP3'}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReorder(item.id, 'up')}
                      disabled={idx === 0}
                      aria-label={`Naikkan urutan ${item.name}`}
                      className="min-w-[38px] min-h-[38px] rounded-lg border border-[#38271F]/16 flex items-center justify-center text-[#38271F] disabled:opacity-30 hover:bg-[#FBF6EE] cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(item.id, 'down')}
                      disabled={idx === orderedDraft.length - 1}
                      aria-label={`Turunkan urutan ${item.name}`}
                      className="min-w-[38px] min-h-[38px] rounded-lg border border-[#38271F]/16 flex items-center justify-center text-[#38271F] disabled:opacity-30 hover:bg-[#FBF6EE] cursor-pointer"
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

      {!current ? (
        <div className="rounded-2xl border border-dashed border-[#38271F]/22 bg-[#FBF6EE] p-8 text-center space-y-3">
          <p className="font-serif text-lg text-[#38271F]">
            Belum ada kartu Voices of Love
          </p>
          <p className="text-xs text-[#38271F]/70 max-w-md mx-auto">
            Ketuk tombol “Tambah Sahabat” di atas untuk menambahkan ucapan suara pertama dari sahabat Wulan.
          </p>
          <button
            type="button"
            onClick={handleAddFriend}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Sahabat Pertama</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
            <div className="flex items-center gap-3">
              <VoiceBouquetDisplay
                flowerType={current.flowerType}
                quantity={current.flowerQuantity ?? 1}
                size="sm"
              />
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#38271F]">
                  Edit: {current.name}
                </h3>
                <p className="text-[11px] text-[#38271F]/60">
                  Urutan tampil #{current.order} · Buket {clampFlowerQuantity(current.flowerQuantity ?? 1)} tangkai
                </p>
              </div>
            </div>

            {confirmDeleteId === current.id ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDeleteFriend(current.id)}
                  className="min-h-[40px] px-3 rounded-xl bg-[#A6533B] text-[#F4EBDD] text-xs font-semibold cursor-pointer"
                >
                  Ya, Hapus Kartu
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
                <span>Hapus Sahabat</span>
              </button>
            )}
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">
              Nama Tampilan / Panggilan Sahabat
            </span>
            <input
              type="text"
              value={current.name}
              onChange={(e) => updateCurrent({ name: e.target.value })}
              placeholder="Contoh: Rina (Sahabat Kuliah)"
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            />
          </label>

          {/* Flower Illustration Picker */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-[#38271F]">
              Pilih Ilustrasi Bunga Khas
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {VOICE_FLOWER_OPTIONS.map((opt) => {
                const selected = current.flowerType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateCurrent({ flowerType: opt.id as VoiceFlowerType })}
                    className={`min-h-[64px] rounded-xl border p-2 flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors ${
                      selected
                        ? 'border-[#A6533B] bg-[#E8BFC5]/25 font-semibold text-[#38271F]'
                        : 'border-[#38271F]/14 bg-[#F4EBDD]/50 text-[#38271F]/80 hover:bg-[#EAE0CF]/70'
                    }`}
                  >
                    <VoiceFlowerSVG flowerType={opt.id} className="w-8 h-8" />
                    <span className="text-[10px] leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/55 p-3">
              <div>
                <p className="text-xs font-semibold text-[#38271F]">
                  Jumlah Tangkai Bunga dalam Buket (1–{VOICE_FLOWER_QUANTITY_MAX})
                </p>
                <p className="text-[11px] text-[#38271F]/65">
                  Pilihan asli pengirim otomatis tersimpan dan dapat dilihat di pratinjau kiri atas.
                </p>
              </div>
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateCurrent({
                      flowerQuantity: Math.max(
                        VOICE_FLOWER_QUANTITY_MIN,
                        clampFlowerQuantity(current.flowerQuantity ?? 1) - 1
                      ),
                    })
                  }
                  disabled={clampFlowerQuantity(current.flowerQuantity ?? 1) <= VOICE_FLOWER_QUANTITY_MIN}
                  aria-label="Kurangi jumlah bunga"
                  className="min-w-[38px] min-h-[38px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] text-sm font-semibold text-[#38271F] disabled:opacity-35 cursor-pointer"
                >
                  −
                </button>
                <span className="min-w-[36px] text-center font-serif text-base font-semibold text-[#38271F] tabular-nums">
                  {clampFlowerQuantity(current.flowerQuantity ?? 1)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateCurrent({
                      flowerQuantity: Math.min(
                        VOICE_FLOWER_QUANTITY_MAX,
                        clampFlowerQuantity(current.flowerQuantity ?? 1) + 1
                      ),
                    })
                  }
                  disabled={clampFlowerQuantity(current.flowerQuantity ?? 1) >= VOICE_FLOWER_QUANTITY_MAX}
                  aria-label="Tambah jumlah bunga"
                  className="min-w-[38px] min-h-[38px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] text-sm font-semibold text-[#38271F] disabled:opacity-35 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <MediaPickerControl
            label="File Audio Ucapan (MP3 / OGG)"
            kind="audio"
            category="friends-audio"
            currentUrl={current.audioUrl}
            mediaAssets={mediaAssets}
            onChangeUrl={(url, filename) =>
              updateCurrent({
                audioUrl: url,
                audioFileName: filename || url.split('/').pop() || '',
              })
            }
            onMediaRefresh={onMediaRefresh}
          />

          <MediaPickerControl
            label="Foto Sahabat (Opsional)"
            kind="image"
            category="images"
            currentUrl={current.photoUrl || ''}
            mediaAssets={mediaAssets}
            onChangeUrl={(url) => updateCurrent({ photoUrl: url })}
            onMediaRefresh={onMediaRefresh}
            allowEmpty
          />

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">
              Pesan Singkat Tertulis (Opsional)
            </span>
            <textarea
              rows={3}
              value={current.message || ''}
              onChange={(e) => updateCurrent({ message: e.target.value })}
              placeholder="Contoh: Selamat ulang tahun Wulan! Semoga sehat dan bahagia selalu ♡"
              className="w-full rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 p-3 text-sm text-[#38271F]"
            />
          </label>

          {/* Permission Confirmation Checkbox */}
          <label className="flex items-start gap-3 rounded-xl border border-[#455342]/25 bg-[#455342]/8 p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={current.permissionConfirmed}
              onChange={(e) =>
                updateCurrent({ permissionConfirmed: e.target.checked })
              }
              className="mt-0.5 w-5 h-5 accent-[#455342] shrink-0"
            />
            <span className="text-xs text-[#38271F] leading-relaxed">
              <strong className="font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#455342]" />
                Konfirmasi Izin Rekaman Asli:
              </strong>{' '}
              Saya mengonfirmasi bahwa rekaman suara ini dikirim dengan persetujuan sahabat Wulan
              untuk diputar di halaman Voices of Love ♡.
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
