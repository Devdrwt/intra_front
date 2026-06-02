import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// SPA interne (ERP/SIRH). Port 3002 (déclaré dans CORS_ORIGINS du backend).
// Le proxy /api → backend NestJS rend les cookies same-origin en dev.
export default defineConfig(({ mode }) => {
  // loadEnv lit apps/app/.env (process.env n'est PAS peuplé depuis .env ici).
  const env = loadEnv(mode, path.resolve(__dirname), '');
  return {
    plugins: [react()],
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
