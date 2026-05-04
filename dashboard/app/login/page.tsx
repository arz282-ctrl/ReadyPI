'use client';

/**
 * ReadyPI Login — Sovereign Intelligence Access Gateway
 *
 * Pixel-perfect implementation of the authentication_precision_elite design.
 * Split-panel layout: left form panel (white), right brand visual (dark).
 * Uses the elite design system with Space Grotesk technical labels,
 * Noto Serif headlines, and #FF4500 accent color.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, ArrowRight, Loader2, Phone, Smartphone } from 'lucide-react';
import PiMark from '@/components/PiMark';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, loginWithGithub, loginWithFacebook, loginWithApple, sendPhoneCode, verifyPhoneCode, loading, error, clearError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Phone Auth State
  const [usePhoneAuth, setUsePhoneAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!identifier.trim() || !passphrase.trim()) {
      setLocalError('All fields are required.');
      return;
    }

    try {
      await loginWithEmail(identifier.trim(), passphrase);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      // Error is set in the auth context, but also capture locally for display
      if (!error) setLocalError(message);
    }
  }, [identifier, passphrase, loginWithEmail, router, clearError, error]);

  const handlePhoneSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (!confirmationResult) {
      // Send Code
      if (!phoneNumber.trim()) {
        setLocalError('Phone number is required.');
        return;
      }
      try {
        const result = await sendPhoneCode(phoneNumber, 'recaptcha-container');
        setConfirmationResult(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send code';
        if (!error) setLocalError(message);
      }
    } else {
      // Verify Code
      if (!verificationCode.trim()) {
        setLocalError('Verification code is required.');
        return;
      }
      try {
        await verifyPhoneCode(confirmationResult, verificationCode);
        router.push('/dashboard');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to verify code';
        if (!error) setLocalError(message);
      }
    }
  }, [phoneNumber, verificationCode, confirmationResult, sendPhoneCode, verifyPhoneCode, router, clearError, error]);

  const handleOAuth = useCallback(async (provider: 'google' | 'github' | 'facebook' | 'apple') => {
    clearError();
    setLocalError('');
    try {
      if (provider === 'google') await loginWithGoogle();
      if (provider === 'github') await loginWithGithub();
      if (provider === 'facebook') await loginWithFacebook();
      if (provider === 'apple') await loginWithApple();
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `${provider} authentication failed`;
      if (!error) setLocalError(message);
    }
  }, [loginWithGoogle, loginWithGithub, loginWithFacebook, loginWithApple, router, clearError, error]);

  const displayError = error || localError;

  return (
    <main className="flex-grow flex flex-col md:flex-row w-full h-full min-h-screen relative">
      {/* ── Mobile Background Image ── */}
      <div className="md:hidden absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-[#0A0A0A] via-[#1a0800] to-[#0A0A0A]">
        <div className="absolute inset-0 flex items-center justify-center opacity-25">
          <PiMark variant="hero" size={360} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Left Panel: Authentication Form
          ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="auth-form-panel"
        className="w-full md:w-1/2 bg-white/90 md:bg-white backdrop-blur-md md:backdrop-blur-none text-[#0A0A0A] flex flex-col justify-center px-8 md:px-10 py-10 border-b md:border-b-0 md:border-r border-[#262626] relative z-10 overflow-y-auto"
      >
        {/* Mobile Brand Identity (hidden on desktop where right panel shows it) */}
        <div className="md:hidden mb-6">
          <h1 className="font-headline text-headline-md font-bold tracking-tight uppercase text-[#0A0A0A]">
            Sovereign Intelligence
          </h1>
        </div>

        <div className="w-full max-w-md mx-auto py-8">
          {/* ── Header ── */}
          <header className="mb-6 border-b border-[#262626] pb-4 flex justify-between items-end">
            <div>
              <h2
                id="auth-heading"
                className="font-headline text-headline-lg text-[#0A0A0A]"
              >
                ACCESS GATEWAY
              </h2>
              <p className="font-body text-body-sm text-[#494551] mt-2">
                Identify yourself to proceed.
              </p>
            </div>
            <button 
              onClick={() => {
                setUsePhoneAuth(!usePhoneAuth);
                clearError();
                setLocalError('');
              }}
              className="text-xs font-technical text-[#FF4500] hover:underline"
            >
              {usePhoneAuth ? 'USE EMAIL' : 'USE PHONE'}
            </button>
          </header>

          {/* ── Error Display ── */}
          {displayError && (
            <div
              id="auth-error-banner"
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-technical text-data-mono"
              role="alert"
            >
              {displayError}
            </div>
          )}

          {/* ── Login Form ── */}
          {!usePhoneAuth ? (
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
              {/* Identifier (Email) Field */}
              <div className="relative group">
                <label
                  htmlFor="identifier"
                  className="font-technical text-technical-label text-[#494551] block mb-1 group-focus-within:text-[#FF4500] transition-colors duration-150 uppercase tracking-widest"
                >
                  IDENTIFIER [EMAIL / ID]
                </label>
                <input
                  id="identifier"
                  name="email"
                  type="text"
                  autoComplete="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="user@domain.ext"
                  disabled={loading}
                  className="input-elite disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Passphrase Field */}
              <div className="relative group">
                <label
                  htmlFor="passphrase"
                  className="font-technical text-technical-label text-[#494551] block mb-1 group-focus-within:text-[#FF4500] transition-colors duration-150 uppercase tracking-widest"
                >
                  PASSPHRASE
                </label>
                <div className="relative">
                  <input
                    id="passphrase"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="••••••••••••"
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

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF4500] text-white font-technical text-technical-label py-4 px-6 uppercase tracking-widest border border-[#FF4500] hover:bg-[#D93B00] transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      AUTHENTICATING...
                    </>
                  ) : (
                    <>
                      INITIALIZE SEQUENCE
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              {!confirmationResult ? (
                <div className="relative group">
                  <label
                    htmlFor="phone"
                    className="font-technical text-technical-label text-[#494551] block mb-1 group-focus-within:text-[#FF4500] transition-colors duration-150 uppercase tracking-widest"
                  >
                    PHONE NUMBER
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 234 567 8900"
                    disabled={loading}
                    className="input-elite disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              ) : (
                <div className="relative group">
                  <label
                    htmlFor="code"
                    className="font-technical text-technical-label text-[#494551] block mb-1 group-focus-within:text-[#FF4500] transition-colors duration-150 uppercase tracking-widest"
                  >
                    VERIFICATION CODE
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    disabled={loading}
                    className="input-elite disabled:opacity-50 disabled:cursor-not-allowed text-center tracking-widest text-lg"
                  />
                </div>
              )}
              
              <div id="recaptcha-container"></div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF4500] text-white font-technical text-technical-label py-4 px-6 uppercase tracking-widest border border-[#FF4500] hover:bg-[#D93B00] transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    <>
                      {!confirmationResult ? 'SEND CODE' : 'VERIFY CODE'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── OAuth Providers ── */}
          <div className="mt-10 flex flex-col gap-4 border-t border-[#262626] pt-6">
            <p className="font-technical text-technical-label text-[#494551] uppercase text-center">
              OR AUTHENTICATE VIA
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="bg-transparent border border-[#262626] text-[#0A0A0A] font-technical text-technical-label py-3 px-2 flex items-center justify-center gap-2 hover:border-[#FF4500] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                <span className="truncate">GOOGLE</span>
              </button>
              <button
                onClick={() => handleOAuth('github')}
                disabled={loading}
                className="bg-transparent border border-[#262626] text-[#0A0A0A] font-technical text-technical-label py-3 px-2 flex items-center justify-center gap-2 hover:border-[#FF4500] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="truncate">GITHUB</span>
              </button>
              <button
                onClick={() => handleOAuth('facebook')}
                disabled={loading}
                className="bg-transparent border border-[#262626] text-[#0A0A0A] font-technical text-technical-label py-3 px-2 flex items-center justify-center gap-2 hover:border-[#FF4500] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="truncate">FACEBOOK</span>
              </button>
              <button
                onClick={() => handleOAuth('apple')}
                disabled={loading}
                className="bg-transparent border border-[#262626] text-[#0A0A0A] font-technical text-technical-label py-3 px-2 flex items-center justify-center gap-2 hover:border-[#FF4500] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.496 3.6-2.998 1.124-1.637 1.583-3.235 1.611-3.315-.034-.017-3.111-1.196-3.14-4.802-.026-3.02 2.47-4.475 2.585-4.555-1.411-2.064-3.593-2.348-4.368-2.387-2.07-.156-4.062 1.258-5.062 1.258-.04 0-.074-.01-.111-.01-.005 0-.01-.01-.015-.01zM15.42 4.41c.823-.996 1.378-2.384 1.226-3.764-1.183.048-2.62.787-3.475 1.821-.76.882-1.405 2.302-1.226 3.654 1.332.102 2.65-.678 3.475-1.711z"/>
                </svg>
                <span className="truncate">APPLE</span>
              </button>
            </div>
          </div>

          {/* ── Recovery & Signup Links ── */}
          <div className="mt-6 flex flex-col items-center gap-3 pb-8">
            <Link
              href="#"
              className="font-technical text-data-mono text-[#494551] hover:text-[#FF4500] transition-colors duration-150 underline decoration-1 underline-offset-4"
            >
              RECOVER ACCESS CREDENTIALS
            </Link>
            <p className="font-body text-body-sm text-[#494551]">
              No account?{' '}
              <Link
                href="/signup"
                className="text-[#FF4500] hover:text-[#D93B00] font-medium underline decoration-1 underline-offset-4"
              >
                REQUEST ACCESS
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          Right Panel: Brand Visual (Desktop Only)
          ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="auth-brand-panel"
        className="hidden md:flex w-1/2 relative z-10 overflow-hidden bg-[#0A0A0A] items-center justify-center"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1a0800] to-[#0A0A0A]" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,69,0,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,69,0,0.15) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        {/* Radial glow behind the Pi symbol */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#FF4500] opacity-[0.06] blur-[120px]" />

        {/* Content — clean π identity, no floating labels */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-12">
          <PiMark variant="hero" size={520} />

          <div className="mt-8 space-y-2">
            <p className="font-technical text-technical-label text-[#FF4500]/60 uppercase tracking-[0.3em]">
              SOVEREIGN INTELLIGENCE ACCESS
            </p>
            <p className="font-body text-body-sm text-[#948e9c] max-w-xs">
              150+ AI models. One API key. Pay in your local currency.
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
          <Link
            href="#"
            className="underline-offset-4 hover:underline hover:text-[#FF4500] transition-colors"
          >
            SECURITY_PROTOCOL
          </Link>
          <Link
            href="#"
            className="underline-offset-4 hover:underline hover:text-[#FF4500] transition-colors"
          >
            ENCRYPTION_STANDARDS
          </Link>
          <Link
            href="#"
            className="underline-offset-4 hover:underline hover:text-[#FF4500] transition-colors"
          >
            ACCESS_LOGS
          </Link>
        </div>
      </footer>
    </main>
  );
}
