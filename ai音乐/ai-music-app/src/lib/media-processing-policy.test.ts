import { describe, expect, it } from "vitest";
import { initialMediaProcessingStatus, publicPlaybackObjectKey } from "./media-processing-policy";

describe("media processing policy", () => {
  it("queues only videos while allowing images to publish immediately", () => {
    expect(initialMediaProcessingStatus("video/mp4")).toBe("PENDING");
    expect(initialMediaProcessingStatus("image/webp")).toBe("READY");
  });

  it("uses a processed playback object only after the worker marks it ready", () => {
    expect(publicPlaybackObjectKey({ objectKey: "media/original.mp4", playbackObjectKey: "media/processed.mp4", processingStatus: "PENDING" })).toBe("media/original.mp4");
    expect(publicPlaybackObjectKey({ objectKey: "media/original.mp4", playbackObjectKey: "media/processed.mp4", processingStatus: "READY" })).toBe("media/processed.mp4");
  });
});
