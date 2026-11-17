import { useEffect, useState } from 'react';
import { Lock, Save, Unlock } from 'lucide-react';
import { WorldDestination } from '../../data/destinations';
import { MediaAssetItem, saveWorldDestinations } from '../../utils/adminApi';
import { SiteContentPayload } from '../../utils/adminContent';
import { MediaPickerControl } from './MediaPickerControl';

interface WorldManagerProps {
  destinations: WorldDestination[];
  mediaAssets: MediaAssetItem[];
  onSaved: (payload: SiteContentPayload) => void;
  onMediaRefresh: () => Promise<void>;
}

export function WorldManager({
  destinations,
  mediaAssets,
  onSaved,
  onMediaRefresh,
}: WorldManagerProps) {
  const [draft, setDraft] = useState<WorldDestination[]>(destinations);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [unlockCoords, setUnlockCoords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setDraft(destinations);
  }, [destinations]);

  const current = draft[selectedIndex] ?? draft[0];

  const updateCurrent = (patch: Partial<WorldDestination>) => {
    setDraft((prev) =>
      prev.map((item, idx) => (idx === selectedIndex ? { ...item, ...patch } : item))
    );
    setStatus(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await saveWorldDestinations(draft);
      onSaved(updated);
      setStatus({ type: 'ok', text: 'Perubahan Our World (20 destinasi) berhasil disimpan.' });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menyimpan destinasi.',
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
              Our World Manager · 20 Destinasi 3D Globe
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5">
              Koordinat marker 3D dan rute pesawat tetap terjaga kecuali kamu membuka kunci koordinat.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Our World'}</span>
          </button>
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

        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrapbook-scroll">
          {draft.map((dest, idx) => (
            <button
              key={dest.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                idx === selectedIndex
                  ? 'bg-[#38271F] text-[#F4EBDD]'
                  : 'bg-[#F4EBDD] border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF]'
              }`}
            >
              {dest.order}. {dest.city}
            </button>
          ))}
        </div>
      </div>

      {current && (
        <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#743D4A]">
                Destinasi #{current.order} · {current.region}
              </span>
              <h3 className="font-serif text-lg font-semibold text-[#38271F]">
                {current.city}, {current.country}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setUnlockCoords((v) => !v)}
              className="min-h-[38px] px-3 rounded-xl border border-[#38271F]/18 text-[11px] font-medium text-[#38271F] inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
            >
              {unlockCoords ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{unlockCoords ? 'Kunci Koordinat' : 'Ubah Koordinat Manual'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Nama Kota</span>
              <input
                type="text"
                value={current.city}
                onChange={(e) => updateCurrent({ city: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Negara</span>
              <input
                type="text"
                value={current.country}
                onChange={(e) => updateCurrent({ country: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Kawasan</span>
              <select
                value={current.region}
                onChange={(e) =>
                  updateCurrent({
                    region: e.target.value as WorldDestination['region'],
                  })
                }
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              >
                <option value="Asia">Asia</option>
                <option value="Europe">Europe</option>
                <option value="Americas">Americas</option>
                <option value="Oceania">Oceania</option>
                <option value="Middle East">Middle East</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Label Stempel</span>
              <input
                type="text"
                value={current.stampLabel}
                onChange={(e) => updateCurrent({ stampLabel: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Catatan Singkat Polaroid (Caption)</span>
            <input
              type="text"
              value={current.travelNote}
              onChange={(e) => updateCurrent({ travelNote: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Deskripsi Destinasi</span>
            <textarea
              rows={3}
              value={current.description}
              onChange={(e) => updateCurrent({ description: e.target.value })}
              className="w-full rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 p-3 text-sm text-[#38271F]"
            />
          </label>

          {unlockCoords && (
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#EAE0CF]/55 p-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#38271F]">Latitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={current.lat}
                  onChange={(e) => updateCurrent({ lat: Number(e.target.value) })}
                  className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-3 text-xs text-[#38271F]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-[#38271F]">Longitude</span>
                <input
                  type="number"
                  step="0.0001"
                  value={current.lng}
                  onChange={(e) => updateCurrent({ lng: Number(e.target.value) })}
                  className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-3 text-xs text-[#38271F]"
                />
              </label>
            </div>
          )}

          <MediaPickerControl
            label="Foto / Ilustrasi Destinasi"
            kind="image"
            category="images"
            currentUrl={current.image}
            mediaAssets={mediaAssets}
            onChangeUrl={(url) => updateCurrent({ image: url })}
            onMediaRefresh={onMediaRefresh}
          />
        </div>
      )}
    </div>
  );
}
