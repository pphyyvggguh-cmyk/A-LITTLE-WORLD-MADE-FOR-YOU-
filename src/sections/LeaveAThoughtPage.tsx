import { FormEvent, useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, EyeOff, Heart, MailCheck, Send, Sparkles } from 'lucide-react';
import {
  DEFAULT_JAR_SETTINGS,
  getJarPaperStyleOption,
  JAR_LIMITS,
  JAR_PAPER_STYLES,
  JarFeatureSettings,
  JarPaperStyle,
} from '../data/jarOfThoughts';
import { EASE_OUT_EXPO } from '../utils/animation';
import { fetchJarSettings, submitPublicJarThought } from '../utils/jarApi';
import { resolveDisplayAuthor, validateJarSubmissionInput } from '../utils/jarOfThoughts';
import { formatSafeUiError, PUBLIC_JAR_SUBMIT_ERROR } from '../utils/safeError';

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

type SubmitStage = 'form' | 'sealing' | 'sent';

export function LeaveAThoughtPage() {
  const reducedMotion = usePrefersReducedMotion();
  const initialInputId = useId();
  const messageInputId = useId();
  const anonymousCheckId = useId();

  const [settings, setSettings] = useState<JarFeatureSettings>(DEFAULT_JAR_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [senderInitial, setSenderInitial] = useState('');
  const [message, setMessage] = useState('');
  const [paperStyle, setPaperStyle] = useState<JarPaperStyle>('ivory-linen');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [stage, setStage] = useState<SubmitStage>('form');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldError, setFieldError] = useState<'senderInitial' | 'message' | 'paperStyle' | null>(null);
  const [submittedAuthorLabel, setSubmittedAuthorLabel] = useState('');

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

  const selectedStyle = getJarPaperStyleOption(paperStyle);
  const previewAuthor = resolveDisplayAuthor({
    senderInitial: senderInitial || 'Sahabat',
    isAnonymous,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg('');
    setFieldError(null);

    const check = validateJarSubmissionInput({
      senderInitial,
      message,
      paperStyle,
      isAnonymous,
    });

    if (!check.ok) {
      setErrorMsg(check.error);
      setFieldError(check.field ?? null);
      return;
    }

    setSubmitting(true);
    try {
      await submitPublicJarThought(check.data);
      setSubmittedAuthorLabel(
        resolveDisplayAuthor({
          senderInitial: check.data.senderInitial,
          isAnonymous: check.data.isAnonymous,
        })
      );

      if (!reducedMotion) {
        setStage('sealing');
        await new Promise((r) => window.setTimeout(r, 900));
      }
      setStage('sent');
    } catch (err) {
      setErrorMsg(
        formatSafeUiError(err, PUBLIC_JAR_SUBMIT_ERROR, 'public')
      );
      setStage('form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setSenderInitial('');
    setMessage('');
    setPaperStyle('ivory-linen');
    setIsAnonymous(false);
    setErrorMsg('');
    setFieldError(null);
    setStage('form');
  };

  return (
    <main
      data-testid="leave-a-thought-page"
      className="paper-canvas min-h-[100dvh] w-full text-[#30272A] px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Quiet Public Header — Zero Links to Protected Book or Admin */}
        <header className="text-center space-y-2.5 max-w-xl mx-auto">
          <p className="editorial-kicker">
            A Jar Full of Thoughts ♡ · Titipan Surat Untuk Wulan
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#30272A] tracking-tight text-balance">
            Leave a Little Thought for Wulan
          </h1>
          <p className="text-sm sm:text-[15px] text-[#6E5F63] leading-relaxed">
            Tulis pesan kecil, doa, atau kenangan hangat. Setiap pesan akan dilipat rapi ke dalam toples kaca dan dibuka Wulan satu per satu setiap hari.
          </p>
        </header>

        <section
          aria-label="Formulir Kirim Pesan Untuk Toples"
          className="paper-sheet p-5 sm:p-8 shadow-polaroid"
        >
          {loadingSettings ? (
            <div className="py-12 text-center text-sm text-[#38271F]/68">
              Menyiapkan lembar kertas surat...
            </div>
          ) : !settings.enabled ? (
            <div className="py-10 text-center space-y-3 max-w-md mx-auto">
              <p className="font-serif text-2xl font-semibold text-[#38271F]">
                Toples Sedang Ditutup Sementara
              </p>
              <p className="text-sm text-[#38271F]/72 leading-relaxed">
                Pengumpulan pesan baru sedang diistirahatkan untuk sementara waktu. Terima kasih banyak sudah berniat baik menulis untuk Wulan ♡
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
                  className="py-14 flex flex-col items-center text-center gap-4"
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
                      Melipat Kertas Suratmu...
                    </p>
                    <p className="text-xs text-[#38271F]/68">
                      Menitipkan pesan dengan aman ke dalam toples Wulan ♡
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
                  className="py-8 sm:py-10 flex flex-col items-center text-center gap-5 max-w-md mx-auto"
                >
                  <div className="w-16 h-16 rounded-full bg-[#455342]/12 border border-[#455342]/25 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-[#743D4A] fill-[#E8BFC5]" />
                  </div>

                  <div className="space-y-2">
                    <p className="editorial-kicker">Terkirim Dengan Hangat</p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#38271F]">
                      Terima kasih sudah menitipkan pesan ♡
                    </h2>
                    <p className="text-sm text-[#38271F]/74 leading-relaxed">
                      Surat dari <span className="font-semibold text-[#743D4A]">{submittedAuthorLabel}</span> sudah masuk daftar antrean untuk diperiksa sebelum masuk ke toples kaca Wulan.
                    </p>
                  </div>

                  <div className="w-full pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      data-testid="leave-thought-again-btn"
                      onClick={handleResetForAnother}
                      className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-sm font-medium hover:bg-[#3f202c] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#EBC9CB]" />
                      <span>Kirim Satu Pesan Lagi</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {stage === 'form' && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  noValidate
                >
                  {/* Sender Initial + Anonymous Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                    <div className="sm:col-span-7 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <label
                          htmlFor={initialInputId}
                          className="text-xs font-semibold uppercase tracking-wider text-[#38271F]"
                        >
                          Inisial / Nama Panggilan Pengirim
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
                          if (fieldError === 'senderInitial') {
                            setFieldError(null);
                            setErrorMsg('');
                          }
                        }}
                        maxLength={JAR_LIMITS.SENDER_INITIAL_MAX}
                        placeholder="Contoh: R, A.N, atau Sahabat"
                        aria-invalid={fieldError === 'senderInitial'}
                        className={`w-full min-h-[44px] px-3.5 py-2 rounded-lg border bg-[#F4EBDD]/45 text-sm text-[#38271F] placeholder:text-[#38271F]/40 focus:outline-none focus:ring-2 focus:ring-[#A6533B]/35 transition-shadow ${
                          fieldError === 'senderInitial'
                            ? 'border-[#A6533B]'
                            : 'border-[#38271F]/18'
                        }`}
                      />
                      <p className="text-[11px] text-[#38271F]/60">
                        Singkat saja (1–12 karakter), seperti tanda tangan di pojok surat.
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
                            <span>Kirim sebagai Anonim</span>
                          </span>
                          <span className="block text-[11px] text-[#38271F]/65 mt-0.5">
                            Ditampilkan sebagai “Someone Special” untuk Wulan
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Archival Paper Style Picker */}
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
                            className={`min-h-[54px] p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
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

                  {/* Message Textarea + Live Stationery Preview */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <label
                        htmlFor={messageInputId}
                        className="text-xs font-semibold uppercase tracking-wider text-[#38271F]"
                      >
                        Pesan / Doa Hangatmu
                      </label>
                      <span
                        className={`text-[11px] tabular-nums ${
                          message.length >= JAR_LIMITS.MESSAGE_MAX
                            ? 'text-[#A6533B] font-semibold'
                            : 'text-[#38271F]/58'
                        }`}
                      >
                        {message.length}/{JAR_LIMITS.MESSAGE_MAX}
                      </span>
                    </div>

                    <div
                      className="rounded-xl border p-4 sm:p-5 transition-colors space-y-3"
                      style={{
                        backgroundColor: selectedStyle.paperBg,
                        borderColor:
                          fieldError === 'message'
                            ? '#A6533B'
                            : selectedStyle.borderColor,
                        color: selectedStyle.inkColor,
                      }}
                    >
                      <textarea
                        id={messageInputId}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value.slice(0, JAR_LIMITS.MESSAGE_MAX));
                          if (fieldError === 'message') {
                            setFieldError(null);
                            setErrorMsg('');
                          }
                        }}
                        rows={5}
                        maxLength={JAR_LIMITS.MESSAGE_MAX}
                        placeholder="Tulis pesan tulus, ucapan semangat, atau kenangan lucu buat Wulan di sini..."
                        aria-invalid={fieldError === 'message'}
                        className="w-full bg-transparent text-sm sm:text-[15px] leading-relaxed placeholder:text-[#38271F]/38 focus:outline-none resize-y"
                      />

                      <div className="pt-2.5 border-t border-[#38271F]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-hand text-lg text-[#743D4A]">
                          — Dari: {previewAuthor}
                        </span>
                        <span className="text-[11px] text-[#38271F]/58">
                          {selectedStyle.subtitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <p
                      role="alert"
                      data-testid="leave-thought-error"
                      className="rounded-lg border border-[#A6533B]/30 bg-[#A6533B]/10 px-3.5 py-2.5 text-xs font-medium text-[#A6533B]"
                    >
                      {errorMsg}
                    </p>
                  )}

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-[#38271F]/60 leading-relaxed">
                      Privasimu terjaga: pengirim tidak bisa melihat surat milik teman lain.
                    </p>

                    <button
                      type="submit"
                      data-testid="leave-thought-submit-btn"
                      disabled={submitting}
                      className="min-h-[48px] px-6 py-3 rounded-xl bg-[#552E3D] text-[#FFFDFC] text-sm font-medium hover:bg-[#3f202c] active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 shadow-polaroid cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      <Send className="w-4 h-4 text-[#EBC9CB]" />
                      <span>
                        {submitting ? 'Melipat & Mengirim...' : 'Send a Little Thought ♡'}
                      </span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </section>

        <footer className="text-center text-[11px] text-[#38271F]/55">
          A Little World Made For You ♡ · Titipan Kebaikan Untuk Wulan
        </footer>
      </div>
    </main>
  );
}
