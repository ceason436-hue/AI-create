import { describe, expect, it } from "vitest";
import { mediaSnapshot, restoredMediaData } from "./media-revisions";

describe("media revisions", () => {
  it("keeps only media metadata fields", () => expect(mediaSnapshot({ id: "ignore", title: "课堂图", status: "ACTIVE", objectKey: "media/a.webp" })).toEqual({ title: "课堂图", status: "ACTIVE", objectKey: "media/a.webp" }));
  it("rejects non-object revision payloads", () => expect(restoredMediaData("invalid")).toBeNull());
});
