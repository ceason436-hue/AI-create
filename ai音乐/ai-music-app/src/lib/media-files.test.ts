import { describe, expect, it } from "vitest";
import { isWebVtt, matchesMediaSignature, mediaMimeType, publicMediaUrl } from "./media-files";

describe("media file policy", () => {
  it("only accepts known image extensions with matching MIME types", () => {
    expect(mediaMimeType("Campus.JPG", "image/jpeg")).toBe("image/jpeg");
    expect(mediaMimeType("poster.webp", "image/webp")).toBe("image/webp");
    expect(mediaMimeType("clip.mp4", "video/mp4")).toBe("video/mp4");
    expect(mediaMimeType("photo.png", "image/jpeg")).toBeNull();
  });

  it("uses an internal public proxy for managed asset ids", () => {
    expect(publicMediaUrl("asset-1")).toBe("/api/media/asset-1");
    expect(publicMediaUrl("/handbook/handbook-05.png")).toBe("/handbook/handbook-05.png");
  });

  it("checks a file signature before accepting public media", () => {
    expect(matchesMediaSignature("image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(matchesMediaSignature("video/mp4", Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70]))).toBe(true);
    expect(matchesMediaSignature("video/webm", Buffer.from("not-a-video"))).toBe(false);
  });

  it("accepts only WebVTT text as a caption payload", () => {
    expect(isWebVtt(Buffer.from("WEBVTT\n\n00:00.000 --> 00:01.000\n字幕"))).toBe(true);
    expect(isWebVtt(Buffer.from("not a caption"))).toBe(false);
  });
});
