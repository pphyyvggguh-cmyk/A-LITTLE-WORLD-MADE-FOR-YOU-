import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Heart, KeyRound } from 'lucide-react';
import { BookCornerOrnamentSVG } from '../components/storybook/StorybookIllustrations';
import { useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';
import { validatePassword } from '../utils/storage';

const FLOATING_SPECKS = [
  { left: '12%', top: '18%', delay: 0, size: 7 },
  { left: '84%', top: '22%', delay: 0.7, size: 6 },
  { left: '22%', top: '78%', delay: 1.2, size: 8 },
  { left: '78%', top: '74%', delay: 0.4, size: 6 },
  { left: '48%', top: '12%', delay: 1.5, size: 5 },
];

export function PasswordGate() {
  const unlockWithPassword = useStore((s) => s.unlockWithPassword);
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (opening) return;

    if (!code.trim()) {
      setError('Isi dulu kodenya di sini ya ♡');
      return;
    }

    const valid = validatePassword(code);
    if (!valid) {
      setError('Kodenya belum pas nih. Coba ingat lagi petunjuk di bawah ya ♡');
      return;
    }

    setError(null);
    setOpening(true);
    window.setTimeout(() => {
      unlockWithPassword(code);
    }, 850);
  };

  return (
    <main className="paper-canvas relative min-h-[100dvh] w-full flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* Subtle floating paper dust & botanical specks */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLOATING_SPECKS.map((speck, i) => (
          <motion.span
            key={i}
            style={{ left: speck.left, top: speck.top, width: speck.size, height: speck.size }}
            animate={{ y: [0, -14, 0], opacity: [0.22, 0.5, 0.22] }}
            transition={{ duration: 5 + i, repeat: Infinity, delay: speck.delay, ease: 'easeInOut' }}
            className="absolute rounded-full bg-[#C4A574]/55"
          />
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
        className="relative w-full max-w-[440px]"
      >
        <motion.div
          animate={
            opening
              ? { scale: 1.03, y: -12, opacity: 0 }
              : error
                ? { x: [0, -7, 7, -5, 5, 0] }
                : { x: 0 }
          }
          transition={{ duration: opening ? 0.8 : 0.35, ease: EASE_OUT_EXPO }}
          className="paper-sheet relative overflow-hidden shadow-[0_18px_48px_-12px_rgba(56,39,31,0.22)]"
        >
          <BookCornerOrnamentSVG className="pointer-events-none absolute bottom-2.5 right-2.5 w-5 h-5 rotate-180 opacity-45" />

          {/* Vintage Envelope Top Flap */}
          <div className="relative h-28 bg-gradient-to-b from-[#F0E3D1] to-[#FBF6EE] border-b border-[#38271F]/12 flex items-center justify-center">
            <svg
              viewBox="0 0 440 112"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 0 L220 82 L440 0"
                fill="none"
                stroke="#38271F"
                strokeOpacity="0.14"
                strokeWidth="1.2"
              />
            </svg>

            <div className="postage-stamp absolute top-4 right-4 px-2.5 py-1 text-[10px] tracking-widest font-semibold text-[#743D4A] uppercase rotate-3">
              02 · APR · 26
            </div>

            <motion.div
              animate={opening ? { scale: 1.25, rotate: -10, opacity: 0 } : { scale: 1 }}
              transition={{ duration: 0.45 }}
              className="relative z-10 mt-6 w-12 h-12 rounded-full bg-[#A6533B] border-2 border-[#743D4A]/40 shadow-md flex items-center justify-center text-[#F4EBDD]"
              aria-hidden="true"
            >
              <Heart className="w-5 h-5 fill-[#F4EBDD]" />
            </motion.div>
          </div>

          <div className="px-6 sm:px-8 pt-6 pb-8 text-center">
            <p className="editorial-kicker">Undangan Pribadi · Untuk Wulan</p>

            <h1 className="mt-2 font-serif text-2xl sm:text-[26px] font-semibold text-[#38271F] leading-snug text-balance">
              A Little World Made For <span className="whitespace-nowrap">You ♡</span>
            </h1>

            <p className="mt-2.5 text-sm text-[#38271F]/74 leading-relaxed text-balance">
              Ada ruang kecil yang disiapkan khusus buat kamu. Masukkan kodenya untuk membuka amplop ini.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left" noValidate>
              <div>
                <label
                  htmlFor="invitation-password"
                  className="block text-xs font-medium text-[#38271F]/78 mb-1.5"
                >
                  Kode Undangan (DDMMYYYY)
                </label>
                <div className="relative">
                  <KeyRound
                    className="w-4 h-4 text-[#A6533B]/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="invitation-password"
                    type={showCode ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="off"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Masukkan 8 digit kode..."
                    className="w-full min-h-[48px] pl-10 pr-12 py-2.5 rounded-lg bg-[#F4EBDD]/75 border border-[#38271F]/20 text-[#38271F] placeholder:text-[#38271F]/40 text-base tracking-widest focus:outline-none focus:border-[#A6533B] focus:ring-2 focus:ring-[#A6533B]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode((v) => !v)}
                    aria-label={showCode ? 'Sembunyikan kode' : 'Tampilkan kode'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-[#38271F]/60 hover:text-[#38271F] cursor-pointer"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.p
                    key="pw-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs sm:text-[13px] text-[#A6533B] bg-[#E8BFC5]/28 border border-[#A6533B]/25 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={opening}
                className="w-full min-h-[48px] rounded-lg bg-[#38271F] text-[#F4EBDD] font-medium text-sm tracking-wide hover:bg-[#4b352a] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-70"
              >
                <span>{opening ? 'Membuka Undangan...' : 'Buka Undangan'}</span>
                <Heart className="w-4 h-4 text-[#E8BFC5]" />
              </button>
            </form>

            <p className="mt-5 font-hand text-lg text-[#743D4A]/90 leading-snug">
              Tanggal lahir seseorang yang selalu punya tempat istimewa di cerita ini.
            </p>
          </div>
        </motion.div>
      </motion.section>
    </main>
  );
}
