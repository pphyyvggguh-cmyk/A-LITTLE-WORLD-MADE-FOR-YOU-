import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AccessConfig, DEFAULT_ACCESS_CONFIG } from '../data/wishlist';
import { isAuthorizedAdminEmail, resolveCoupleRole } from '../utils/wishlist';
import { auth, db, googleAuthProvider } from './firebase';

interface FirebaseAuthContextValue {
  user: User | null;
  authReady: boolean;
  accessConfig: AccessConfig;
  isAdmin: boolean;
  coupleRole: 'oktaf' | 'wulan' | null;
  authError: string;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  refreshAccessConfig: (activeUser?: User | null) => Promise<AccessConfig>;
  clearAuthError: () => void;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accessConfig, setAccessConfig] = useState<AccessConfig>(DEFAULT_ACCESS_CONFIG);
  const [authError, setAuthError] = useState('');

  const refreshAccessConfig = useCallback(async (activeUser?: User | null): Promise<AccessConfig> => {
    const targetUser = activeUser === undefined ? auth.currentUser : activeUser;
    if (!targetUser || !targetUser.emailVerified) {
      setAccessConfig(DEFAULT_ACCESS_CONFIG);
      return DEFAULT_ACCESS_CONFIG;
    }
    try {
      const snap = await getDoc(doc(db, 'config', 'access'));
      if (snap.exists()) {
        const data = snap.data() as Partial<AccessConfig>;
        const next: AccessConfig = {
          configId: 'access',
          adminEmail: data.adminEmail || DEFAULT_ACCESS_CONFIG.adminEmail,
          oktafEmail: data.oktafEmail || DEFAULT_ACCESS_CONFIG.oktafEmail,
          wulanEmail: data.wulanEmail || DEFAULT_ACCESS_CONFIG.wulanEmail,
          wishlistPrivacyMode:
            data.wishlistPrivacyMode === 'admin-only' ? 'admin-only' : 'couple-only',
          updatedBy: data.updatedBy,
        };
        setAccessConfig(next);
        return next;
      }
    } catch {
      // Non-couple authenticated users cannot read /config/access — keep default private state
    }
    setAccessConfig(DEFAULT_ACCESS_CONFIG);
    return DEFAULT_ACCESS_CONFIG;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      await refreshAccessConfig(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, [refreshAccessConfig]);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthError('');
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      await refreshAccessConfig(cred.user);
      return cred.user;
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

      if (import.meta.env.DEV) {
        console.warn('Google Sign-In failed:', code || msg);
      }

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        msg.includes('popup-closed-by-user') ||
        msg.includes('cancelled-popup-request')
      ) {
        setAuthError('Login Google dibatalkan sebelum selesai. Silakan coba masuk lagi.');
      } else if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        setAuthError(
          'Jendela login Google diblokir browser. Izinkan popup atau buka lewat Chrome/Safari utama (bukan browser di dalam aplikasi chat).'
        );
      } else if (
        code === 'auth/unauthorized-domain' ||
        msg.includes('unauthorized-domain')
      ) {
        setAuthError(
          'Login Google belum aktif di domain ini. Hubungi pemilik website untuk mendaftarkan domain pada Firebase Authorized Domains.'
        );
      } else if (
        code === 'auth/network-request-failed' ||
        msg.includes('network-request-failed')
      ) {
        setAuthError(
          'Koneksi terganggu saat menghubungkan ke Google. Periksa internet lalu coba lagi.'
        );
      } else {
        setAuthError(
          'Gagal masuk dengan akun Google. Pastikan menggunakan browser utama dan coba lagi.'
        );
      }
      return null;
    }
  }, [refreshAccessConfig]);

  const signOutUser = useCallback(async () => {
    setAuthError('');
    await signOut(auth);
    setAccessConfig(DEFAULT_ACCESS_CONFIG);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(''), []);

  const isAdmin = Boolean(user && isAuthorizedAdminEmail(user.email, user.emailVerified));
  const coupleRole = user
    ? resolveCoupleRole(user.email, accessConfig, user.emailVerified)
    : null;

  return (
    <FirebaseAuthContext.Provider
      value={{
        user,
        authReady,
        accessConfig,
        isAdmin,
        coupleRole,
        authError,
        signInWithGoogle,
        signOutUser,
        refreshAccessConfig,
        clearAuthError,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth(): FirebaseAuthContextValue {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) {
    throw new Error('useFirebaseAuth must be used inside FirebaseProvider');
  }
  return ctx;
}
