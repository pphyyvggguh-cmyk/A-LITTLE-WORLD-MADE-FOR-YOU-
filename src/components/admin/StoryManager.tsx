import { useEffect, useState } from 'react';
import { BookHeart, Mail, Plus, Save, Trash2 } from 'lucide-react';
import { StorySecretNote } from '../../data/hiddenMessages';
import { BookPolaroidItem, MemoryBookPage } from '../../data/memories';
import { MediaAssetItem, saveStoryPages } from '../../utils/adminApi';
import { SiteContentPayload } from '../../utils/adminContent';
import { MediaPickerControl } from './MediaPickerControl';
import { SecretNotesManager } from './SecretNotesManager';

interface StoryManagerProps {
  pages: MemoryBookPage[];
  secretNotes: StorySecretNote[];
  mediaAssets: MediaAssetItem[];
  onSaved: (payload: SiteContentPayload) => void;
  onMediaRefresh: () => Promise<void>;
}

export function StoryManager({
  pages,
  secretNotes,
  mediaAssets,
  onSaved,
  onMediaRefresh,
}: StoryManagerProps) {
  const [subTab, setSubTab] = useState<'pages' | 'secret-notes'>('pages');
  const [draft, setDraft] = useState<MemoryBookPage[]>(pages);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setDraft(pages);
  }, [pages]);

  const currentPage = draft[selectedIndex] ?? draft[0];

  const updateCurrentPage = (updater: (page: MemoryBookPage) => MemoryBookPage) => {
    setDraft((prev) => prev.map((p, idx) => (idx === selectedIndex ? updater(p) : p)));
    setStatus(null);
  };

  const updatePolaroid = (
    polIdx: number,
    patch: Partial<BookPolaroidItem>
  ) => {
    updateCurrentPage((page) => ({
      ...page,
      polaroids: page.polaroids.map((item, i) => (i === polIdx ? { ...item, ...patch } : item)),
    }));
  };

  const handleAddOptionalPolaroid = () => {
    updateCurrentPage((page) => {
      const nextItem: BookPolaroidItem = {
        id: `${page.id}-extra-${Date.now()}`,
        title: 'Kenangan Baru',
        date: 'Momen Spesial',
        location: 'Bersama Wulan',
        caption: 'Tambahkan catatan hangat di sini.',
        story: 'Cerita kecil di balik foto ini.',
        image: page.polaroids[0]?.image || '/assets/photos/memories/mem-01.svg',
        aspect: 'portrait',
        size: 'md',
        tape: 'gold',
        rotation: -1.5,
      };
      return {
        ...page,
        polaroids: [...page.polaroids, nextItem],
      };
    });
  };

  const handleRemovePolaroid = (polIdx: number) => {
    updateCurrentPage((page) => ({
      ...page,
      polaroids: page.polaroids.filter((_, i) => i !== polIdx),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await saveStoryPages(draft);
      onSaved(updated);
      setStatus({ type: 'ok', text: 'Perubahan Our Story (17 halaman) berhasil disimpan.' });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menyimpan Our Story.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation: Our Story Pages vs Secret Notes Manager */}
      <div
        role="tablist"
        aria-label="Sub-menu Our Story Control Room"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-2 shadow-polaroid"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'pages'}
          onClick={() => setSubTab('pages')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors ${
            subTab === 'pages'
              ? 'bg-[#38271F] text-[#F4EBDD]'
              : 'bg-[#F4EBDD]/70 text-[#38271F] hover:bg-[#EAE0CF]'
          }`}
        >
          <BookHeart className="w-4 h-4" />
          <span>17 Halaman Scrapbook</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'secret-notes'}
          data-testid="tab-secret-notes-manager"
          onClick={() => setSubTab('secret-notes')}
          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors ${
            subTab === 'secret-notes'
              ? 'bg-[#38271F] text-[#F4EBDD]'
              : 'bg-[#F4EBDD]/70 text-[#38271F] hover:bg-[#EAE0CF]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Secret Notes Manager ({secretNotes.length})</span>
        </button>
      </div>

      {subTab === 'secret-notes' ? (
        <SecretNotesManager
          secretNotes={secretNotes}
          storyPages={pages}
          onSaved={onSaved}
        />
      ) : (
        <>
      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#38271F]">
              Our Story Manager · 17 Halaman Scrapbook
            </h2>
            <p className="text-xs text-[#38271F]/70 mt-0.5">
              Struktur 17 halaman, efek balik halaman, amplop tersembunyi, dan bunga quest tetap terjaga otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Our Story'}</span>
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

        {/* 17-Page Picker Strip */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2 scrapbook-scroll">
          {draft.map((page, idx) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                idx === selectedIndex
                  ? 'bg-[#38271F] text-[#F4EBDD]'
                  : 'bg-[#F4EBDD] border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF]'
              }`}
            >
              Hal. {page.pageNumber} · {page.title.slice(0, 18)}
            </button>
          ))}
        </div>
      </div>

      {currentPage && (
        <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#743D4A]">
                Halaman {currentPage.pageNumber} dari 17 · {currentPage.spreadTheme}
              </span>
              <h3 className="font-serif text-lg font-semibold text-[#38271F]">
                {currentPage.title}
              </h3>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#EAE0CF] text-[#38271F]/80">
              Layout: {currentPage.layoutType}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Judul Halaman</span>
              <input
                type="text"
                value={currentPage.title}
                onChange={(e) =>
                  updateCurrentPage((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Subjudul / Tanggal</span>
              <input
                type="text"
                value={currentPage.subtitle ?? ''}
                onChange={(e) =>
                  updateCurrentPage((p) => ({ ...p, subtitle: e.target.value }))
                }
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Catatan Tulisan Tangan</span>
            <input
              type="text"
              value={currentPage.handwrittenNote ?? ''}
              onChange={(e) =>
                updateCurrentPage((p) => ({ ...p, handwrittenNote: e.target.value }))
              }
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Cerita Halaman</span>
            <textarea
              rows={4}
              value={currentPage.bodyCopy ?? ''}
              onChange={(e) =>
                updateCurrentPage((p) => ({ ...p, bodyCopy: e.target.value }))
              }
              className="w-full rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 p-3 text-sm text-[#38271F]"
            />
          </label>

          <div className="pt-2 border-t border-[#38271F]/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[#38271F]">
                Foto Polaroid di Halaman Ini ({currentPage.polaroids.length})
              </h4>
              <button
                type="button"
                onClick={handleAddOptionalPolaroid}
                className="min-h-[40px] px-3 rounded-xl border border-[#38271F]/20 text-xs font-semibold text-[#38271F] inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Foto Opsional</span>
              </button>
            </div>

            {currentPage.polaroids.length === 0 && (
              <p className="text-xs text-[#38271F]/65">
                Halaman ini fokus pada cerita tertulis. Kamu tetap bisa menambahkan foto Polaroid opsional di atas.
              </p>
            )}

            {currentPage.polaroids.map((pol, polIdx) => (
              <div
                key={pol.id}
                className="rounded-xl border border-[#38271F]/14 bg-[#F4EBDD]/40 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#743D4A]">
                    Polaroid #{polIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePolaroid(polIdx)}
                    aria-label={`Hapus Polaroid ${pol.title}`}
                    className="min-h-[36px] px-2.5 rounded-lg text-xs font-medium text-[#A6533B] hover:bg-[#A6533B]/10 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold text-[#38271F]">Judul Foto</span>
                    <input
                      type="text"
                      value={pol.title}
                      onChange={(e) => updatePolaroid(polIdx, { title: e.target.value })}
                      className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-3 text-xs text-[#38271F]"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold text-[#38271F]">Tanggal</span>
                    <input
                      type="text"
                      value={pol.date}
                      onChange={(e) => updatePolaroid(polIdx, { date: e.target.value })}
                      className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-3 text-xs text-[#38271F]"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-[#38271F]">Caption Foto</span>
                  <input
                    type="text"
                    value={pol.caption}
                    onChange={(e) => updatePolaroid(polIdx, { caption: e.target.value })}
                    className="w-full min-h-[42px] rounded-xl border border-[#38271F]/20 bg-[#FBF6EE] px-3 text-xs text-[#38271F]"
                  />
                </label>

                <MediaPickerControl
                  label="Ganti / Unggah Foto Polaroid"
                  kind="image"
                  category="images"
                  currentUrl={pol.image}
                  mediaAssets={mediaAssets}
                  onChangeUrl={(url) => updatePolaroid(polIdx, { image: url })}
                  onMediaRefresh={onMediaRefresh}
                />
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
