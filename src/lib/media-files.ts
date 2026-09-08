const mimeTypes: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif",
  mp4: "video/mp4", webm: "video/webm",
};

export function mediaExtension(fileName: string) {
  return fileName.trim().toLowerCase().split(".").pop()?.replace(/[^a-z0-9]/g, "") ?? "";
}

export function mediaMimeType(fileName: string, declaredType: string) {
  const extension = mediaExtension(fileName);
  const expected = mimeTypes[extension];
  if (!expected) return null;
  if (declaredType && declaredType !== expected) return null;
  return expected;
}

export function publicMediaUrl(assetId: string | null | undefined) {
  return assetId ? (assetId.startsWith("/") ? assetId : `/api/media/${assetId}`) : null;
}

export function publicCaptionUrl(assetId: string | null | undefined) {
  return assetId ? `/api/media/${assetId}/captions` : null;
}

export function mediaKind(mimeType: string) {
  return mimeType.startsWith("video/") ? "video" : mimeType.startsWith("image/") ? "image" : null;
}

export function matchesMediaSignature(mimeType: string, data: Buffer) {
  if (mimeType === "image/jpeg") return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mimeType === "image/png") return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/gif") return data.subarray(0, 6).toString("ascii") === "GIF87a" || data.subarray(0, 6).toString("ascii") === "GIF89a";
  if (mimeType === "image/webp") return data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP";
  if (mimeType === "image/avif") return data.subarray(4, 12).toString("ascii").includes("ftyp") && data.subarray(8, 16).toString("ascii").includes("avif");
  if (mimeType === "video/mp4") return data.subarray(4, 8).toString("ascii") === "ftyp";
  if (mimeType === "video/webm") return data.length >= 4 && data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

export function isWebVtt(data: Buffer) {
  return data.subarray(0, 4).toString("utf8") === "\uFEFFWEB" || data.toString("utf8", 0, Math.min(data.length, 128)).trimStart().startsWith("WEBVTT");
}
