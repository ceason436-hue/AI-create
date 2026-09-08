import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1536, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    qualities: [60, 72, 75, 80, 85],
  },
  async redirects() {
    return [
      { source: "/ai-music", destination: "/tools?category=music", permanent: true },
      { source: "/ai-art", destination: "/tools/ai-art", permanent: true },
      { source: "/ai-programming", destination: "/tools/ai-programming", permanent: true },
      { source: "/ai-reading", destination: "/tools/ai-reading", permanent: true },
      { source: "/ai-reading/workspace", destination: "/tools/ai-reading/workspace", permanent: true },
      { source: "/ai-reading/overview", destination: "/tools/ai-reading/result", permanent: true },
      { source: "/ai-music/creation", destination: "/tools/ai-music", permanent: true },
      { source: "/stage1/rhythm", destination: "/tools/music/rhythm", permanent: true },
      { source: "/stage1/pitch-explorer", destination: "/tools/music/pitch", permanent: true },
      { source: "/stage1/melody", destination: "/tools/music/melody", permanent: true },
      { source: "/stage1/three-keys", destination: "/tools/music/three-keys", permanent: true },
      { source: "/stage1", destination: "/tools/music", permanent: true },
    ];
  },
};

export default nextConfig;
