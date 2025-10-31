/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack configuration
  turbopack: {
    // Turbopack-specific configurations can be added here if needed
  },
  // Optional: Enable experimental Turbopack features
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}

module.exports = nextConfig

