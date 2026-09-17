import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [{
      source: '/',
      has: [{ type: 'query', key: 'page', value: '(?:about|military)' }],
      destination: '/?page=home',
      permanent: true,
    }]
  },
  async rewrites() {
    // Vercel resolves public/index.html at / before afterFiles rewrites. Route
    // before the filesystem so Home cannot fall through to the legacy shell.
    return { beforeFiles: [
      {
        source: '/',
        has: [{ type: 'query', key: 'page', value: '(?:space|careers)' }],
        destination: '/index.html',
      },
      { source: '/', destination: '/vision/index.html' },
    ] }
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
}

export default nextConfig
