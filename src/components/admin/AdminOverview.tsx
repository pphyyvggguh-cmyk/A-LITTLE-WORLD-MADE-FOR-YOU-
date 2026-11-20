import { ChangeEvent, useId, useState } from 'react';
import {
  BookHeart,
  CalendarHeart,
  Disc3,
  ExternalLink,
  Film,
  Flower2,
  FolderOpen,
  Globe2,
  Heart,
  Mail,
  MessageSquareHeart,
  Send,
  Sparkles,
  Upload,
} from 'lucide-react';
import { MediaAssetItem } from '../../utils/adminApi';
import { SiteContentPayload } from '../../utils/adminContent';
import { formatSafeUiError } from '../../utils/safeError';

export type AdminTabId =
  | 'overview'
  | 'story'
  | 'world'
  | 'letters'
  | 'video'
  | 'mini-oktaf'
  | 'voices'
  | 'vinyl'
  | 'wishlist'
  | 'postcards'
  | 'jar'
  | 'heart-gallery'
  | 'media';

interface AdminOverviewProps {
  content: SiteContentPayload;
  mediaCount: number;
  mediaAssets: MediaAssetItem[];
  wishlistCount: number;
  postcardsCount: number;
  jarStats?: { total: number; pending: number; availableInPool: number };
  onSelectTab: (tab: AdminTabId) => void;
  onOpenPublicSite: () => void;
  onImportBackupJson: (raw: unknown) => Promise<{ importedSections: string[]; importedVoices: number }>;
}

export function AdminOverview({
  content,
  mediaCount,
  wishlistCount,
  postcardsCount,
  jarStats,
  onSelectTab,
  onOpenPublicSite,
  onImportBackupJson,
}: AdminOverviewProps) {
  const backupInputId = useId();
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const handleImportJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await onImportBackupJson(parsed);
      setImportStatus({
        type: 'ok',
        text: `Berhasil memigrasikan ${res.importedSections.length} bagian & ${res.importedVoices} Voices ke Cloud Firestore.`,
      });
    } catch (err) {
      setImportStatus({
        type: 'err',
        text: formatSafeUiError(err, 'File JSON cadangan tidak valid.', 'admin'),
      });
    } finally {
      setImporting(false);
    }
  };

  const cards: {
    tab: AdminTabId;
    title: string;
    stat: string;
    detail: string;
    icon: typeof BookHeart;
    accent: string;
  }[] = [
    {
      tab: 'story',
      title: 'Our Story Manager',
      stat: `${content.storyPages.length} Halaman · ${(content.secretNotes || []).length} Secret Notes`,
      detail: 'Edit halaman scrapbook, Polaroid, dan kelola Secret Notes per halaman.',
      icon: BookHeart,
      accent: '#A6533B',
    },
    {
      tab: 'world',
      title: 'Our World Manager',
      stat: `${content.destinations.length} Destinasi`,
      detail: 'Kelola nama kota, cerita impian, stempel, dan foto destinasi.',
      icon: Globe2,
      accent: '#455342',
    },
    {
      tab: 'letters',
      title: 'Birthday Letters Manager',
      stat: `${content.letters.length} Surat`,
      detail: 'Ubah isi surat, tambah surat baru, dan pratinjau sebelum simpan.',
      icon: Mail,
      accent: '#743D4A',
    },
    {
      tab: 'video',
      title: 'Birthday Video Manager',
      stat: content.videoConfig.videoSrc ? 'Video Terpasang' : 'Belum Ada Video',
      detail: 'Ganti file MP4/WEBM, thumbnail poster, dan deskripsi video.',
      icon: Film,
      accent: '#C4A574',
    },
    {
      tab: 'mini-oktaf',
      title: 'Mini Oktaf Dialogue Manager',
      stat: `${Object.keys(content.miniOktaf.sectionDialogues).length} Skenario + ${content.miniOktaf.curiousTapReactions.length} Tap`,
      detail: 'Ubah ucapan Mini Oktaf di tiap halaman tanpa mengubah karakternya.',
      icon: MessageSquareHeart,
      accent: '#38271F',
    },
    {
      tab: 'voices',
      title: 'Voices of Love Manager',
      stat: `${content.voices.length} Sahabat`,
      detail: 'Unggah rekaman MP3 ke Firebase Storage, pilih bunga, atur urutan & pratinjau.',
      icon: Flower2,
      accent: '#743D4A',
    },
    {
      tab: 'vinyl',
      title: 'Vinyl Player Manager',
      stat: `${(content.vinylPlaylist || []).length} Lagu YouTube`,
      detail: 'Kelola playlist YouTube, judul, artis, thumbnail, dan status aktif pemutar vinyl.',
      icon: Disc3,
      accent: '#A6533B',
    },
    {
      tab: 'wishlist',
      title: 'Our Future Wishlist Manager',
      stat: `${wishlistCount} Impian Tersimpan`,
      detail: 'Atur visibilitas Public/Private/Shared, filter pembuat, dan kelola entri wishlist.',
      icon: CalendarHeart,
      accent: '#455342',
    },
    {
      tab: 'postcards',
      title: 'Postcards From The Future Manager',
      stat: `${postcardsCount} Kartu Pos`,
      detail: 'Tulis kartu pos bertanggal buka, kelola segel waktu, foto, motif, dan urutan tampil.',
      icon: Send,
      accent: '#743D4A',
    },
    {
      tab: 'jar',
      title: 'Jar Full of Thoughts Manager',
      stat: `${jarStats?.availableInPool ?? 0} Siap · ${jarStats?.pending ?? 0} Pending`,
      detail: 'Moderasi kiriman teman, salin link publik, tambah pesan manual, & atur cooldown 24 jam.',
      icon: Sparkles,
      accent: '#A6533B',
    },
    {
      tab: 'heart-gallery',
      title: 'Heart Gallery Manager',
      stat: `${(content.heartGallery || []).length} Foto Susunan Hati`,
      detail: 'Kelola foto hadiah Quest 3 (Our Little Heart Gallery), 6 tema bingkai, caption & urutan.',
      icon: Heart,
      accent: '#743D4A',
    },
    {
      tab: 'media',
      title: 'Media Library (Firebase Storage)',
      stat: `${mediaCount} File Terindeks`,
      detail: 'Unggah gambar, audio, video ke Firebase Storage dari HP dan pantau penggunaannya.',
      icon: FolderOpen,
      accent: '#455342',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-5 sm:p-6 shadow-polaroid space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-[#743D4A]">
              Ringkasan Control Room · Terhubung Cloud Firestore & Storage
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#38271F]">
              Semua Bagian Siap Dikelola dari HP
            </h2>
            <p className="mt-1 text-sm text-[#38271F]/72">
              Pembaruan terakhir:{' '}
              <span className="font-medium text-[#38271F]">
                {content.updatedAt
                  ? new Date(content.updatedAt).toLocaleString('id-ID')
                  : 'Default siap digunakan'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label
              htmlFor={backupInputId}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#38271F]/20 bg-[#F4EBDD] text-[#38271F] text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#EAE0CF] cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#A6533B]" />
              <span>{importing ? 'Mengimpor...' : 'Impor Backup JSON'}</span>
            </label>
            <input
              id={backupInputId}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              disabled={importing}
              className="sr-only"
            />

            <button
              type="button"
              onClick={onOpenPublicSite}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#384435] cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Lihat Website Wulan</span>
            </button>
          </div>
        </div>

        {importStatus && (
          <p
            role="status"
            className={`rounded-xl px-3.5 py-2.5 text-xs font-medium ${
              importStatus.type === 'ok'
                ? 'bg-[#455342]/12 text-[#455342]'
                : 'bg-[#A6533B]/12 text-[#A6533B]'
            }`}
          >
            {importStatus.text}
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.tab}
              type="button"
              onClick={() => onSelectTab(card.tab)}
              className="text-left rounded-2xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 sm:p-5 shadow-polaroid hover:shadow-polaroid-lifted transition-shadow flex flex-col justify-between gap-3 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#743D4A]">{card.stat}</span>
                  <Icon className="w-4 h-4 shrink-0" style={{ color: card.accent }} />
                </div>
                <h3 className="mt-1.5 font-serif text-lg font-semibold text-[#38271F]">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs text-[#38271F]/70 leading-relaxed">{card.detail}</p>
              </div>
              <span className="text-xs font-semibold text-[#A6533B]">Buka Pengelola →</span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
