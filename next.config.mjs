import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactivé : ne pas exposer le code source non minifié en production.
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',

  // Ces erreurs doivent être corrigées, pas masquées.
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60,
    qualities: [75, 85, 100],
  }
};
export default nextConfig;