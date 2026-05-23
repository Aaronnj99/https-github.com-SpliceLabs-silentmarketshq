/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'chokidar', 'node-notifier'],
  },
}
module.exports = nextConfig
