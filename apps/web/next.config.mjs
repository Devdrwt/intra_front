/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le design system est consommé en source TS depuis le workspace.
  transpilePackages: ['@drwindesk/ui'],
};

export default nextConfig;
