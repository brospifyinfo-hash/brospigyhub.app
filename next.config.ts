import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const imageRemotePatterns = [];

if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    imageRemotePatterns.push({
      protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
      hostname: parsed.hostname,
      pathname: '/**',
    });
  } catch {
    // Ignore invalid URL in config and continue without remote image pattern.
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;
