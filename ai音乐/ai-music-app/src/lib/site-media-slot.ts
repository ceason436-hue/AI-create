export type PublicMediaSlot = { slotKey: string; title: string; description: string | null; aspectRatio: string | null; focalPoint: string | null; src: string; mimeType: string | null; mobileSrc?: string | null; mobileMimeType?: string | null; altText: string };

export function slotMedia(slots: Record<string, PublicMediaSlot>, slotKey: string, fallback: Pick<PublicMediaSlot, "src" | "mimeType" | "altText">) {
  return slots[slotKey] ?? { slotKey, title: "品牌占位", description: null, aspectRatio: null, focalPoint: null, ...fallback };
}
