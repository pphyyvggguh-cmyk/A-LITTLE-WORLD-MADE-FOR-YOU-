import { ArrowLeft, LogOut, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../../data/wishlist';
import { useFirebaseAuth } from '../../lib/FirebaseProvider';

interface AdminAuthGateProps {
  onExitToPublic: () => void;
}

export function AdminAuthGate({ onExitToPublic }: AdminAuthGateProps) {
  const { user, isAdmin, authError, signInWithGoogle, signOutUser } = useFirebaseAuth();

  return (
    <main className="paper-canvas min-h-[100dvh] w-full flex items-center justify-center px-4 py-10">
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

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#455342]/12 text-[#455342] text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Firebase Guard</span>
          </span>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#743D4A]/12 text-[#743D4A] flex items-center justify-center mb-3">
            {user && !isAdmin ? (
              <ShieldAlert className="w-5 h-5 text-[#A6533B]" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <p className="text-[11px] uppercase tracking-widest text-[#743D4A] font-semibold">
            Private Admin Area
          </p>
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#38271F]">
            My Little Control Room ♡
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#38271F]/72 leading-relaxed">
            Masuk menggunakan akun Google administrator (<strong>{PRIMARY_ADMIN_EMAIL}</strong>) untuk mengelola cerita, destinasi, surat, video, Voices of Love, Vinyl Player, dan Our Future Wishlist.
          </p>
        </div>

        {user && !isAdmin && (
          <div
            role="alert"
            className="mt-5 rounded-xl bg-[#A6533B]/12 border border-[#A6533B]/30 px-3.5 py-3 text-xs text-[#A6533B] space-y-1.5"
          >
            <p className="font-semibold">
              Akun {user.email} tidak memiliki izin administrator.
            </p>
            <p className="text-[#38271F]/75">
              Control Room hanya dapat dibuka oleh {PRIMARY_ADMIN_EMAIL}.
            </p>
          </div>
        )}

        {authError && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-[#A6533B]/12 border border-[#A6533B]/30 px-3.5 py-2.5 text-xs font-medium text-[#A6533B]"
          >
            {authError}
          </p>
        )}

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full min-h-[48px] rounded-xl bg-[#38271F] text-[#F4EBDD] text-sm font-semibold hover:bg-[#4e382d] transition-colors cursor-pointer"
          >
            {user ? 'Masuk dengan Akun Google Admin' : 'Masuk dengan Google (Admin)'}
          </button>

          {user && (
            <button
              type="button"
              onClick={signOutUser}
              className="w-full min-h-[44px] rounded-xl border border-[#38271F]/20 text-xs font-semibold text-[#38271F] hover:bg-[#EAE0CF] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#A6533B]" />
              <span>Keluar dari {user.email}</span>
            </button>
          )}
        </div>

        <p className="mt-5 text-[11px] text-center text-[#38271F]/55 leading-relaxed">
          Sesi diverifikasi oleh Firebase Authentication & Cloud Firestore Security Rules. Pengunjung umum tidak dapat mengubah data.
        </p>
      </section>
    </main>
  );
}
