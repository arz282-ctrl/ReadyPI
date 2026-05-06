'use client';

/**
 * AuthProvider — Global Authentication Context
 *
 * Bridges Firebase Auth (frontend identity) with the ReadyPI backend (Postgres user record).
 *
 * Flow:
 * 1. User signs in via Firebase Auth (email/password OR OAuth)
 * 2. Firebase returns an ID token
 * 3. We POST that token to our backend /auth/firebase-exchange
 * 4. Backend verifies via Firebase Admin SDK, upserts the user in Postgres, returns a ReadyPI JWT
 * 5. We store that JWT in localStorage for all subsequent API calls
 *
 * This allows us to use Firebase Auth's Google/GitHub OAuth while keeping our
 * own user table, credits, and API key system intact.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  auth,
  googleProvider,
  githubProvider,
  facebookProvider,
  appleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  isFirebaseConfigured,
  type User as FirebaseUser,
} from '@/lib/firebase';
import { authAPI, type UserProfile } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  sendPhoneCode: (phoneNumber: string, containerId: string) => Promise<any>;
  verifyPhoneCode: (confirmationResult: any, code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  // Utility to merge state
  const patch = (partial: Partial<AuthState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  /**
   * Exchange Firebase ID token with our backend.
   * On success, stores the ReadyPI JWT and user profile.
   */
  const exchangeToken = useCallback(async (fbUser: FirebaseUser) => {
    try {
      const idToken = await fbUser.getIdToken(true);
      const { data } = await authAPI.firebaseExchange(idToken);

      if (typeof window !== 'undefined') {
        localStorage.setItem('readypi_token', data.token);
        localStorage.setItem('readypi_user', JSON.stringify(data.user));
        // Set cookie for middleware route protection
        document.cookie = `readypi_session=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }

      // Fetch full profile (includes credits, API key count, etc.)
      const { data: profile } = await authAPI.me();

      patch({
        firebaseUser: fbUser,
        user: profile,
        token: data.token,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Token exchange failed';
      patch({ loading: false, error: message });
      throw err;
    }
  }, []);

  /**
   * Direct login (bypasses Firebase — uses our existing email/password endpoint).
   * This is the fallback if Firebase Auth is not configured yet.
   */
  const loginDirect = useCallback(async (email: string, password: string) => {
    const { data } = await authAPI.login(email, password);

    if (typeof window !== 'undefined') {
      localStorage.setItem('readypi_token', data.token);
      localStorage.setItem('readypi_user', JSON.stringify(data.user));
      // Set cookie for middleware route protection
      document.cookie = `readypi_session=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }

    const { data: profile } = await authAPI.me();

    patch({
      user: profile,
      token: data.token,
      loading: false,
      error: null,
    });
  }, []);

  // ─── Auth Methods ─────────────────────────────────────────────────────────

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    patch({ loading: true, error: null });
    try {
      // Try Firebase Auth first; fall back to direct login if Firebase isn't configured
      if (isFirebaseConfigured) {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await exchangeToken(credential.user);
      } else {
        await loginDirect(email, password);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      // If Firebase auth fails, try direct backend login as fallback
      try {
        await loginDirect(email, password);
      } catch (directErr: unknown) {
        const directMessage = directErr instanceof Error ? directErr.message : 'Login failed';
        patch({ loading: false, error: directMessage });
        throw directErr;
      }
    }
  }, [exchangeToken, loginDirect]);

  const signupWithEmail = useCallback(async (email: string, password: string, fullName?: string) => {
    patch({ loading: true, error: null });
    try {
      if (isFirebaseConfigured) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await exchangeToken(credential.user);
      } else {
        // Direct signup via our backend
        const { data } = await authAPI.signup(email, password, fullName);
        if (typeof window !== 'undefined') {
          localStorage.setItem('readypi_token', data.token);
          localStorage.setItem('readypi_user', JSON.stringify(data.user));
          document.cookie = `readypi_session=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
        const { data: profile } = await authAPI.me();
        patch({ user: profile, token: data.token, loading: false, error: null });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      patch({ loading: false, error: message });
      throw err;
    }
  }, [exchangeToken]);

  const loginWithGoogle = useCallback(async () => {
    patch({ loading: true, error: null });
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      await exchangeToken(credential.user);
    } catch (err: unknown) {
      let message = 'Google login failed';
      if (err instanceof Error) {
        // Provide more specific error messages for common OAuth issues
        if (err.message.includes('popup-closed')) {
          message = 'Google sign-in was cancelled';
        } else if (err.message.includes('network')) {
          message = 'Network error. Please check your connection.';
        } else if (err.message.includes('invalid-oauth')) {
          message = 'Google OAuth is not properly configured. Please contact support.';
        } else if (err.message.includes('auth/unauthorized-domain')) {
          message = 'This domain is not authorized for OAuth. Please use email/password instead.';
        } else {
          message = err.message;
        }
      }
      patch({ loading: false, error: message });
      throw err;
    }
  }, [exchangeToken]);

  const loginWithGithub = useCallback(async () => {
    patch({ loading: true, error: null });
    try {
      const credential = await signInWithPopup(auth, githubProvider);
      await exchangeToken(credential.user);
    } catch (err: unknown) {
      let message = 'GitHub login failed';
      if (err instanceof Error) {
        if (err.message.includes('popup-closed')) {
          message = 'GitHub sign-in was cancelled';
        } else if (err.message.includes('redirect_uri_mismatch')) {
          message = 'GitHub OAuth redirect not configured. Please contact support.';
        } else if (err.message.includes('auth/unauthorized-domain')) {
          message = 'This domain is not authorized for OAuth. Please use email/password instead.';
        } else {
          message = err.message;
        }
      }
      patch({ loading: false, error: message });
      throw err;
    }
  }, [exchangeToken]);

  const loginWithFacebook = useCallback(async () => {
    if (!isFirebaseConfigured) {
      const message = 'Facebook OAuth is not configured. Please use email/password to sign in.';
      patch({ loading: false, error: message });
      throw new Error(message);
    }
    patch({ loading: true, error: null });
    try {
      const credential = await signInWithPopup(auth, facebookProvider);
      await exchangeToken(credential.user);
    } catch (err: unknown) {
      let message = 'Facebook login failed';
      if (err instanceof Error) {
        if (err.message.includes('popup-closed')) {
          message = 'Facebook sign-in was cancelled';
        } else {
          message = err.message;
        }
      }
      patch({ loading: false, error: message });
      throw err;
    }
  }, [exchangeToken]);

  const loginWithApple = useCallback(async () => {
    if (!isFirebaseConfigured) {
      const message = 'Apple OAuth is not configured. Please use email/password to sign in.';
      patch({ loading: false, error: message });
      throw new Error(message);
    }
    patch({ loading: true, error: null });
    try {
      const credential = await signInWithPopup(auth, appleProvider);
      await exchangeToken(credential.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Apple login failed';
      patch({ loading: false, error: message });
      throw err;
    }
  }, [exchangeToken]);

  const sendPhoneCode = useCallback(async (phoneNumber: string, containerId: string) => {
    patch({ error: null });
    try {
      const appVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
      });
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send phone verification code';
      patch({ error: message });
      throw err;
    }
  }, []);

  const verifyPhoneCode = useCallback(async (confirmationResult: any, code: string) => {
    patch({ loading: true, error: null });
    try {
      const credential = await confirmationResult.confirm(code);
      await exchangeToken(credential.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid verification code';
      patch({ loading: false, error: message });
      throw err;
    }
  }, [exchangeToken]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout().catch(() => {});
      if (isFirebaseConfigured) {
        await firebaseSignOut(auth).catch(() => {});
      }
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('readypi_token');
        localStorage.removeItem('readypi_user');
        // Clear session cookie
        document.cookie = 'readypi_session=; path=/; max-age=0';
      }
      patch({ firebaseUser: null, user: null, token: null, loading: false, error: null });
    }
  }, []);

  const clearError = useCallback(() => patch({ error: null }), []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data: profile } = await authAPI.me();
      patch({ user: profile });
    } catch {
      // Silently fail if not authenticated
    }
  }, []);

  // ─── On mount: restore session from localStorage ──────────────────────────

  useEffect(() => {
    // Check localStorage first for fast hydration
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('readypi_token');
      const savedUser = localStorage.getItem('readypi_user');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          patch({ token: savedToken, user: parsedUser as UserProfile, loading: false });

          // Ensure the cookie is synced (it may have expired while localStorage persisted)
          // This prevents the middleware from redirecting when auth context thinks user is logged in
          document.cookie = `readypi_session=${savedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

          // Refresh profile in background for freshness
          authAPI.me()
            .then(({ data }) => patch({ user: data }))
            .catch(() => {
              // Token expired — clear everything including cookie
              localStorage.removeItem('readypi_token');
              localStorage.removeItem('readypi_user');
              document.cookie = 'readypi_session=; path=/; max-age=0';
              patch({ user: null, token: null });
            });
          return;
        } catch {
          localStorage.removeItem('readypi_user');
        }
      }
    }

    // If Firebase is configured, listen for auth state changes
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            await exchangeToken(fbUser);
          } catch {
            patch({ loading: false });
          }
        } else {
          patch({ firebaseUser: null, loading: false });
        }
      });
      return () => unsubscribe();
    }

    // No Firebase, no saved token
    patch({ loading: false });
  }, [exchangeToken]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithGithub,
        loginWithFacebook,
        loginWithApple,
        sendPhoneCode,
        verifyPhoneCode,
        logout,
        clearError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
