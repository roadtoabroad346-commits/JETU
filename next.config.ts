import type { NextConfig } from 'next';
import { resolve } from 'node:path';
import { getPublicEnv } from './src/lib/env/public';
import { assertPublicEnvironmentSafety } from './src/lib/env/safety';

getPublicEnv();
assertPublicEnvironmentSafety(process.env);

const nextConfig: NextConfig = {
  // Pin the app root explicitly so a stray lockfile in a parent directory
  // (e.g. the user home) cannot widen Turbopack's watched root on Windows.
  turbopack: { root: resolve() },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
