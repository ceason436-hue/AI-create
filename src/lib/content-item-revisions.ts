export const revisionableContentTypes = ["activities", "achievements", "teachers", "campuses", "partners"] as const;
export type RevisionableContentType = (typeof revisionableContentTypes)[number];

type ContentItem = Record<string, unknown>;

function copy(item: ContentItem, fields: string[]) {
  return Object.fromEntries(fields.flatMap((field) => item[field] === undefined ? [] : [[field, item[field] instanceof Date ? item[field].toISOString() : item[field]]]));
}

/** Return a minimal, JSON-safe snapshot rather than serialising Prisma metadata. */
export function contentItemSnapshot(contentType: RevisionableContentType, item: ContentItem) {
  switch (contentType) {
    case "activities": return copy(item, ["slug", "title", "summary", "content", "activityType", "startsAt", "endsAt", "location", "coverAssetId", "publishStatus", "publishedAt", "sortOrder"]);
    case "achievements": return copy(item, ["slug", "title", "summary", "content", "achievementType", "proofNote", "coverAssetId", "publishStatus", "publishedAt", "sortOrder"]);
    case "teachers": return copy(item, ["name", "title", "bio", "avatarAssetId", "publishStatus", "sortOrder"]);
    case "campuses": return copy(item, ["name", "address", "description", "coverAssetId", "publishStatus", "sortOrder"]);
    case "partners": return copy(item, ["name", "logoAssetId", "description", "publishStatus", "sortOrder"]);
  }
}

/** Whitelist snapshot fields before restoring them to a content model. */
export function restoredContentItemData(contentType: RevisionableContentType, payload: unknown): ContentItem | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const snapshot = payload as ContentItem;
  return contentItemSnapshot(contentType, snapshot);
}

export function isRevisionableContentType(value: string): value is RevisionableContentType {
  return (revisionableContentTypes as readonly string[]).includes(value);
}
