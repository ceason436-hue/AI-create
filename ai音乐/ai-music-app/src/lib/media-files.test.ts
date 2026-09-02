import { describe, expect, it } from "vitest";
import { mediaMimeType, publicMediaUrl } from "./media-files";

describe("media file policy", () => {
  it("only accepts known image extensions with matching MIME types", () => {
    expect(mediaMimeType("Campus.JPG", "image/jpeg")).toBe("image/jpeg");
    expect(mediaMimeType("poster.webp", "image/webp")).toBe("image/webp");
    expect(mediaMimeType("clip.mp4", "video/mp4")).toBeNull();
    expect(mediaMimeType("photo.png", "image/jpeg")).toBeNull();
  });

  it("uses an internal public proxy for managed asset ids", () => {
    expect(publicMediaUrl("asset-1")).toBe("/api/media/asset-1");
    expect(publicMediaUrl("/handbook/handbook-05.png")).toBe("/handbook/handbook-05.png");
  });
});
