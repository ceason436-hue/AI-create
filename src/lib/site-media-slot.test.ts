import { describe, expect, it } from "vitest";
import { slotMedia, type PublicMediaSlot } from "./site-media-slot";

describe("slotMedia", () => {
  const published: PublicMediaSlot = { slotKey: "home-hero", title: "首屏", description: null, aspectRatio: "16:9", focalPoint: "center", src: "/api/media/hero", mimeType: "video/mp4", altText: "课堂活动视频" };
  it("uses a published media slot when available", () => expect(slotMedia({ "home-hero": published }, "home-hero", { src: "/tu1.jpg", mimeType: "image/jpeg", altText: "占位" })).toBe(published));
  it("keeps a stable fallback when the slot is hidden or absent", () => expect(slotMedia({}, "home-hero", { src: "/tu1.jpg", mimeType: "image/jpeg", altText: "占位" }).src).toBe("/tu1.jpg"));
});
