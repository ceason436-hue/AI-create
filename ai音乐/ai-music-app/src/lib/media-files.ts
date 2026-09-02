const mimeTypes: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif",
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
