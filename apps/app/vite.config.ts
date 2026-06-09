import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// SPA interne (ERP/SIRH). Port 3002 (déclaré dans CORS_ORIGINS du backend).
// Le proxy /api → backend NestJS rend les cookies same-origin en dev.
export default defineConfig(({ mode }) => {
  // loadEnv lit apps/app/.env (process.env n'est PAS peuplé depuis .env ici).
  const env = loadEnv(mode, path.resolve(__dirname), '');
  return {
    plugins: [
      react(),
      // PWA : app installable (écran d'accueil mobile, plein écran) + service worker.
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
        manifest: {
          name: 'DrwinDesk — Espace collaborateur',
          short_name: 'DrwinDesk',
          description: 'Intranet / ERP / SIRH — actions rapides (pointage, demandes, messages).',
          lang: 'fr',
          theme_color: '#4F46E5',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          ],
        },
        workbox: {
          // Ne jamais servir le shell en fallback pour les appels API.
          navigateFallbackDenylist: [/^\/api/],
          globPatterns: ['**/*.{js,css,html,svg,woff2,png}'],
          cleanupOutdatedCaches: true,
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3002,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
