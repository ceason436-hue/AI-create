import { describe, expect, it } from "vitest";
import { toPublicMedia, type PublicMediaAssetRecord } from "./public-media";

const readyAsset: PublicMediaAssetRecord = {
  id: "media-1",
  status: "ACTIVE",
  processingStatus: "READY",
  mimeType: "image/webp",
  altText: "机器人课堂",
  title: "课程封面",
  sourceType: "REAL",
  captionObjectKey: null,
  captionLanguage: null,
};

describe("public media", () => {
  it("exposes only a stable media endpoint and public metadata", () => {
    expect(toPublicMedia(readyAsset)).toEqual({
      assetId: "media-1",
      src: "/api/media/media-1",
      mimeType: "image/webp",
      altText: "机器人课堂",
      sourceType: "REAL",
      captionsSrc: null,
      captionLanguage: null,
    });
  });

  it("does not expose disabled or unfinished media", () => {
    expect(toPublicMedia({ ...readyAsset, status: "INACTIVE" })).toBeNull();
    expect(toPublicMedia({ ...readyAsset, processingStatus: "PENDING" })).toBeNull();
    expect(toPublicMedia({ ...readyAsset, processingStatus: "FAILED" })).toBeNull();
  });

  it("uses the title as accessible fallback and exposes captions only when present", () => {
    expect(toPublicMedia({ ...readyAsset, altText: "", captionObjectKey: "captions/media-1.vtt", captionLanguage: "zh-CN" })).toMatchObject({
      altText: "课程封面",
      captionsSrc: "/api/media/media-1/captions",
      captionLanguage: "zh-CN",
    });
  });
});
