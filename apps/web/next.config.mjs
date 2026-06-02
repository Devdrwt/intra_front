// Backend NestJS (intra_back). Proxy same-origin → cookies/CSRF sans CORS.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le design system est consommé en source TS depuis le workspace.
  transpilePackages: ['@drwindesk/ui'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
