'use client';

/**
 * ReadyPI Signup — Request Access to Sovereign Intelligence
 *
 * Matches the authentication_precision_elite design system.
 * Same split-panel layout as login, with additional full_name field
 * and a welcome credits callout.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import PiMark from '@/components/PiMark';

export default function SignupPage() {
  const router = useRouter();
  const { signupWithEmail, loginWithGoogle, loginWithGithub, loading, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!identifier.trim() || !passphrase.trim()) {
      setLocalError('Email and passphrase are required.');
      return;
    }

    if (passphrase.length < 8) {
      setLocalError('Passphrase must be at least 8 characters.');
      return;
    }

    try {
      await signupWithEmail(identifier.trim(), passphrase, fullName.trim() || undefined);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Account creation failed';
      if (!error) setLocalError(message);
    }
  }, [identifier, passphrase, fullName, signupWithEmail, router, clearError, error]);

  const handleGoogleOAuth = useCallback(async () => {
    clearError();
    setLocalError('');
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google authentication failed';
      if (!error) setLocalError(message);
    }
  }, [loginWithGoogle, router, clearError, error]);

  const handleGithubOAuth = useCallback(async () => {
    clearError();
    setLocalError('');
    try {
      await loginWithGithub();
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'GitHub authentication failed';
      if (!error) setLocalError(message);
    }
  }, [loginWithGithub, router, clearError, error]);

  const displayError = error || localError;

  // ── Success State ──
  if (success) {
    return (
      <main className="flex-grow flex items-center justify-center min-h-screen bg-[#0A0A0A]">
        <div className="text-center animate-fade-in px-6">
          <div className="relative inline-block mb-8">
            <PiMark variant="hero" size={220} />
            <Sparkles className="absolute -top-2 -right-4 text-[#FF4500] animate-pulse" size={24} />
          </div>
          <h1 className="font-headline text-headline-lg text-white mb-4">
            WELCOME TO READYPI
          </h1>
          <p className="font-body text-body-base text-[#948e9c] mb-2">
            Your account is ready with{' '}
            <span className="text-[#FF4500] font-semibold">50 free credits</span>
            {' '}(50K tokens)
          </p>
          <p className="font-technical text-technical-label text-[#494551] uppercase tracking-widest mb-8">
            INITIALIZING DASHBOARD SEQUENCE...
          </p>
          <div className="w-10 h-10 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow flex flex-col md:flex-row w-full h-full min-h-screen relative">
      {/* ── Mobile Background ── */}
      <div className="md:hidden absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-[#0A0A0A] via-[#1a0800] to-[#0A0A0A]">
        <div className="absolute inset-0 flex items-center justify-center opacity-25">
          <PiMark variant="hero" size={340} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Left Panel: Registration Form
          ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="signup-form-panel"
        className="w-full md:w-1/2 bg-white/90 md:bg-white backdrop-blur-md md:backdrop-blur-none text-[#0A0A0A] flex flex-col justify-center px-8 md:px-10 py-10 border-b md:border-b-0 md:border-r border-[#262626] relative z-10"
      >
        {/* Mobile Brand Identity */}
        <div className="md:hidden mb-6">
          <h1 className="font-headline text-headline-md font-bold tracking-tight uppercase text-[#0A0A0A]">
            Sovereign Intelligence
          </h1>
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* ── Header ── */}
          <header className="mb-6 border-b border-[#262626] pb-4">
            <h2
              id="signup-heading"
              className="font-headline text-headline-lg text-[#0A0A0A]"
            >
              REQUEST ACCESS
            </h2>
            <p className="font-body text-body-sm text-[#494551] mt-2">
              Create your gateway credentials.
            </p>
            <div className="mt-3 flex items-center gap-2 font-technical text-technical-label">
              <Sparkles size={14} className="text-[#FF4500]" />
              <span className="text-[#FF4500]">50 FREE CREDITS</span>
              <span className="text-[#948e9c]">— NO CARD REQUIRED</span>
            </div>
          </header>

          {/* ── Error Display ── */}
          {displayError && (
            <div
              id="signup-error-banner"
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-technical text-data-mono"
              role="alert"
            >
              {displayError}
            </div>
          )}

          {/* ── Signup Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            {/* Full Name Field */}
            <div className="relative group">
              <label
                htmlFor="full-name"
                className="font-technical text-technical-label text-[#494551] block mb-1 group-focus-within:text-[#FF4500] transition-colors duration-150 uppercase tracking-widest"
              >
                DESIGNATION [FULL NAME]
              </label>
              <input
                id="full-name"
                name="name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ahmed Riyaz"
                disabled={loading}
                className="input-elite disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email Field */}
            <div className="relative group">
              <label
                htmlFor="signup-identifier"
                className="font-technical text-technical-label text-[#494551] block mb-1 group-focus-within:text-[#FF4500] transition-colors duration-150 uppercase tracking-widest"
              >
                IDENTIFIER [EMAIL]
              </label>
              <input
                id="signup-identifier"
                name="email"
                type="email"
                autoComplete="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="user@domain.ext"
                required
                disabled={loading}
                className="input-elite disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Passphrase Field */}
            <div className="relative group">
              <label
                htmlFor="signup-passphrase"
                className="font-technical text-technical-label text-[#494551] block mb-1 group-focus-within:text-[#FF4500] transition-colors duration-150 uppercase tracking-widest"
              >
                PASSPHRASE [MIN 8 CHARS]
              </label>
              <div className="relative">
                <input
                  id="signup-passphrase"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={8}
                  required
                  disabled={loading}
                  className="input-elite pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#494551] hover:text-[#0A0A0A] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="signup-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF4500] text-white font-technical text-technical-label py-4 px-6 uppercase tracking-widest border border-[#FF4500] hover:bg-[#D93B00] transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    CREATING CREDENTIALS...
                  </>
                ) : (
                  <>
                    INITIALIZE ACCOUNT
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ── OAuth Providers ── */}
          <div className="mt-8 flex flex-col gap-4 border-t border-[#262626] pt-6">
            <p className="font-technical text-technical-label text-[#494551] uppercase text-center">
              OR AUTHENTICATE VIA
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id="signup-google-btn"
                onClick={handleGoogleOAuth}
                disabled={loading}
                className="flex-1 bg-transparent border border-[#262626] text-[#0A0A0A] font-technical text-technical-label py-3 px-4 flex items-center justify-center gap-2 hover:border-[#FF4500] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                OAUTH GOOGLE
              </button>
              <button
                id="signup-github-btn"
                onClick={handleGithubOAuth}
                disabled={loading}
                className="flex-1 bg-transparent border border-[#262626] text-[#0A0A0A] font-technical text-technical-label py-3 px-4 flex items-center justify-center gap-2 hover:border-[#FF4500] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                OAUTH GITHUB
              </button>
            </div>
          </div>

          {/* ── Login Link ── */}
          <div className="mt-6 text-center">
            <p className="font-body text-body-sm text-[#494551]">
              Already have credentials?{' '}
              <Link
                href="/login"
                className="text-[#FF4500] hover:text-[#D93B00] font-medium underline decoration-1 underline-offset-4"
              >
                ACCESS GATEWAY
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          Right Panel: Brand Visual (Desktop Only)
          ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="signup-brand-panel"
        className="hidden md:flex w-1/2 relative z-10 overflow-hidden bg-[#0A0A0A] items-center justify-center"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-tl from-[#0A0A0A] via-[#150a00] to-[#0A0A0A]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,69,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,69,0,0.12) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#FF4500] opacity-[0.05] blur-[100px]" />

        {/* Content — clean π identity, no floating labels */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-12">
          <PiMark variant="hero" size={500} />

          <div className="mt-6 space-y-2">
            <p className="font-technical text-technical-label text-[#FF4500]/60 uppercase tracking-[0.3em]">
              GATEWAY REGISTRATION
            </p>
            <p className="font-body text-body-sm text-[#948e9c] max-w-xs">
              Asia&apos;s first AI API gateway. Local currency support.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="fixed bottom-0 w-full bg-transparent border-t border-neutral-200/10 flex justify-between items-center px-6 md:px-12 py-4 md:py-6 z-20 pointer-events-none">
        <div className="font-mono text-[10px] tracking-widest uppercase text-neutral-400 pointer-events-auto">
          © 2026 SOVEREIGN INTELLIGENCE ACCESS. ALL RIGHTS RESERVED.
        </div>
        <div className="hidden md:flex gap-6 font-mono text-[10px] tracking-widest uppercase text-neutral-500 pointer-events-auto">
          <Link href="#" className="underline-offset-4 hover:underline hover:text-[#FF4500] transition-colors">
            PRIVACY_TERMS
          </Link>
          <Link href="#" className="underline-offset-4 hover:underline hover:text-[#FF4500] transition-colors">
            ENCRYPTION_STANDARDS
          </Link>
        </div>
      </footer>
    </main>
  );
}
