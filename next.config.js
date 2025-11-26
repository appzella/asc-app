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

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

