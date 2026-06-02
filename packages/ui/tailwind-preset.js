/**
 * Design system DrwinDesk — preset Tailwind partagé (apps/web + apps/app).
 * Couleurs pilotées par des variables CSS (cf. src/styles.css) → thème clair/sombre.
 * UI « SaaS épuré » : sobre, aérée, accent indigo.
 */
const withAlpha = (v) => `rgb(var(${v}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: withAlpha('--surface'),
          muted: withAlpha('--surface-muted'),
          elevated: withAlpha('--surface-elevated'),
          border: withAlpha('--surface-border'),
        },
        ink: {
          DEFAULT: withAlpha('--ink'),
          muted: withAlpha('--ink-muted'),
          subtle: withAlpha('--ink-subtle'),
        },
        brand: {
          50: withAlpha('--brand-50'),
          100: withAlpha('--brand-100'),
          200: withAlpha('--brand-200'),
          300: withAlpha('--brand-300'),
          400: withAlpha('--brand-400'),
          500: withAlpha('--brand-500'),
          600: withAlpha('--brand-600'),
          700: withAlpha('--brand-700'),
          800: withAlpha('--brand-800'),
          900: withAlpha('--brand-900'),
          soft: withAlpha('--brand-soft'),
          'soft-fg': withAlpha('--brand-soft-fg'),
        },
        success: {
          DEFAULT: withAlpha('--success'),
          soft: withAlpha('--success-soft'),
          'soft-fg': withAlpha('--success-soft-fg'),
        },
        warning: {
          DEFAULT: withAlpha('--warning'),
          soft: withAlpha('--warning-soft'),
          'soft-fg': withAlpha('--warning-soft-fg'),
        },
        danger: {
          DEFAULT: withAlpha('--danger'),
          soft: withAlpha('--danger-soft'),
          'soft-fg': withAlpha('--danger-soft-fg'),
        },
      },
      ringColor: {
        DEFAULT: withAlpha('--ring'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.06)',
        elevated: '0 4px 12px rgb(16 24 40 / 0.08), 0 2px 4px rgb(16 24 40 / 0.04)',
        pop: '0 8px 28px rgb(16 24 40 / 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
