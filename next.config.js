/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Enable standalone mode for Electron
  experimental: {
    outputFileTracingRoot: undefined
  }
}

module.exports = nextConfig