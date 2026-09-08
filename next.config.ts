import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // CI/review builds can use a separate directory while the local dev server owns .next.
  distDir: process.env.KRT_NEXT_DIST_DIR || ".next",
  // Permit both common loopback names during local development. Without this,
  // opening 127.0.0.1 blocks Next's client runtime and makes client buttons inert.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
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
