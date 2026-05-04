/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Elite Dark Design System ── */
        ink: '#0a0a0f',
        surface: {
          DEFAULT: '#141218',
          dim: '#141218',
          container: '#211f24',
          'container-low': '#1d1b20',
          'container-high': '#2b292f',
          'container-highest': '#36343a',
          bright: '#3b383e',
          variant: '#36343a',
          tint: '#cfbcff',
        },
        'on-surface': '#e6e0e9',
        'on-surface-variant': '#cbc4d2',
        background: '#141218',
        'on-background': '#e6e0e9',
        primary: {
          DEFAULT: '#cfbcff',
          container: '#6750a4',
          fixed: '#e9ddff',
          'fixed-dim': '#cfbcff',
        },
        'on-primary': '#381e72',
        'on-primary-container': '#e0d2ff',
        secondary: {
          DEFAULT: '#cdc0e9',
          container: '#4d4465',
          fixed: '#e9ddff',
          'fixed-dim': '#cdc0e9',
        },
        'on-secondary': '#342b4b',
        'on-secondary-container': '#bfb2da',
        tertiary: {
          DEFAULT: '#e7c365',
          container: '#c9a74d',
          fixed: '#ffdf93',
          'fixed-dim': '#e7c365',
        },
        'on-tertiary': '#3e2e00',
        'on-tertiary-container': '#503d00',
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        'on-error': '#690005',
        'on-error-container': '#ffdad6',
        outline: {
          DEFAULT: '#948e9c',
          variant: '#494551',
        },
        inverse: {
          surface: '#e6e0e9',
          'on-surface': '#322f35',
          primary: '#6750a4',
        },
        /* ── Brand Accent (from design) ── */
        accent: {
          DEFAULT: '#FF4500',
          hover: '#D93B00',
          light: '#ff6b4a',
        },
        /* ── Legacy aliases ── */
        paper: '#f5f0e8',
        paper2: '#ede8dc',
        gold: '#b8860b',
        mid: '#4a4540',
        light: '#8a8278',
        rule: '#d4cfc4',
        neon: '#00ff88',
      },
      fontFamily: {
        fraunces: ['Fraunces', 'serif'],
        serif: ['Noto Serif', 'Fraunces', 'serif'],
        mono: ['Space Grotesk', 'DM Mono', 'monospace'],
        sans: ['Inter', 'Cabinet Grotesk', 'system-ui', 'sans-serif'],
        technical: ['Space Grotesk', 'monospace'],
        body: ['Inter', 'sans-serif'],
        headline: ['Noto Serif', 'Fraunces', 'serif'],
      },
      fontSize: {
        'technical-label': ['12px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '500' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-base': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-xl': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'data-mono': ['14px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '400' }],
      },
      spacing: {
        gutter: '16px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        margin: '32px',
        unit: '4px',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      animation: {
        'slide-up': 'slide-up 0.6s ease-out',
        'fade-in': 'fade-in 0.8s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'ripple': 'ripple 2s ease calc(var(--i, 0) * 0.2s) infinite',
        'orbit': 'orbit calc(var(--duration) * 1s) linear infinite',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        ripple: {
          '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
          '50%': { transform: 'translate(-50%, -50%) scale(0.9)' },
        },
        orbit: {
          '0%': {
            transform:
              'rotate(0deg) translateY(calc(var(--radius) * 1px)) rotate(0deg)',
          },
          '100%': {
            transform:
              'rotate(360deg) translateY(calc(var(--radius) * 1px)) rotate(-360deg)',
          },
        },
      },
    },
  },
  plugins: [],
};
