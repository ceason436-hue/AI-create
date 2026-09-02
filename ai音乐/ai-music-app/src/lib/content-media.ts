export const mediaContentTypes = ["activities", "achievements", "teachers", "campuses", "partners"] as const;
export function isMediaContentType(value: string): value is (typeof mediaContentTypes)[number] { return (mediaContentTypes as readonly string[]).includes(value); }
export function orderedMedia<T extends { sortOrder: number; isCover: boolean }>(entries: T[]) { return [...entries].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder); }
