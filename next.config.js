/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack configuration
  // turbopack: {},
  // Optional: Enable experimental Turbopack features
  experimental: {
    // turbopackFileSystemCacheForDev: true,
  },
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

