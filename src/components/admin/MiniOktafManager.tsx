import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import {
  OKTAF_EXPRESSION_PATHS,
  OKTAF_POSE_PATHS,
  OktafDialogueEntry,
  OktafExpression,
  OktafPose,
} from '../../data/miniOktaf';
import { saveMiniOktafContent } from '../../utils/adminApi';
import { MiniOktafContentConfig, SiteContentPayload } from '../../utils/adminContent';

interface MiniOktafManagerProps {
  miniOktaf: MiniOktafContentConfig;
  onSaved: (payload: SiteContentPayload) => void;
}

const SECTION_LABELS: Record<string, string> = {
  welcome: 'Layar Pembuka (Welcome)',
  hub: 'Beranda Utama (Hub)',
  story: 'Our Story (Memory Book)',
  world: 'Our World (3D Globe)',
  letters: 'Birthday Letters',
  video: 'Birthday Video (Mulai)',
  videoEnded: 'Birthday Video (Selesai)',
  voices: 'Voices of Love ♡',
  reward: 'Halaman Hadiah Akhir',
};

const POSE_OPTIONS = Object.keys(OKTAF_POSE_PATHS) as OktafPose[];
const EXPRESSION_OPTIONS = Object.keys(OKTAF_EXPRESSION_PATHS) as OktafExpression[];

export function MiniOktafManager({ miniOktaf, onSaved }: MiniOktafManagerProps) {
  const [draft, setDraft] = useState<MiniOktafContentConfig>(miniOktaf);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setDraft(miniOktaf);
  }, [miniOktaf]);

  const updateSectionDialogue = (key: string, patch: Partial<OktafDialogueEntry>) => {
    setDraft((prev) => ({
      ...prev,
      sectionDialogues: {
        ...prev.sectionDialogues,
        [key]: {
          ...(prev.sectionDialogues[key] ?? {
            pose: 'waving',
            expression: 'happy',
            message: '',
          }),
          ...patch,
        },
      },
    }));
    setStatus(null);
  };

  const updateTapReaction = (idx: number, patch: Partial<OktafDialogueEntry>) => {
    setDraft((prev) => ({
      ...prev,
      curiousTapReactions: prev.curiousTapReactions.map((item, i) =>
        i === idx ? { ...item, ...patch } : item
      ),
    }));
    setStatus(null);
  };

  const handleAddTapReaction = () => {
    const newTap: OktafDialogueEntry = {
      pose: 'cheering',
      expression: 'happy',
      message: 'Selalu semangat menelusuri setiap sudut dunia kecil ini ya, Wulan! ♡',
    };
    setDraft((prev) => ({
      ...prev,
      curiousTapReactions: [...prev.curiousTapReactions, newTap],
    }));
  };

  const handleRemoveTapReaction = (idx: number) => {
    if (draft.curiousTapReactions.length <= 1) {
      setStatus({ type: 'err', text: 'Sisakan minimal 1 dialog ketukan Mini Oktaf.' });
      return;
    }
    setDraft((prev) => ({
      ...prev,
      curiousTapReactions: prev.curiousTapReactions.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await saveMiniOktafContent(draft);
      onSaved(updated);
      setStatus({ type: 'ok', text: 'Dialog Mini Oktaf berhasil diperbarui.' });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menyimpan dialog Mini Oktaf.',
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
            Mini Oktaf Dialogue Manager
          </h2>
          <p className="text-xs text-[#38271F]/70 mt-0.5">
            Atur ucapan, pose, dan ekspresi Mini Oktaf di setiap halaman tanpa mengubah karya seni atau animasi aslinya.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Dialog Mini Oktaf'}</span>
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

      {/* Section Dialogues */}
      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4">
        <h3 className="font-serif text-lg font-semibold text-[#38271F]">
          Dialog Otomatis Per Halaman
        </h3>

        <div className="space-y-4">
          {Object.keys(draft.sectionDialogues).map((key) => {
            const entry = draft.sectionDialogues[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/50 p-3.5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={OKTAF_POSE_PATHS[entry.pose] ?? OKTAF_POSE_PATHS.waving}
                    alt={entry.pose}
                    className="w-12 h-12 rounded-lg object-contain bg-[#FBF6EE] border border-[#38271F]/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#743D4A]">
                      {SECTION_LABELS[key] ?? key}
                    </p>
                    <p className="text-[11px] text-[#38271F]/55">Key: {key}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold text-[#38271F]">Pose</span>
                    <select
                      value={entry.pose}
                      onChange={(e) =>
                        updateSectionDialogue(key, { pose: e.target.value as OktafPose })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-2.5 text-xs text-[#38271F]"
                    >
                      {POSE_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold text-[#38271F]">Ekspresi</span>
                    <select
                      value={entry.expression}
                      onChange={(e) =>
                        updateSectionDialogue(key, {
                          expression: e.target.value as OktafExpression,
                        })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-2.5 text-xs text-[#38271F]"
                    >
                      {EXPRESSION_OPTIONS.map((ex) => (
                        <option key={ex} value={ex}>
                          {ex}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-[#38271F]">Pesan Balon Dialog</span>
                  <textarea
                    rows={2}
                    value={entry.message}
                    onChange={(e) =>
                      updateSectionDialogue(key, { message: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] p-2.5 text-xs sm:text-sm text-[#38271F]"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curious Tap Reactions */}
      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#38271F]">
              Variasi Dialog Saat Mini Oktaf Diketuk ({draft.curiousTapReactions.length})
            </h3>
            <p className="text-xs text-[#38271F]/65">
              Ketuk dua kali pada Mini Oktaf tetap memicu Secret Quest bunga tersembunyi.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTapReaction}
            className="min-h-[40px] px-3 rounded-xl border border-[#38271F]/20 text-xs font-semibold text-[#38271F] inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Variasi</span>
          </button>
        </div>

        <div className="space-y-3">
          {draft.curiousTapReactions.map((tap, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#38271F]/12 bg-[#F4EBDD]/50 p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#743D4A]">
                  Variasi Ketukan #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveTapReaction(idx)}
                  className="min-h-[36px] px-2.5 rounded-lg text-xs font-medium text-[#A6533B] hover:bg-[#A6533B]/10 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={tap.pose}
                  aria-label={`Pose ketukan ${idx + 1}`}
                  onChange={(e) =>
                    updateTapReaction(idx, { pose: e.target.value as OktafPose })
                  }
                  className="min-h-[40px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-2.5 text-xs text-[#38271F]"
                >
                  {POSE_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={tap.expression}
                  aria-label={`Ekspresi ketukan ${idx + 1}`}
                  onChange={(e) =>
                    updateTapReaction(idx, {
                      expression: e.target.value as OktafExpression,
                    })
                  }
                  className="min-h-[40px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-2.5 text-xs text-[#38271F]"
                >
                  {EXPRESSION_OPTIONS.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={tap.message}
                aria-label={`Pesan ketukan ${idx + 1}`}
                onChange={(e) => updateTapReaction(idx, { message: e.target.value })}
                className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-3 text-xs sm:text-sm text-[#38271F]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
