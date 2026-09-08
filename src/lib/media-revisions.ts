type MediaRecord = Record<string, unknown>;
const fields = ["sourceType", "objectKey", "publicUrl", "title", "altText", "mimeType", "width", "height", "captionObjectKey", "captionLanguage", "licenseNote", "status"];

export function mediaSnapshot(asset: MediaRecord) {
  return Object.fromEntries(fields.flatMap((field) => asset[field] === undefined ? [] : [[field, asset[field]]]));
}

export function restoredMediaData(payload: unknown): MediaRecord | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return mediaSnapshot(payload as MediaRecord);
}
