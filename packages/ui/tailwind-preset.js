/**
 * Design system DrwinDesk — preset Tailwind partagé entre apps/web et apps/app.
 * Importé via `presets: [require('@drwindesk/ui/tailwind-preset')]`.
 * UI sobre, mobile-first, pensée pour des utilisateurs non techniques.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#598bff',
          500: '#3563eb',
          600: '#2348c4',
          700: '#1d3a9e',
          800: '#1d3380',
          900: '#1d2f6b',
        },
        ink: {
          DEFAULT: '#1a2233',
          muted: '#5b6577',
          subtle: '#8b94a6',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f8fb',
          border: '#e4e8ef',
        },
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.08)',
      },
    },
  },
  plugins: [],
};
