'use client';

/**
 * ReadyPI Modern Animated Sign-In Components
 * BoxReveal animation + styled Input + Label
 */

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// BoxReveal Animation Component
// =============================================================================

interface BoxRevealProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  boxHeight?: number;
  boxColor?: string;
  width?: string | number;
  overflow?: 'hidden' | 'visible' | 'auto' | 'clip';
}

export function BoxReveal({
  children,
  className,
  duration = 0.5,
  delay = 0,
  boxHeight = 100,
  boxColor = '#ff6b4a',
  width,
  overflow = 'hidden',
}: BoxRevealProps) {
  return (
    <div 
      className={cn('relative', className)} 
      style={{ width: width as React.CSSProperties['width'], overflow }}
    >
      <motion.div
        initial={{ height: boxHeight, backgroundColor: boxColor }}
        animate={{ height: 0 }}
        transition={{
          duration,
          delay,
          ease: [0.65, 0, 0.35, 1],
        }}
        className="absolute inset-0 z-10"
        style={{
          transformOrigin: 'top',
          backgroundColor: boxColor,
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: delay + duration * 0.5,
          ease: 'easeOut',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// BoxReveal2 - Alternative version with width animation
// =============================================================================

interface BoxReveal2Props {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}

export function BoxReveal2({
  children,
  className,
  duration = 0.6,
  delay = 0,
}: BoxReveal2Props) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{
          duration,
          delay,
          ease: [0.65, 0, 0.35, 1],
        }}
        className="absolute inset-0 bg-gradient-to-r from-[#ff6b4a] to-[#ff8a6a] origin-left"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: delay + duration * 0.6,
          ease: 'easeOut',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// Animated Input Component
// =============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    return (
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#ff6b4a] transition-colors">
          {icon}
        </div>
        <input
          ref={ref}
          className={cn(
            'w-full bg-[#0d1117] border rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder:text-gray-500 transition-all duration-300 outline-none',
            'focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-800 hover:border-gray-700',
            icon && 'pl-12',
            className
          )}
          {...props}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </motion.div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// =============================================================================
// Animated Label Component
// =============================================================================

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  htmlFor?: string;
}

export function Label({ children, className, animate = true, htmlFor }: LabelProps) {
  const baseClassName = cn(
    'block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2',
    animate && 'cursor-pointer',
    className
  );
  
  if (animate) {
    return (
      <motion.label
        className={baseClassName}
        htmlFor={htmlFor}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.label>
    );
  }
  
  return (
    <label className={baseClassName} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

// =============================================================================
// Animated Textarea Component
// =============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-[#0d1117] border rounded-xl px-4 py-3.5 text-sm font-mono text-white placeholder:text-gray-500 transition-all duration-300 outline-none resize-none',
          'focus:border-[#ff6b4a] focus:ring-2 focus:ring-[#ff6b4a]/20',
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-800 hover:border-gray-700',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

// =============================================================================
// SignIn Button Component
// =============================================================================

interface SignInButtonProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export function SignInButton({
  children,
  className,
  loading,
  variant = 'primary',
  disabled,
  type = 'button',
  onClick,
}: SignInButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'w-full py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all duration-300 font-bold flex items-center justify-center gap-2',
        variant === 'primary' && 'bg-gradient-to-r from-[#ff6b4a] to-[#c8381a] text-white hover:shadow-[0_0_30px_rgba(255,107,74,0.5)]',
        variant === 'secondary' && 'bg-[#141218] text-white border border-gray-800 hover:border-[#ff6b4a]',
        variant === 'outline' && 'border border-gray-700 text-gray-400 hover:border-[#ff6b4a] hover:text-[#ff6b4a]',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// =============================================================================
// OAuth Button Component
// =============================================================================

interface OAuthButtonProps {
  provider: 'google' | 'github' | 'facebook' | 'apple';
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

const providerIcons: Record<string, string> = {
  google: 'M4.5 3A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3h-15zM12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z',
  github: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
  facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  apple: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z',
};

export function OAuthButton({
  provider,
  children,
  className,
  loading,
  disabled,
  type = 'button',
  onClick,
}: OAuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'w-full py-3 rounded-xl font-mono text-sm transition-all duration-300 flex items-center justify-center gap-3',
        'bg-[#0d1117] border border-gray-800 text-white hover:border-gray-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full"
        />
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d={providerIcons[provider]} />
          </svg>
          <span>{children}</span>
        </>
      )}
    </button>
  );
}