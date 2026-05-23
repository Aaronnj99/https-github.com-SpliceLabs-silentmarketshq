/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output enables bundling the Next.js server for Electron production builds
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'chokidar', 'node-notifier'],
  },
}
module.exports = nextConfig
