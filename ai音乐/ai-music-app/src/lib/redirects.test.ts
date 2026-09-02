import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

type Redirect = { source: string; destination: string; permanent: boolean };
async function redirects() { return await (nextConfig as { redirects: () => Promise<Redirect[]> }).redirects(); }

describe("legacy route redirects", () => {
  it("keeps every planned AI and music exercise migration", async () => {
    const entries = await redirects();
    expect(entries).toEqual(expect.arrayContaining([
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
    ]));
  });
});
