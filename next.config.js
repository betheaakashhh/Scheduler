// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "pdf-parse", "tesseract.js"] },
  images: { remotePatterns: [] },
};

module.exports = nextConfig;
