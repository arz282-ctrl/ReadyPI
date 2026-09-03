'use client';

/**
 * AuthProvider — Global Authentication Context (Supabase Auth edition)
 *
 * Bridges Supabase Auth (frontend identity) with the ReadyPI backend (Postgres user record).
 *
 * Flow:
 * 1. User signs in via Supabase Auth (email/password OR OAuth)
 * 2. Supabase returns a session with an access token (JWT)
 * 3. We POST that token to our backend /auth/supabase-exchange
 * 4. Backend verifies it against Supabase, upserts the user in Postgres, returns a ReadyPI JWT
 * 5. We store that JWT in localStorage for all subsequent API calls
 *
 * This keeps our own user table, credits, and API key system intact.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authAPI, type UserProfile } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  supabaseUser: SupabaseUser | null;
  firebaseUser: SupabaseUser | null; // legacy alias for backward compatibility
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function persistSession(token: string, user: unknown) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('readypi_token', token);
  localStorage.setItem('readypi_user', JSON.stringify(user));
  document.cookie = `readypi_session=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('readypi_token');
  localStorage.removeItem('readypi_user');
  document.cookie = 'readypi_session=; path=/; max-age=0';
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    supabaseUser: null,
    firebaseUser: null,
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  const patch = (partial: Partial<AuthState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  /**
   * Exchange a Supabase session access token with our backend.
   * On success, stores the ReadyPI JWT and user profile.
   */
  const exchangeToken = useCallback(async (session: Session) => {
    try {
      const { data } = await authAPI.supabaseExchange(session.access_token);
      persistSession(data.token, data.user);

      const { data: profile } = await authAPI.me();

      patch({
        supabaseUser: session.user,
        firebaseUser: session.user,
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
   * Direct login (bypasses Supabase — uses our existing email/password endpoint).
   * Fallback if Supabase Auth is unreachable.
   */
  const loginDirect = useCallback(async (email: string, password: string) => {
    const { data } = await authAPI.login(email, password);
    persistSession(data.token, data.user);
    const { data: profile } = await authAPI.me();
    patch({ user: profile, token: data.token, loading: false, error: null });
  }, []);

  // ─── Auth Methods ─────────────────────────────────────────────────────────

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    patch({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await exchangeToken(data.session);
    } catch (err: unknown) {
      // Fall back to direct backend login (covers legacy users created pre-Supabase)
      try {
        await loginDirect(email, password);
      } catch (directErr: unknown) {
        const directMessage =
          directErr instanceof Error ? directErr.message : 'Login failed';
        const supaMessage = err instanceof Error ? err.message : '';
        patch({
          loading: false,
          error: supaMessage.includes('Invalid login credentials')
            ? 'Invalid email or password'
            : directMessage,
        });
        throw directErr;
      }
    }
  }, [exchangeToken, loginDirect]);

  const signupWithEmail = useCallback(
    async (email: string, password: string, fullName?: string) => {
      patch({ loading: true, error: null });
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName || null } },
        });
        if (error) throw error;

        if (data.session) {
          // Email confirmation disabled — session available immediately
          await exchangeToken(data.session);
        } else {
          // Email confirmation required
          patch({
            loading: false,
            error: null,
          });
          throw new Error(
            'CONFIRM_EMAIL:Check your inbox — we sent you a confirmation link. Sign in after confirming.'
          );
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Signup failed';
        if (!message.startsWith('CONFIRM_EMAIL:')) {
          patch({ loading: false, error: message });
        }
        throw err;
      }
    },
    [exchangeToken]
  );

  /** Shared OAuth redirect flow */
  const oauthLogin = useCallback(
    async (provider: 'google' | 'github' | 'facebook' | 'apple') => {
      patch({ loading: true, error: null });
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo:
              typeof window !== 'undefined'
                ? `${window.location.origin}/dashboard`
                : undefined,
          },
        });
        if (error) throw error;
        // Browser will redirect; onAuthStateChange handles the return leg.
      } catch (err: unknown) {
        let message = `${provider} login failed`;
        if (err instanceof Error) {
          message = err.message.includes('provider is not enabled')
            ? `${provider} sign-in is not enabled yet. Enable it in Supabase Dashboard → Authentication → Providers.`
            : err.message;
        }
        patch({ loading: false, error: message });
        throw err;
      }
    },
    []
  );

  const loginWithGoogle = useCallback(() => oauthLogin('google'), [oauthLogin]);
  const loginWithGithub = useCallback(() => oauthLogin('github'), [oauthLogin]);
  const loginWithFacebook = useCallback(() => oauthLogin('facebook'), [oauthLogin]);
  const loginWithApple = useCallback(() => oauthLogin('apple'), [oauthLogin]);

  /** Phone OTP via Supabase (requires SMS provider configured in Supabase dashboard) */
  const sendPhoneCode = useCallback(async (phoneNumber: string, _containerId: string) => {
    patch({ error: null });
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
      if (error) throw error;
      // Return a shim matching the old confirmationResult API
      return { phone: phoneNumber };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send phone verification code';
      patch({ error: message });
      throw err;
    }
  }, []);

  const verifyPhoneCode = useCallback(
    async (confirmationResult: any, code: string) => {
      patch({ loading: true, error: null });
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: confirmationResult.phone,
          token: code,
          type: 'sms',
        });
        if (error) throw error;
        if (data.session) await exchangeToken(data.session);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid verification code';
        patch({ loading: false, error: message });
        throw err;
      }
    },
    [exchangeToken]
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout().catch(() => {});
      await supabase.auth.signOut().catch(() => {});
    } finally {
      clearSession();
      patch({ supabaseUser: null, firebaseUser: null, user: null, token: null, loading: false, error: null });
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

  // ─── On mount: restore session ────────────────────────────────────────────

  useEffect(() => {
    // 1. Fast hydration from localStorage (ReadyPI JWT)
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('readypi_token');
      const savedUser = localStorage.getItem('readypi_user');

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          patch({ token: savedToken, user: parsedUser as UserProfile, loading: false });
          document.cookie = `readypi_session=${savedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

          authAPI
            .me()
            .then(({ data }) => patch({ user: data }))
            .catch((err: any) => {
              if (err?.response?.status === 401 || err?.response?.status === 403) {
                clearSession();
                patch({ user: null, token: null });
              } else {
                console.warn('Background profile refresh failed (network/server):', err);
              }
            });
        } catch {
          localStorage.removeItem('readypi_user');
        }
      } else {
        patch({ loading: false });
      }
    }

    // 2. Listen for Supabase auth events (OAuth redirects, token refresh, sign-out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Only exchange if we don't already hold a ReadyPI token
        const existing =
          typeof window !== 'undefined' ? localStorage.getItem('readypi_token') : null;
        if (!existing) {
          try {
            await exchangeToken(session);
          } catch {
            patch({ loading: false });
          }
        } else {
          patch({ supabaseUser: session.user, firebaseUser: session.user, loading: false });
        }
      } else if (event === 'SIGNED_OUT') {
        patch({ supabaseUser: null, firebaseUser: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
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
