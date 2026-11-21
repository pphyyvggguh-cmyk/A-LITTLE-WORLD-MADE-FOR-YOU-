import { ChangeEvent, FormEvent, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  EyeOff,
  Flower2,
  Heart,
  MailCheck,
  Mic,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  DEFAULT_JAR_SETTINGS,
  getJarPaperStyleOption,
  JAR_LIMITS,
  JAR_PAPER_STYLES,
  JarFeatureSettings,
  JarPaperStyle,
} from '../data/jarOfThoughts';
import {
  VOICE_FLOWER_OPTIONS,
  VOICE_FLOWER_QUANTITY_MAX,
  VOICE_FLOWER_QUANTITY_MIN,
  VOICE_SUBMISSION_LIMITS,
  type VoiceFlowerType,
} from '../data/voices';
import { VoiceBouquetDisplay } from '../components/voices/VoiceBouquetDisplay';
import { VoiceFlowerSVG } from '../components/voices/VoiceFlowerSVG';
import { formatAudioTime } from '../utils/adminContent';
import { EASE_OUT_EXPO } from '../utils/animation';
import { fetchJarSettings } from '../utils/jarApi';
import { resolveDisplayAuthor, validateJarSubmissionInput } from '../utils/jarOfThoughts';
import { formatSafeUiError, PUBLIC_JAR_SUBMIT_ERROR } from '../utils/safeError';
import {
  clampFlowerQuantity,
  CONTRIBUTION_CONSENT_PROMPT,
  type ConsentChoice,
  validatePublicAudioFileMeta,
  validateVoiceContributionInput,
} from '../utils/unifiedContribution';
import { submitUnifiedContribution } from '../utils/unifiedContributionApi';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}

type SubmitStage = 'form' | 'sealing' | 'sent' | 'declined';
type AudioSourceMode = 'record' | 'upload';

function pickSupportedRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime));
}

export function LeaveAThoughtPage() {
  const reducedMotion = usePrefersReducedMotion();

  // Field IDs
  const initialInputId = useId();
  const anonymousCheckId = useId();
  const messageInputId = useId();
  const voiceNameInputId = useId();
  const voiceCaptionInputId = useId();
  const audioFileInputId = useId();

  const [settings, setSettings] = useState<JarFeatureSettings>(DEFAULT_JAR_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Section 1: Jar of Thoughts
  const [senderInitial, setSenderInitial] = useState('');
  const [message, setMessage] = useState('');
  const [paperStyle, setPaperStyle] = useState<JarPaperStyle>('ivory-linen');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Section 2: Voices of Love
  const [voiceSenderName, setVoiceSenderName] = useState('');
  const [flowerType, setFlowerType] = useState<VoiceFlowerType>('sakura');
  const [flowerQuantity, setFlowerQuantity] = useState<number>(1);
  const [voiceCaption, setVoiceCaption] = useState('');

  // Audio recording / upload state
  const [audioMode, setAudioMode] = useState<AudioSourceMode>('record');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [audioDurationSec, setAudioDurationSec] = useState(0);
  const [audioError, setAudioError] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Section 3: Final Consent
  const [consent, setConsent] = useState<ConsentChoice>(null);

  // Submission lifecycle
  const [stage, setStage] = useState<SubmitStage>('form');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorSection, setErrorSection] = useState<'jar' | 'voices' | 'consent' | null>(null);
  const [submittedSummary, setSubmittedSummary] = useState<{
    jarAuthor: string;
    voiceName: string;
    flowerLabel: string;
    flowerQuantity: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetchJarSettings()
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingSettings(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Revoke previous object URL safely
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  // Stop any lingering media tracks/timers on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) {
        window.clearInterval(recordTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const selectedStyle = getJarPaperStyleOption(paperStyle);
  const selectedFlowerOption =
    VOICE_FLOWER_OPTIONS.find((item) => item.id === flowerType) ?? VOICE_FLOWER_OPTIONS[0];

  const previewJarAuthor = resolveDisplayAuthor({
    senderInitial: senderInitial || 'Sahabat',
    isAnonymous,
  });

  const clearAudioSelection = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioBlob(null);
    setAudioFileName('');
    setAudioPreviewUrl('');
    setAudioDurationSec(0);
    setAudioError('');
    setIsPreviewPlaying(false);
  };

  const applyNewAudioBlob = (blob: Blob, filename: string, approxDurationSec = 0) => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    const nextUrl = URL.createObjectURL(blob);
    setAudioBlob(blob);
    setAudioFileName(filename);
    setAudioPreviewUrl(nextUrl);
    setAudioDurationSec(approxDurationSec);
    setAudioError('');
    setErrorMsg('');
  };

  const handleStartRecording = async () => {
    if (isRecording || submitting) return;
    setAudioError('');
    setErrorMsg('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setAudioError(
        'Browser ini belum mendukung rekaman mikrofon langsung. Silakan gunakan tab "Unggah File Audio" di sebelah ya.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = pickSupportedRecorderMime();
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000,
      });

      recordChunksRef.current = [];
      let elapsed = 0;
      setRecordingSec(0);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        if (recordTimerRef.current) {
          window.clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setIsRecording(false);

        const resolvedMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(recordChunksRef.current, { type: resolvedMime });
        if (blob.size <= 0) {
          setAudioError('Rekaman suara kosong. Coba rekam beberapa detik lagi ya.');
          return;
        }
        const ext = resolvedMime.includes('ogg')
          ? '.ogg'
          : resolvedMime.includes('mp4')
            ? '.m4a'
            : '.webm';
        const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
        applyNewAudioBlob(blob, `rekaman-suara-${stamp}${ext}`, elapsed);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);

      recordTimerRef.current = window.setInterval(() => {
        elapsed += 1;
        setRecordingSec(elapsed);
        if (elapsed >= 120) {
          recorder.stop();
        }
      }, 1000);
    } catch {
      setIsRecording(false);
      setAudioError(
        'Izin mikrofon ditolak atau perangkat audio tidak ditemukan. Kamu tetap bisa memilih "Unggah File Audio".'
      );
    }
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    mediaRecorderRef.current.stop();
  };

  const handleAudioFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const check = validatePublicAudioFileMeta(file.name, file.type, file.size);
    if (!check.ok) {
      setAudioError(check.error);
      return;
    }

    applyNewAudioBlob(file, file.name, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || isRecording) return;

    setErrorMsg('');
    setErrorSection(null);

    // Explicitly choosing TIDAK submits nothing and creates zero records
    if (consent === 'TIDAK') {
      setStage('declined');
      return;
    }

    const jarCheck = validateJarSubmissionInput({
      senderInitial,
      message,
      paperStyle,
      isAnonymous,
    });
    if (!jarCheck.ok) {
      setErrorSection('jar');
      setErrorMsg(jarCheck.error);
      return;
    }

    const voiceCheck = validateVoiceContributionInput({
      senderName: voiceSenderName,
      flowerType,
      flowerQuantity,
      caption: voiceCaption,
      hasAudio: Boolean(audioBlob && audioBlob.size > 0),
      audioFileName: audioFileName || 'voice-note.webm',
      audioDurationSec,
    });
    if (!voiceCheck.ok) {
      setErrorSection('voices');
      setErrorMsg(voiceCheck.error);
      return;
    }

    if (consent !== 'YA') {
      setErrorSection('consent');
      setErrorMsg('Pilih persetujuan YA atau TIDAK pada bagian akhir sebelum mengirim.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(8);
    try {
      const result = await submitUnifiedContribution({
        jarDraft: {
          senderInitial,
          message,
          paperStyle,
          isAnonymous,
        },
        voiceDraft: {
          senderName: voiceSenderName,
          flowerType,
          flowerQuantity,
          caption: voiceCaption,
          hasAudio: Boolean(audioBlob && audioBlob.size > 0),
          audioFileName,
          audioDurationSec,
        },
        audioBlob,
        consent,
        onAudioProgress: (pct) => setUploadProgress(pct),
      });

      if (!result.submitted) {
        setStage('declined');
        return;
      }

      setSubmittedSummary({
        jarAuthor: resolveDisplayAuthor({
          senderInitial: jarCheck.data.senderInitial,
          isAnonymous: jarCheck.data.isAnonymous,
        }),
        voiceName: voiceCheck.data.senderName,
        flowerLabel: selectedFlowerOption.label,
        flowerQuantity: voiceCheck.data.flowerQuantity,
      });

      if (!reducedMotion) {
        setStage('sealing');
        await new Promise((r) => window.setTimeout(r, 950));
      }
      setStage('sent');
    } catch (err) {
      setErrorMsg(formatSafeUiError(err, PUBLIC_JAR_SUBMIT_ERROR, 'public'));
      setStage('form');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleResetAll = () => {
    setSenderInitial('');
    setMessage('');
    setPaperStyle('ivory-linen');
    setIsAnonymous(false);
    setVoiceSenderName('');
    setFlowerType('sakura');
    setFlowerQuantity(1);
    setVoiceCaption('');
    clearAudioSelection();
    setConsent(null);
    setErrorMsg('');
    setErrorSection(null);
    setStage('form');
  };

  return (
    <main
      data-testid="leave-a-thought-page"
      className="paper-canvas min-h-[100dvh] w-full text-[#30272A] px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-3xl space-y-6">
        {/* Quiet Public Header — Zero Links to Protected Book or Admin */}
        <header className="text-center space-y-2.5 max-w-2xl mx-auto">
          <p className="editorial-kicker">
            Titipan Pesan & Suara Sahabat · Hadiah Untuk Wulan
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#30272A] tracking-tight text-balance">
            Leave a Thought & Voice for Wulan ♡
          </h1>
          <p className="text-sm sm:text-[15px] text-[#6E5F63] leading-relaxed">
            Satu halaman istimewa untuk menitipkan pesan kertas ke dalam <strong>A Jar Full of Thoughts</strong> sekaligus rangkaian bunga suara di <strong>Voices of Love</strong>.
          </p>
        </header>

        <section
          aria-label="Formulir Kontribusi Terpadu Untuk Wulan"
          className="paper-sheet p-5 sm:p-8 shadow-polaroid"
        >
          {loadingSettings ? (
            <div className="py-12 text-center text-sm text-[#38271F]/68">
              Menyiapkan lembar kertas dan pita suara...
            </div>
          ) : !settings.enabled ? (
            <div className="py-10 text-center space-y-3 max-w-md mx-auto">
              <p className="font-serif text-2xl font-semibold text-[#38271F]">
                Pengumpulan Kontribusi Sedang Ditutup Sementara
              </p>
              <p className="text-sm text-[#38271F]/72 leading-relaxed">
                Penitipan pesan dan suara baru sedang diistirahatkan sementara waktu. Terima kasih banyak atas niat hangatmu untuk Wulan ♡
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {stage === 'sealing' && (
                <motion.div
                  key="sealing"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.38, ease: EASE_OUT_EXPO }}
                  className="py-16 flex flex-col items-center text-center gap-4"
                >
                  <motion.div
                    animate={
                      reducedMotion
                        ? undefined
                        : {
                            y: [0, -10, 0],
                            rotate: [0, -3, 2, 0],
                            scale: [1, 1.06, 0.96],
                          }
                    }
                    transition={{ duration: 0.85, ease: 'easeInOut' }}
                    className="w-20 h-20 rounded-2xl border border-[#743D4A]/25 bg-[#F4EBDD] flex items-center justify-center shadow-sm"
                  >
                    <MailCheck className="w-9 h-9 text-[#A6533B]" />
                  </motion.div>
                  <div className="space-y-1">
                    <p className="font-serif text-2xl font-semibold text-[#38271F]">
                      Melipat Surat & Merangkai Bunga Suaramu...
                    </p>
                    <p className="text-xs text-[#38271F]/68">
                      Menyimpan kedua bagian secara aman ke antrean moderasi ♡
                    </p>
                  </div>
                </motion.div>
              )}

              {stage === 'sent' && (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                  data-testid="leave-thought-success"
                  className="py-8 sm:py-10 flex flex-col items-center text-center gap-5 max-w-lg mx-auto"
                >
                  <div className="w-16 h-16 rounded-full bg-[#455342]/12 border border-[#455342]/25 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-[#743D4A] fill-[#E8BFC5]" />
                  </div>

                  <div className="space-y-2">
                    <p className="editorial-kicker">Terkirim Utuh & Aman</p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#38271F]">
                      Terima kasih sudah ikut merayakan hari Wulan ♡
                    </h2>
                    <p className="text-sm text-[#38271F]/76 leading-relaxed">
                      Surat untuk toples kaca (atas nama{' '}
                      <span className="font-semibold text-[#743D4A]">
                        {submittedSummary?.jarAuthor}
                      </span>
                      ) dan ucapan suara{' '}
                      <span className="font-semibold text-[#455342]">
                        {submittedSummary?.flowerQuantity} × {submittedSummary?.flowerLabel}
                      </span>{' '}
                      dari{' '}
                      <span className="font-semibold text-[#38271F]">
                        {submittedSummary?.voiceName}
                      </span>{' '}
                      kini tersimpan aman menunggu peninjauan sebelum tayang.
                    </p>
                  </div>

                  <button
                    type="button"
                    data-testid="leave-thought-again-btn"
                    onClick={handleResetAll}
                    className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-sm font-medium hover:bg-[#3f202c] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#EBC9CB]" />
                    <span>Kirim Satu Kontribusi Lagi</span>
                  </button>
                </motion.div>
              )}

              {stage === 'declined' && (
                <motion.div
                  key="declined"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                  data-testid="leave-thought-declined"
                  className="py-8 sm:py-10 flex flex-col items-center text-center gap-5 max-w-md mx-auto"
                >
                  <div className="w-15 h-15 rounded-full bg-[#EAE0CF] border border-[#38271F]/15 flex items-center justify-center">
                    <XCircle className="w-7 h-7 text-[#743D4A]" />
                  </div>
                  <div className="space-y-2">
                    <p className="editorial-kicker">Tidak Ada Yang Dikirim</p>
                    <h2 className="font-serif text-2xl font-semibold text-[#38271F]">
                      Pilihanmu Dihormati ♡
                    </h2>
                    <p className="text-sm text-[#38271F]/74 leading-relaxed">
                      Karena kamu memilih <strong>TIDAK</strong>, baik pesan maupun rekaman suaramu tidak dikirim ke database maupun ruang moderasi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConsent(null);
                      setStage('form');
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#38271F]/22 text-sm font-medium text-[#38271F] hover:bg-[#EAE0CF]/60 transition-colors cursor-pointer"
                  >
                    Kembali ke Formulir
                  </button>
                </motion.div>
              )}

              {stage === 'form' && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-8"
                  noValidate
                >
                  {/* ========================================================= */}
                  {/* SECTION 1: A JAR FULL OF THOUGHTS                          */}
                  {/* ========================================================= */}
                  <div
                    data-testid="section-jar-thoughts"
                    className={`rounded-2xl border p-4 sm:p-6 space-y-5 bg-[#FFFDFC]/60 ${
                      errorSection === 'jar'
                        ? 'border-[#A6533B]/65 ring-1 ring-[#A6533B]/30'
                        : 'border-[#38271F]/12'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
                      <div>
                        <p className="editorial-kicker text-[10px]">Bagian 1 · Wajib Diisi</p>
                        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#38271F]">
                          A Jar Full of Thoughts ♡
                        </h2>
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#F4EBDD] border border-[#38271F]/12 text-[#743D4A]">
                        Catatan Kertas Harian
                      </span>
                    </div>

                    {/* Sender Initial + Anonymous Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                      <div className="sm:col-span-7 space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <label
                            htmlFor={initialInputId}
                            className="text-xs font-semibold uppercase tracking-wider text-[#38271F]"
                          >
                            Inisial / Panggilan Pengirim *
                          </label>
                          <span className="text-[11px] text-[#38271F]/58 tabular-nums">
                            {senderInitial.length}/{JAR_LIMITS.SENDER_INITIAL_MAX}
                          </span>
                        </div>
                        <input
                          id={initialInputId}
                          type="text"
                          value={senderInitial}
                          onChange={(e) => {
                            setSenderInitial(e.target.value.slice(0, JAR_LIMITS.SENDER_INITIAL_MAX));
                            if (errorSection === 'jar') {
                              setErrorSection(null);
                              setErrorMsg('');
                            }
                          }}
                          maxLength={JAR_LIMITS.SENDER_INITIAL_MAX}
                          placeholder="Contoh: R, A.N, atau Sahabat"
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#38271F]/18 bg-[#F4EBDD]/45 text-sm text-[#38271F] placeholder:text-[#38271F]/40 focus:outline-none focus:ring-2 focus:ring-[#A6533B]/35"
                        />
                        <p className="text-[11px] text-[#38271F]/60">
                          1–12 karakter seperti tanda tangan di lipatan surat toples.
                        </p>
                      </div>

                      <div className="sm:col-span-5 sm:pt-6">
                        <label
                          htmlFor={anonymousCheckId}
                          className="flex items-start gap-2.5 p-3 rounded-lg border border-[#38271F]/14 bg-[#F4EBDD]/55 cursor-pointer hover:bg-[#EAE0CF]/65 transition-colors min-h-[44px]"
                        >
                          <input
                            id={anonymousCheckId}
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#743D4A] rounded cursor-pointer shrink-0"
                          />
                          <span className="text-xs leading-snug text-[#38271F]">
                            <span className="font-semibold inline-flex items-center gap-1">
                              <EyeOff className="w-3 h-3 text-[#743D4A]" />
                              <span>Kirim surat sebagai Anonim</span>
                            </span>
                            <span className="block text-[11px] text-[#38271F]/65 mt-0.5">
                              Ditampilkan sebagai “Someone Special” di toples
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* 5 Paper Styles */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#38271F]">
                          Pilih Gaya Kertas Surat
                        </span>
                        <span className="text-[11px] text-[#743D4A] font-medium">
                          {selectedStyle.label}
                        </span>
                      </div>

                      <div
                        role="group"
                        aria-label="Pilihan warna kertas surat"
                        className="grid grid-cols-2 sm:grid-cols-5 gap-2"
                      >
                        {JAR_PAPER_STYLES.map((style) => {
                          const active = paperStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setPaperStyle(style.id)}
                              aria-pressed={active}
                              className={`min-h-[52px] p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                active
                                  ? 'ring-2 ring-[#38271F]/70 shadow-sm'
                                  : 'opacity-85 hover:opacity-100'
                              }`}
                              style={{
                                backgroundColor: style.paperBg,
                                borderColor: active ? style.accentColor : style.borderColor,
                                color: style.inkColor,
                              }}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className="w-3.5 h-3.5 rounded-sm border"
                                  style={{
                                    backgroundColor: style.foldShadow,
                                    borderColor: style.accentColor,
                                  }}
                                />
                                {active && <Check className="w-3.5 h-3.5" style={{ color: style.accentColor }} />}
                              </div>
                              <span className="text-[11px] font-semibold leading-tight truncate">
                                {style.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message Box + Live Stationery Preview */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <label
                          htmlFor={messageInputId}
                          className="text-xs font-semibold uppercase tracking-wider text-[#38271F]"
                        >
                          Pesan / Doa Hangatmu Untuk Toples *
                        </label>
                        <span className="text-[11px] text-[#38271F]/58 tabular-nums">
                          {message.length}/{JAR_LIMITS.MESSAGE_MAX}
                        </span>
                      </div>

                      <div
                        className="rounded-xl border p-4 transition-colors space-y-2.5"
                        style={{
                          backgroundColor: selectedStyle.paperBg,
                          borderColor: selectedStyle.borderColor,
                          color: selectedStyle.inkColor,
                        }}
                      >
                        <textarea
                          id={messageInputId}
                          value={message}
                          onChange={(e) => {
                            setMessage(e.target.value.slice(0, JAR_LIMITS.MESSAGE_MAX));
                            if (errorSection === 'jar') {
                              setErrorSection(null);
                              setErrorMsg('');
                            }
                          }}
                          rows={4}
                          maxLength={JAR_LIMITS.MESSAGE_MAX}
                          placeholder="Tulis pesan tulus, harapan ulang tahun, atau kenangan hangat buat Wulan..."
                          className="w-full bg-transparent text-sm sm:text-[15px] leading-relaxed placeholder:text-[#38271F]/38 focus:outline-none resize-y"
                        />

                        <div className="pt-2 border-t border-[#38271F]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-hand text-lg text-[#743D4A]">
                            — Dari: {previewJarAuthor}
                          </span>
                          <span className="text-[11px] text-[#38271F]/58">
                            {selectedStyle.subtitle}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* SECTION 2: VOICES OF LOVE (NON-ANONYMOUS + BOUQUET)       */}
                  {/* ========================================================= */}
                  <div
                    data-testid="section-voices-of-love"
                    className={`rounded-2xl border p-4 sm:p-6 space-y-5 bg-[#FFFDFC]/60 ${
                      errorSection === 'voices'
                        ? 'border-[#A6533B]/65 ring-1 ring-[#A6533B]/30'
                        : 'border-[#38271F]/12'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#38271F]/10">
                      <div>
                        <p className="editorial-kicker text-[10px]">Bagian 2 · Wajib Diisi</p>
                        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#38271F]">
                          Voices of Love ♡
                        </h2>
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#455342]/12 border border-[#455342]/20 text-[#455342]">
                        Tidak Boleh Anonim
                      </span>
                    </div>

                    {/* Required Sender Name / Initials (Non-anonymous) */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <label
                          htmlFor={voiceNameInputId}
                          className="text-xs font-semibold uppercase tracking-wider text-[#38271F]"
                        >
                          Nama / Inisial Pengirim Ucapan Suara *
                        </label>
                        <span className="text-[11px] text-[#38271F]/58 tabular-nums">
                          {voiceSenderName.length}/{VOICE_SUBMISSION_LIMITS.SENDER_NAME_MAX}
                        </span>
                      </div>
                      <input
                        id={voiceNameInputId}
                        type="text"
                        value={voiceSenderName}
                        onChange={(e) => {
                          setVoiceSenderName(
                            e.target.value.slice(0, VOICE_SUBMISSION_LIMITS.SENDER_NAME_MAX)
                          );
                          if (errorSection === 'voices') {
                            setErrorSection(null);
                            setErrorMsg('');
                          }
                        }}
                        maxLength={VOICE_SUBMISSION_LIMITS.SENDER_NAME_MAX}
                        placeholder="Tulis nama panggilan atau inisial aslimu (contoh: Dinda, Raka, Kak Tia)"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#38271F]/18 bg-[#F4EBDD]/45 text-sm text-[#38271F] placeholder:text-[#38271F]/40 focus:outline-none focus:ring-2 focus:ring-[#455342]/35"
                      />
                      <p className="text-[11px] text-[#38271F]/62">
                        Bagian Voices of Love wajib menyertakan nama/inisial pengirim agar Wulan tahu suara sahabat yang sedang didengarkannya.
                      </p>
                    </div>

                    {/* Audio Input: Direct Recording OR File Upload */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#38271F]">
                          Rekaman Ucapan Suara *
                        </span>
                        <div
                          role="tablist"
                          aria-label="Metode input audio"
                          className="inline-flex rounded-lg border border-[#38271F]/16 bg-[#F4EBDD]/70 p-0.5"
                        >
                          <button
                            type="button"
                            role="tab"
                            aria-selected={audioMode === 'record'}
                            onClick={() => setAudioMode('record')}
                            className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              audioMode === 'record'
                                ? 'bg-[#552E3D] text-[#FFFDFC]'
                                : 'text-[#38271F]/75 hover:text-[#38271F]'
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>Rekam Langsung</span>
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={audioMode === 'upload'}
                            onClick={() => setAudioMode('upload')}
                            className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              audioMode === 'upload'
                                ? 'bg-[#552E3D] text-[#FFFDFC]'
                                : 'text-[#38271F]/75 hover:text-[#38271F]'
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah File Audio</span>
                          </button>
                        </div>
                      </div>

                      {audioMode === 'record' ? (
                        <div className="rounded-xl border border-[#38271F]/15 bg-[#F4EBDD]/45 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[#38271F]">
                              {isRecording
                                ? `Sedang merekam... (${formatAudioTime(recordingSec)})`
                                : audioBlob
                                  ? 'Rekaman suara siap diputar!'
                                  : 'Rekam ucapan hangatmu langsung dari mikrofon'}
                            </p>
                            <p className="text-[11px] text-[#38271F]/62">
                              Durasi ideal 5–60 detik dengan suara yang jelas.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!isRecording ? (
                              <button
                                type="button"
                                data-testid="voice-record-start-btn"
                                onClick={handleStartRecording}
                                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#A6533B] text-[#FFFDFC] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#8e442f] cursor-pointer"
                              >
                                <Mic className="w-4 h-4" />
                                <span>{audioBlob ? 'Rekam Ulang' : 'Mulai Rekam'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                data-testid="voice-record-stop-btn"
                                onClick={handleStopRecording}
                                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#38271F] text-[#FFFDFC] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#2a1d17] cursor-pointer animate-pulse"
                              >
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Selesai Rekam</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#38271F]/25 bg-[#F4EBDD]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <label
                              htmlFor={audioFileInputId}
                              className="text-sm font-medium text-[#38271F] block"
                            >
                              Pilih berkas rekaman dari perangkatmu
                            </label>
                            <p className="text-[11px] text-[#38271F]/62">
                              Mendukung MP3, OGG, WEBM, M4A, AAC, dan WAV (maks. 15 MB).
                            </p>
                          </div>
                          <label
                            htmlFor={audioFileInputId}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#455342] text-[#F4EBDD] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#374334] cursor-pointer shrink-0"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Pilih File Audio</span>
                            <input
                              id={audioFileInputId}
                              data-testid="voice-audio-file-input"
                              type="file"
                              accept=".mp3,.ogg,.webm,.m4a,.aac,.wav,audio/*"
                              onChange={handleAudioFileChange}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      )}

                      {audioError && (
                        <p role="alert" className="text-xs font-medium text-[#A6533B]">
                          {audioError}
                        </p>
                      )}

                      {/* Live Audio Preview Player */}
                      {audioPreviewUrl && (
                        <div
                          data-testid="voice-audio-preview-box"
                          className="rounded-xl border border-[#455342]/25 bg-[#F2F5F0] p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[#2E392C] inline-flex items-center gap-1.5 truncate">
                              <Volume2 className="w-4 h-4 text-[#455342] shrink-0" />
                              <span className="truncate">{audioFileName}</span>
                            </span>
                            <button
                              type="button"
                              onClick={clearAudioSelection}
                              aria-label="Hapus audio terpilih"
                              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#38271F]/15 text-[11px] font-medium text-[#A6533B] hover:bg-[#A6533B]/10 inline-flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                          <audio
                            ref={previewAudioRef}
                            src={audioPreviewUrl}
                            controls
                            onPlay={() => setIsPreviewPlaying(true)}
                            onPause={() => setIsPreviewPlaying(false)}
                            onEnded={() => setIsPreviewPlaying(false)}
                            onLoadedMetadata={() => {
                              const el = previewAudioRef.current;
                              if (el && Number.isFinite(el.duration) && el.duration > 0) {
                                setAudioDurationSec(Math.round(el.duration));
                              }
                            }}
                            className="w-full h-10"
                          />
                        </div>
                      )}
                    </div>

                    {/* Flower Design & Quantity Selection */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#38271F] inline-flex items-center gap-1.5">
                          <Flower2 className="w-3.5 h-3.5 text-[#743D4A]" />
                          <span>Pilih Desain & Jumlah Bunga *</span>
                        </span>
                        <span className="text-[11px] font-medium text-[#743D4A]">
                          {flowerQuantity} × {selectedFlowerOption.label}
                        </span>
                      </div>

                      <div
                        role="group"
                        aria-label="Pilihan desain bunga"
                        className="grid grid-cols-2 sm:grid-cols-5 gap-2"
                      >
                        {VOICE_FLOWER_OPTIONS.map((opt) => {
                          const active = flowerType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              data-testid={`flower-option-${opt.id}`}
                              onClick={() => setFlowerType(opt.id)}
                              aria-pressed={active}
                              className={`min-h-[78px] p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                active
                                  ? 'border-[#552E3D] bg-[#FBF6EE] ring-2 ring-[#552E3D]/35 shadow-sm'
                                  : 'border-[#38271F]/14 bg-[#F4EBDD]/35 hover:bg-[#F4EBDD]/70'
                              }`}
                            >
                              <VoiceFlowerSVG flowerType={opt.id} className="w-9 h-9" />
                              <span className="text-[11px] font-semibold text-[#38271F] leading-tight">
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Quantity Stepper (1-5 flowers) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#38271F]/14 bg-[#F4EBDD]/45 px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold text-[#38271F]">
                            Jumlah Tangkai Bunga ({VOICE_FLOWER_QUANTITY_MIN}–{VOICE_FLOWER_QUANTITY_MAX})
                          </p>
                          <p className="text-[11px] text-[#38271F]/62">
                            Jumlah & desain ini akan tampil persis di halaman Voices of Love.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            data-testid="flower-qty-minus"
                            aria-label="Kurangi jumlah bunga"
                            disabled={flowerQuantity <= VOICE_FLOWER_QUANTITY_MIN}
                            onClick={() =>
                              setFlowerQuantity((q) => clampFlowerQuantity(q - 1))
                            }
                            className="w-10 h-10 rounded-lg border border-[#38271F]/18 bg-[#FFFDFC] flex items-center justify-center text-[#38271F] hover:bg-[#EAE0CF] disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span
                            data-testid="flower-qty-value"
                            className="w-8 text-center font-serif text-lg font-semibold text-[#552E3D] tabular-nums"
                          >
                            {flowerQuantity}
                          </span>
                          <button
                            type="button"
                            data-testid="flower-qty-plus"
                            aria-label="Tambah jumlah bunga"
                            disabled={flowerQuantity >= VOICE_FLOWER_QUANTITY_MAX}
                            onClick={() =>
                              setFlowerQuantity((q) => clampFlowerQuantity(q + 1))
                            }
                            className="w-10 h-10 rounded-lg border border-[#38271F]/18 bg-[#FFFDFC] flex items-center justify-center text-[#38271F] hover:bg-[#EAE0CF] disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Optional Short Caption */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <label
                          htmlFor={voiceCaptionInputId}
                          className="text-xs font-semibold uppercase tracking-wider text-[#38271F]"
                        >
                          Catatan Singkat Di Kartu Suara (Opsional)
                        </label>
                        <span className="text-[11px] text-[#38271F]/58 tabular-nums">
                          {voiceCaption.length}/{VOICE_SUBMISSION_LIMITS.CAPTION_MAX}
                        </span>
                      </div>
                      <input
                        id={voiceCaptionInputId}
                        type="text"
                        value={voiceCaption}
                        onChange={(e) =>
                          setVoiceCaption(
                            e.target.value.slice(0, VOICE_SUBMISSION_LIMITS.CAPTION_MAX)
                          )
                        }
                        maxLength={VOICE_SUBMISSION_LIMITS.CAPTION_MAX}
                        placeholder="Misal: Selamat ulang tahun Wulan, semoga selalu bahagia!"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#38271F]/18 bg-[#F4EBDD]/45 text-sm text-[#38271F] placeholder:text-[#38271F]/40 focus:outline-none focus:ring-2 focus:ring-[#455342]/35"
                      />
                    </div>

                    {/* Live Bouquet & Card Preview */}
                    <div
                      data-testid="voice-bouquet-preview-card"
                      className="rounded-xl border border-[#38271F]/14 bg-[#FBF6EE] p-4 flex items-center gap-4"
                    >
                      <VoiceBouquetDisplay
                        flowerType={flowerType}
                        quantity={flowerQuantity}
                        isPlaying={isPreviewPlaying}
                        size="lg"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="editorial-kicker text-[10px]">
                          Pratinjau Kartu Suara · {flowerQuantity} × {selectedFlowerOption.label}
                        </p>
                        <p className="font-serif text-lg font-semibold text-[#38271F] truncate">
                          {voiceSenderName.trim() || 'Namamu Akan Tampil Di Sini'}
                        </p>
                        {voiceCaption.trim() && (
                          <p className="font-hand text-lg text-[#743D4A] leading-snug line-clamp-2">
                            “{voiceCaption.trim()}”
                          </p>
                        )}
                        <p className="text-[11px] text-[#38271F]/62">
                          {audioBlob
                            ? `Audio siap (${audioFileName})`
                            : 'Menunggu rekaman atau unggahan audio'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* SECTION 3: FINAL CONSENT STEP (YA / TIDAK)               */}
                  {/* ========================================================= */}
                  <div
                    data-testid="section-final-consent"
                    className={`rounded-2xl border p-4 sm:p-6 space-y-4 bg-[#F4EBDD]/60 ${
                      errorSection === 'consent'
                        ? 'border-[#A6533B]/70 ring-1 ring-[#A6533B]/35'
                        : 'border-[#743D4A]/22'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#743D4A]/12 border border-[#743D4A]/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-[#743D4A]" />
                      </div>
                      <div className="space-y-1">
                        <p className="editorial-kicker text-[10px]">Persetujuan Akhir</p>
                        <p className="font-serif text-base sm:text-lg font-semibold text-[#38271F] leading-snug">
                          {CONTRIBUTION_CONSENT_PROMPT}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        data-testid="consent-yes-btn"
                        aria-pressed={consent === 'YA'}
                        onClick={() => {
                          setConsent('YA');
                          if (errorSection === 'consent') {
                            setErrorSection(null);
                            setErrorMsg('');
                          }
                        }}
                        className={`min-h-[52px] px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          consent === 'YA'
                            ? 'bg-[#455342] border-[#455342] text-[#F4EBDD] shadow-sm'
                            : 'bg-[#FFFDFC] border-[#38271F]/18 text-[#38271F] hover:bg-[#F2F5F0]'
                        }`}
                      >
                        <div>
                          <span className="text-sm font-bold block">YA, Saya Bersedia</span>
                          <span
                            className={`text-[11px] block ${
                              consent === 'YA' ? 'text-[#F4EBDD]/85' : 'text-[#38271F]/65'
                            }`}
                          >
                            Kirim pesan & suara ke ruang peninjauan admin
                          </span>
                        </div>
                        {consent === 'YA' && <Check className="w-5 h-5 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        data-testid="consent-no-btn"
                        aria-pressed={consent === 'TIDAK'}
                        onClick={() => {
                          setConsent('TIDAK');
                          setErrorSection(null);
                          setErrorMsg('');
                        }}
                        className={`min-h-[52px] px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          consent === 'TIDAK'
                            ? 'bg-[#743D4A] border-[#743D4A] text-[#FFFDFC] shadow-sm'
                            : 'bg-[#FFFDFC] border-[#38271F]/18 text-[#38271F] hover:bg-[#FAF0F2]'
                        }`}
                      >
                        <div>
                          <span className="text-sm font-bold block">TIDAK</span>
                          <span
                            className={`text-[11px] block ${
                              consent === 'TIDAK' ? 'text-[#FFFDFC]/85' : 'text-[#38271F]/65'
                            }`}
                          >
                            Jangan kirim atau simpan data apa pun
                          </span>
                        </div>
                        {consent === 'TIDAK' && <XCircle className="w-5 h-5 shrink-0" />}
                      </button>
                    </div>

                    {consent === 'TIDAK' && (
                      <p className="text-xs text-[#743D4A] font-medium">
                        Jika kamu memilih TIDAK, tidak ada pesan atau audio yang akan dikirim ke sistem.
                      </p>
                    )}
                  </div>

                  {errorMsg && (
                    <p
                      role="alert"
                      data-testid="leave-thought-error"
                      className="rounded-xl border border-[#A6533B]/35 bg-[#A6533B]/10 px-4 py-3 text-xs font-medium text-[#A6533B]"
                    >
                      {errorMsg}
                    </p>
                  )}

                  {submitting && uploadProgress > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-[#38271F]/70">
                        <span>Mengunggah suara & mengirim kontribusi utuh...</span>
                        <span className="tabular-nums">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#EAE0CF] overflow-hidden">
                        <div
                          className="h-full bg-[#455342] transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-[#38271F]/62 leading-relaxed">
                      Semua kiriman ditinjau terlebih dahulu oleh admin sebelum muncul di website Wulan.
                    </p>

                    <button
                      type="submit"
                      data-testid="leave-thought-submit-btn"
                      disabled={submitting || isRecording}
                      className={`min-h-[48px] px-6 py-3 rounded-xl text-sm font-medium active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 shadow-polaroid cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 ${
                        consent === 'TIDAK'
                          ? 'bg-[#743D4A] text-[#FFFDFC] hover:bg-[#5e2f3a]'
                          : 'bg-[#552E3D] text-[#FFFDFC] hover:bg-[#3f202c]'
                      }`}
                    >
                      {consent === 'TIDAK' ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Konfirmasi Tidak Mengirim</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-[#EBC9CB]" />
                          <span>
                            {submitting
                              ? 'Mengirim Kedua Bagian...'
                              : 'Kirim Pesan & Suara ♡'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </section>

        <footer className="text-center text-[11px] text-[#38271F]/55">
          A Little World Made For You ♡ · Titipan Pesan & Suara Untuk Wulan
        </footer>
      </div>
    </main>
  );
}
