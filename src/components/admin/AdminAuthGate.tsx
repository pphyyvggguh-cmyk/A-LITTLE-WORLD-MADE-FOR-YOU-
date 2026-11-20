import { ArrowLeft, LogOut, Lock, ShieldAlert } from 'lucide-react';
import { useFirebaseAuth } from '../../lib/FirebaseProvider';

interface AdminAuthGateProps {
  onExitToPublic: () => void;
}

export function AdminAuthGate({ onExitToPublic }: AdminAuthGateProps) {
  const { user, isAdmin, authError, signInWithGoogle, signOutUser } = useFirebaseAuth();

  // Signed in as Wulan or an unknown non-admin user: strictly block without exposing admin emails or Control Room UI
  if (user && !isAdmin) {
    return (
      <main
        data-testid="admin-access-denied"
        className="paper-canvas min-h-[100dvh] w-full flex items-center justify-center px-4 py-10"
      >
        <section className="w-full max-w-md rounded-2xl border border-[#38271F]/16 bg-[#FBF6EE] p-6 sm:p-8 shadow-polaroid-lifted text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#A6533B]/12 text-[#A6533B] flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold text-[#38271F]">
              Halaman Tidak Tersedia
            </h1>
            <p className="text-xs sm:text-sm text-[#38271F]/72 leading-relaxed">
              Halaman ini bersifat privat dan tidak tersedia untuk akun yang sedang aktif. Kamu tetap bisa membuka seluruh halaman cerita melalui beranda utama.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={onExitToPublic}
              className="w-full min-h-[46px] rounded-xl bg-[#38271F] text-[#F4EBDD] text-sm font-semibold hover:bg-[#4e382d] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Website</span>
            </button>

            <button
              type="button"
              onClick={signOutUser}
              className="w-full min-h-[42px] rounded-xl border border-[#38271F]/18 text-xs font-semibold text-[#38271F] hover:bg-[#EAE0CF] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#A6533B]" />
              <span>Keluar dari Akun Google</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      data-testid="admin-auth-gate"
      className="paper-canvas min-h-[100dvh] w-full flex items-center justify-center px-4 py-10"
    >
      <section className="w-full max-w-md rounded-2xl border border-[#38271F]/16 bg-[#FBF6EE] p-6 sm:p-8 shadow-polaroid-lifted relative">
        <span
          aria-hidden="true"
          className="washi-tape-gold absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 -rotate-1"
        />

        <div className="flex items-center justify-between gap-2 mb-5">
          <button
            type="button"
            onClick={onExitToPublic}
            className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-medium text-[#38271F]/70 hover:text-[#A6533B] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Website</span>
          </button>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#743D4A]/12 text-[#743D4A] flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#38271F]">
            Area Privat ♡
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#38271F]/72 leading-relaxed">
            Masuk dengan akun Google pemilik situs yang terdaftar untuk mengakses area pengelolaan.
          </p>
        </div>

        {authError && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-[#A6533B]/12 border border-[#A6533B]/30 px-3.5 py-2.5 text-xs font-medium text-[#A6533B]"
          >
            {authError}
          </p>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full min-h-[48px] rounded-xl bg-[#38271F] text-[#F4EBDD] text-sm font-semibold hover:bg-[#4e382d] transition-colors cursor-pointer"
          >
            Masuk dengan Google
          </button>
        </div>
      </section>
    </main>
  );
}
