import type { NextConfig } from 'next';

const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
let hostname = 'localhost';
try {
  hostname = new URL(apiHost).hostname;
} catch {
  // keep default
}

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname, pathname: '/uploads/**' },
      { protocol: 'https', hostname, pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
