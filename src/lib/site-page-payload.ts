export type PublishedSection = { id: string; sectionType: string; title: string | null; payload: unknown; sortOrder: number };

export function sectionPayload<T extends Record<string, unknown>>(sections: PublishedSection[], sectionType: string, fallback: T) {
  const payload = sections.find((section) => section.sectionType === sectionType)?.payload;
  return payload && typeof payload === "object" && !Array.isArray(payload) ? { ...fallback, ...(payload as Partial<T>) } : fallback;
}
