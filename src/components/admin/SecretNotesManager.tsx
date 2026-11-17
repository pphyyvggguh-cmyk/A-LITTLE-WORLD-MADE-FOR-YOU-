import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  SECRET_NOTE_SEAL_COLORS,
  type StorySecretNote,
} from '../../data/hiddenMessages';
import type { MemoryBookPage } from '../../data/memories';
import {
  deleteSecretNote,
  migrateDefaultSecretNotes,
  toggleSecretNoteEnabled,
  upsertSecretNote,
} from '../../utils/adminApi';
import type { SiteContentPayload } from '../../utils/adminContent';
import {
  createDraftSecretNote,
  sortSecretNotes,
  validateSecretNoteInput,
} from '../../utils/secretNotes';
import { HiddenEnvelopeModal } from '../story/HiddenEnvelope';

interface SecretNotesManagerProps {
  secretNotes: StorySecretNote[];
  storyPages: MemoryBookPage[];
  onSaved: (payload: SiteContentPayload) => void;
}

function formatUpdatedTimestamp(iso?: string): string {
  if (!iso) return 'Default siap disinkronkan';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SecretNotesManager({
  secretNotes,
  storyPages,
  onSaved,
}: SecretNotesManagerProps) {
  const orderedNotes = useMemo(() => sortSecretNotes(secretNotes), [secretNotes]);

  const [editingNote, setEditingNote] = useState<StorySecretNote | null>(null);
  const [previewNote, setPreviewNote] = useState<StorySecretNote | null>(null);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<StorySecretNote | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [pageFilter, setPageFilter] = useState<'all' | number>('all');
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const pageTitleByNumber = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of storyPages) {
      map.set(p.pageNumber, p.title);
    }
    return map;
  }, [storyPages]);

  const filteredNotes = useMemo(() => {
    if (pageFilter === 'all') return orderedNotes;
    return orderedNotes.filter((n) => n.pageNumber === pageFilter);
  }, [orderedNotes, pageFilter]);

  const enabledCount = useMemo(
    () => orderedNotes.filter((n) => n.enabled).length,
    [orderedNotes]
  );

  const startCreate = () => {
    const targetPage = typeof pageFilter === 'number' ? pageFilter : 6;
    setEditingNote(createDraftSecretNote(targetPage));
    setStatus(null);
  };

  const startEdit = (note: StorySecretNote) => {
    setEditingNote({ ...note });
    setStatus(null);
  };

  const handleSaveEditor = async () => {
    if (!editingNote) return;
    const validation = validateSecretNoteInput({
      id: editingNote.id,
      title: editingNote.title,
      recipient: editingNote.recipient,
      message: editingNote.message,
      signature: editingNote.signature,
      pageNumber: editingNote.pageNumber,
      enabled: editingNote.enabled,
      hint: editingNote.hint,
      stampText: editingNote.stampText,
      sealColor: editingNote.sealColor,
    });

    if (!validation.ok) {
      setStatus({ type: 'err', text: validation.error });
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      const updated = await upsertSecretNote(validation.normalized);
      onSaved(updated);
      setEditingNote(null);
      setStatus({
        type: 'ok',
        text: `Secret Note "${validation.normalized.title}" berhasil disimpan ke Halaman ${validation.normalized.pageNumber}.`,
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menyimpan Secret Note.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (note: StorySecretNote) => {
    setBusyId(note.id);
    setStatus(null);
    try {
      const nextEnabled = !note.enabled;
      const updated = await toggleSecretNoteEnabled(note.id, nextEnabled);
      onSaved(updated);
      setStatus({
        type: 'ok',
        text: `Secret Note "${note.title}" ${nextEnabled ? 'diaktifkan' : 'dinonaktifkan'}.`,
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal mengubah status Secret Note.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteNote) return;
    const target = confirmDeleteNote;
    setBusyId(target.id);
    setStatus(null);
    try {
      const updated = await deleteSecretNote(target.id);
      onSaved(updated);
      if (editingNote?.id === target.id) {
        setEditingNote(null);
      }
      setConfirmDeleteNote(null);
      setStatus({
        type: 'ok',
        text: `Secret Note "${target.title}" telah dihapus permanen.`,
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menghapus Secret Note.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleMigrateDefaults = async () => {
    setMigrating(true);
    setStatus(null);
    try {
      const res = await migrateDefaultSecretNotes();
      onSaved(res.payload);
      setStatus({
        type: 'ok',
        text:
          res.importedCount > 0
            ? `${res.importedCount} Secret Note bawaan berhasil dimigrasikan ke Cloud Firestore.`
            : 'Semua Secret Note bawaan sudah tersinkron di Cloud Firestore.',
      });
    } catch (err) {
      setStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal memigrasikan Secret Note bawaan.',
      });
    } finally {
      setMigrating(false);
    }
  };

  const openEditorPreview = () => {
    if (!editingNote) return;
    setPreviewNote({
      ...editingNote,
      label: editingNote.title || 'Pratinjau Secret Note',
      greeting: editingNote.recipient || 'Untuk Wulan,',
      message: editingNote.message || '(Tulis isi pesan Secret Note di kolom editor)',
      signature: editingNote.signature || 'Dengan hangat ♡',
      hint: editingNote.hint || 'Ketuk amplop kecil',
      stampText: editingNote.stampText || 'SECRET NOTE',
    });
  };

  return (
    <div className="space-y-5" data-testid="secret-notes-manager">
      {/* Header Bar */}
      <div className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#743D4A]">
              Our Story → Secret Notes Manager · {enabledCount} Aktif / {orderedNotes.length} Total
            </p>
            <h2 className="font-serif text-xl font-semibold text-[#38271F] mt-0.5">
              Pengelola Amplop & Secret Note Our Story
            </h2>
            <p className="text-xs text-[#38271F]/72 mt-0.5 leading-relaxed">
              Buat, edit, aktif/nonaktifkan, dan tempatkan catatan rahasia ke halaman 1–17 tanpa menyentuh kode. Hanya catatan aktif yang muncul di Our Story publik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMigrateDefaults}
              disabled={migrating}
              className="min-h-[42px] px-3 py-2 rounded-xl border border-[#38271F]/20 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#743D4A] ${migrating ? 'animate-spin' : ''}`} />
              <span>{migrating ? 'Menyinkronkan...' : 'Sinkronkan Default'}</span>
            </button>

            <button
              type="button"
              onClick={startCreate}
              data-testid="create-secret-note-btn"
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#384435] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Secret Note</span>
            </button>
          </div>
        </div>

        {/* Page Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#38271F]/10">
          <span className="text-xs font-semibold text-[#38271F]/75">Filter Halaman:</span>
          <select
            aria-label="Filter Secret Notes berdasarkan halaman"
            value={pageFilter === 'all' ? 'all' : String(pageFilter)}
            onChange={(e) =>
              setPageFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="min-h-[38px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/70 px-3 text-xs text-[#38271F]"
          >
            <option value="all">Semua Halaman ({orderedNotes.length})</option>
            {Array.from({ length: 17 }, (_, i) => i + 1).map((num) => {
              const count = orderedNotes.filter((n) => n.pageNumber === num).length;
              const title = pageTitleByNumber.get(num) || `Halaman ${num}`;
              return (
                <option key={num} value={num}>
                  Hal. {String(num).padStart(2, '0')} · {title} {count > 0 ? `(${count})` : ''}
                </option>
              );
            })}
          </select>
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
      </div>

      {/* Create / Edit Form Panel */}
      {editingNote && (
        <section
          aria-label="Editor Secret Note"
          data-testid="secret-note-editor"
          className="rounded-2xl border border-[#743D4A]/25 bg-[#FBF6EE] p-4 sm:p-6 shadow-polaroid space-y-4"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#743D4A]">
                ID: {editingNote.id}
              </span>
              <h3 className="font-serif text-lg font-semibold text-[#38271F]">
                {orderedNotes.some((n) => n.id === editingNote.id)
                  ? `Edit Secret Note · ${editingNote.title}`
                  : 'Secret Note Baru'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setEditingNote(null)}
              aria-label="Tutup editor Secret Note"
              className="min-w-[40px] min-h-[40px] rounded-xl border border-[#38271F]/16 bg-[#F4EBDD] flex items-center justify-center text-[#38271F] hover:bg-[#EAE0CF] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Judul Catatan (Title) *</span>
              <input
                type="text"
                maxLength={120}
                value={editingNote.title}
                onChange={(e) =>
                  setEditingNote({ ...editingNote, title: e.target.value, label: e.target.value })
                }
                placeholder="Contoh: Catatan Kecil · Hal. 06"
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Nama Penerima (Recipient) *</span>
              <input
                type="text"
                maxLength={120}
                value={editingNote.recipient}
                onChange={(e) =>
                  setEditingNote({
                    ...editingNote,
                    recipient: e.target.value,
                    greeting: e.target.value,
                  })
                }
                placeholder="Contoh: Untuk Wulan,"
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Halaman Our Story *</span>
              <select
                value={editingNote.pageNumber}
                onChange={(e) =>
                  setEditingNote({ ...editingNote, pageNumber: Number(e.target.value) })
                }
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              >
                {Array.from({ length: 17 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Hal. {String(num).padStart(2, '0')} — {pageTitleByNumber.get(num) || `Halaman ${num}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Teks Amplop (Hint)</span>
              <input
                type="text"
                maxLength={80}
                value={editingNote.hint}
                onChange={(e) => setEditingNote({ ...editingNote, hint: e.target.value })}
                placeholder="Ketuk amplop kecil"
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Stempel Surat</span>
              <input
                type="text"
                maxLength={40}
                value={editingNote.stampText}
                onChange={(e) => setEditingNote({ ...editingNote, stampText: e.target.value })}
                placeholder="SECRET NOTE"
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#38271F]">Isi Pesan Secret Note *</span>
            <textarea
              rows={4}
              maxLength={3000}
              value={editingNote.message}
              onChange={(e) => setEditingNote({ ...editingNote, message: e.target.value })}
              placeholder="Tulis pesan manis untuk Wulan yang akan muncul saat amplop ini dibuka..."
              className="w-full rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 p-3 text-sm text-[#38271F] leading-relaxed"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#38271F]">Tanda Tangan (Signature) *</span>
              <input
                type="text"
                maxLength={160}
                value={editingNote.signature}
                onChange={(e) => setEditingNote({ ...editingNote, signature: e.target.value })}
                placeholder="Dengan hangat ♡"
                className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 bg-[#F4EBDD]/60 px-3 text-sm text-[#38271F]"
              />
            </label>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-[#38271F]">Warna Segel Lilin</span>
              <div className="flex flex-wrap items-center gap-2">
                {SECRET_NOTE_SEAL_COLORS.map((swatch) => {
                  const selected = editingNote.sealColor === swatch.value;
                  return (
                    <button
                      key={swatch.value}
                      type="button"
                      onClick={() => setEditingNote({ ...editingNote, sealColor: swatch.value })}
                      className={`min-h-[38px] px-2.5 py-1 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                        selected
                          ? 'border-[#38271F] bg-[#EAE0CF] text-[#38271F]'
                          : 'border-[#38271F]/16 bg-[#F4EBDD]/60 text-[#38271F]/75'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: swatch.value }}
                      />
                      <span>{swatch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#38271F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editingNote.enabled}
                onChange={(e) => setEditingNote({ ...editingNote, enabled: e.target.checked })}
                className="w-4 h-4 accent-[#455342] rounded"
              />
              <span className="text-xs font-semibold text-[#38271F]">
                Aktifkan & tampilkan di Our Story ({editingNote.enabled ? 'Aktif' : 'Nonaktif / Draft'})
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openEditorPreview}
                data-testid="preview-secret-note-btn"
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#38271F]/22 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#743D4A]" />
                <span>Pratinjau</span>
              </button>

              <button
                type="button"
                onClick={handleSaveEditor}
                disabled={saving}
                data-testid="save-secret-note-btn"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#384435] disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Secret Note'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Secret Notes List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#38271F]/22 bg-[#FBF6EE] p-6 text-center space-y-2">
            <p className="font-serif text-base text-[#38271F]">
              Belum ada Secret Note {pageFilter === 'all' ? '' : `di Halaman ${pageFilter}`}.
            </p>
            <p className="text-xs text-[#38271F]/65">
              Klik &ldquo;Buat Secret Note&rdquo; di atas untuk menambahkan catatan baru ke halaman Our Story mana pun.
            </p>
          </div>
        )}

        {filteredNotes.map((note) => {
          const isBusy = busyId === note.id;
          const assignedPageTitle = pageTitleByNumber.get(note.pageNumber) || `Halaman ${note.pageNumber}`;
          return (
            <article
              key={note.id}
              data-testid={`secret-note-card-${note.id}`}
              className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#EAE0CF] text-[#38271F] text-[11px] font-semibold">
                    Hal. {String(note.pageNumber).padStart(2, '0')} · {assignedPageTitle}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ${
                      note.enabled
                        ? 'bg-[#455342]/14 text-[#455342]'
                        : 'bg-[#38271F]/10 text-[#38271F]/65'
                    }`}
                  >
                    {note.enabled ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Nonaktif</span>
                      </>
                    )}
                  </span>

                  <span className="text-[10px] uppercase tracking-wider text-[#743D4A] font-medium">
                    ID: {note.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[#F4EBDD] shrink-0"
                    style={{ backgroundColor: note.sealColor }}
                  >
                    <Mail className="w-2.5 h-2.5" />
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-[#38271F] truncate">
                    {note.title}
                  </h3>
                </div>

                <p className="text-xs font-hand text-[#743D4A] text-base leading-none">
                  {note.recipient}
                </p>

                <p className="text-xs sm:text-sm text-[#38271F]/78 line-clamp-2 leading-relaxed">
                  {note.message}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#38271F]/60 pt-0.5">
                  <span>Tanda tangan: {note.signature}</span>
                  <span aria-hidden="true">·</span>
                  <span>Diperbarui: {formatUpdatedTimestamp(note.updatedAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewNote(note)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#38271F]/18 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#743D4A]" />
                  <span>Pratinjau</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleQuickToggle(note)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#38271F]/18 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] disabled:opacity-50 cursor-pointer"
                >
                  {note.enabled ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-[#A6533B]" />
                      <span>Nonaktifkan</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#455342]" />
                      <span>Aktifkan</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => startEdit(note)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#38271F] text-[#F4EBDD] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#4c362c] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setConfirmDeleteNote(note)}
                  aria-label={`Hapus Secret Note ${note.title}`}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#A6533B]/30 text-[#A6533B] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#A6533B]/10 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Exact Stationery Preview Modal */}
      <HiddenEnvelopeModal envelope={previewNote} onClose={() => setPreviewNote(null)} />

      {/* Delete Confirmation Dialog */}
      {confirmDeleteNote && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-secret-note-heading"
          data-testid="delete-secret-note-dialog"
          onClick={() => setConfirmDeleteNote(null)}
          className="fixed inset-0 z-50 bg-[#38271F]/65 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[#38271F]/20 bg-[#FBF6EE] p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <h3
              id="delete-secret-note-heading"
              className="font-serif text-lg font-semibold text-[#38271F]"
            >
              Hapus Secret Note Ini?
            </h3>
            <p className="text-xs sm:text-sm text-[#38271F]/80 leading-relaxed">
              Catatan{' '}
              <strong className="text-[#38271F]">&ldquo;{confirmDeleteNote.title}&rdquo;</strong>{' '}
              di Halaman {confirmDeleteNote.pageNumber} akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteNote(null)}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-[#38271F]/20 text-xs font-semibold text-[#38271F] hover:bg-[#EAE0CF] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busyId === confirmDeleteNote.id}
                onClick={handleConfirmDelete}
                data-testid="confirm-delete-secret-note-btn"
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#A6533B] text-[#F4EBDD] text-xs font-semibold hover:bg-[#8e4530] disabled:opacity-50 cursor-pointer"
              >
                {busyId === confirmDeleteNote.id ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
