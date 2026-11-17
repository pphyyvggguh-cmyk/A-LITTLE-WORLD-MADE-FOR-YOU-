import { useEffect, useState } from 'react';
import { Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { BirthdayLetter } from '../../data/letters';
import { saveBirthdayLetters } from '../../utils/adminApi';
import { SiteContentPayload } from '../../utils/adminContent';

interface LettersManagerProps {
  letters: BirthdayLetter[];
  onSaved: (payload: SiteContentPayload) => void;
}

export function LettersManager({ letters, onSaved }: LettersManagerProps) {
  const [draft, setDraft] = useState<BirthdayLetter[]>(letters);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setDraft(letters);
  }, [letters]);

  const current = draft[selectedIndex] ?? draft[0];

  const updateCurrent = (patch: Partial<BirthdayLetter>) => {
    setDraft((prev) =>
      prev.map((item, idx) => (idx === selectedIndex ? { ...item, ...patch } : item))
    );
    setStatus(null);
  };

  const handleAddLetter = () => {
    const newLetter: BirthdayLetter = {
      id: `letter-${Date.now()}`,
      title: 'Surat Baru Untuk Wulan',
      dateLabel: 'Catatan Tambahan',
      recipient: 'Wulan',
      sender: 'Dari Oktaf',
      stampText: 'SPECIAL · 2026',
      sealColor: '#A6533B',
      preview: 'Sebuah pesan hangat baru yang ditulis khusus untukmu...',
      paragraphs: ['Hai Wulan,', 'Tuliskan isi surat lengkapnya di sini.'],
      closing: 'Selalu bersamamu, Oktaf ♡',
    };
    setDraft((prev) => [...prev, newLetter]);
    setSelectedIndex(draft.length);
    setStatus(null);
  };

  const handleDeleteLetter = (id: string) => {
    if (draft.length <= 1) {
      setStatus({ type: 'err', text: 'Minimal sisakan 1 surat di Birthday Letters.' });
      setConfirmDeleteId(null);
      return;
    }
    const next = draft.filter((l) => l.id !== id);
    setDraft(next);
    setSelectedIndex((idx) => Math.max(0, Math.min(idx, next.length - 1)));
    setConfirmDeleteId(null);
    setStatus(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const cleaned = draft.map((l) => ({
        ...l,
        paragraphs: l.paragraphs.map((p) => p.trim()).filter(Boolean),
      }));
      const updated = await saveBirthdayLetters(cleaned);
      onSaved(updated);
      setStatus({ type: 'ok', text: 'Perubahan Birthday Letters berhasil disimpan.' });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menyimpan surat.',
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
              Birthday Letters Manager · {draft.length} Surat
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5">
              Edit pesan, tambahkan surat baru, dan aktifkan Pratinjau Surat sebelum menyimpan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddLetter}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#38271F]/20 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Surat Baru</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Surat'}</span>
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

        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrapbook-scroll">
          {draft.map((letter, idx) => (
            <button
              key={letter.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                idx === selectedIndex
                  ? 'bg-[#38271F] text-[#F4EBDD]'
                  : 'bg-[#F4EBDD] border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF]'
              }`}
            >
              {idx + 1}. {letter.title.slice(0, 22)}
            </button>
          ))}
        </div>
      </div>

      {current && (
        <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
            <h3 className="font-serif text-lg font-semibold text-[#38271F]">
              Editor: {current.title}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="min-h-[40px] px-3 rounded-xl border border-[#38271F]/20 text-xs font-semibold text-[#38271F] inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
              >
                {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPreview ? 'Tutup Pratinjau' : 'Pratinjau Surat'}</span>
              </button>

              {confirmDeleteId === current.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteLetter(current.id)}
                    className="min-h-[40px] px-3 rounded-xl bg-[#A6533B] text-[#F4EBDD] text-xs font-semibold cursor-pointer"
                  >
                    Ya, Hapus
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
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>

          {showPreview && (
            <div className="journal-lined rounded-xl border border-[#38271F]/18 p-5 sm:p-7 shadow-polaroid space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#38271F]/12">
                <div>
                  <p className="text-xs font-medium text-[#743D4A]">
                    {current.dateLabel} · {current.sender}
                  </p>
                  <h4 className="font-serif text-xl sm:text-2xl font-semibold text-[#38271F]">
                    {current.title}
                  </h4>
                </div>
                <span className="postage-stamp px-2.5 py-1 text-[10px] font-semibold text-[#743D4A] uppercase">
                  {current.stampText}
                </span>
              </div>
              <div className="space-y-3 text-sm text-[#38271F]/90 leading-[28px]">
                {current.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <p className="font-hand text-2xl text-[#743D4A] pt-2">{current.closing}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Judul Surat</span>
              <input
                type="text"
                value={current.title}
                onChange={(e) => updateCurrent({ title: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Label Tanggal / Edisi</span>
              <input
                type="text"
                value={current.dateLabel}
                onChange={(e) => updateCurrent({ dateLabel: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Untuk (Recipient)</span>
              <input
                type="text"
                value={current.recipient}
                onChange={(e) => updateCurrent({ recipient: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Dari (Sender)</span>
              <input
                type="text"
                value={current.sender}
                onChange={(e) => updateCurrent({ sender: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Teks Stempel Amplop</span>
              <input
                type="text"
                value={current.stampText}
                onChange={(e) => updateCurrent({ stampText: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Penutup / Tanda Tangan</span>
              <input
                type="text"
                value={current.closing}
                onChange={(e) => updateCurrent({ closing: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Cuplikan Preview di Kartu Amplop</span>
            <input
              type="text"
              value={current.preview}
              onChange={(e) => updateCurrent({ preview: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">
              Paragraf Isi Surat (pisahkan antar paragraf dengan satu baris kosong)
            </span>
            <textarea
              rows={8}
              value={current.paragraphs.join('\n\n')}
              onChange={(e) =>
                updateCurrent({
                  paragraphs: e.target.value.split(/\n\s*\n/),
                })
              }
              className="w-full rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 p-3 text-sm text-[#38271F] leading-relaxed"
            />
          </label>
        </div>
      )}
    </div>
  );
}
