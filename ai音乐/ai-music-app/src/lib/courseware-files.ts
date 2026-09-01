const mimeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export type CoursewareAssetType = "PDF" | "PPT" | "WORD" | "IMAGE" | "VIDEO";

export function extensionFromFileName(fileName: string) {
  const extension = fileName.trim().split(".").pop()?.toLowerCase() ?? "";
  return /^[a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

export function coursewareTypeFromExtension(extension: string): CoursewareAssetType | null {
  if (extension === "pdf") return "PDF";
  if (["ppt", "pptx"].includes(extension)) return "PPT";
  if (["doc", "docx"].includes(extension)) return "WORD";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) return "IMAGE";
  if (["mp4", "webm", "mov"].includes(extension)) return "VIDEO";
  return null;
}

export function coursewareMimeType(extension: string, suppliedMimeType?: string) {
  const normalized = suppliedMimeType?.trim().toLowerCase();
  if (normalized && (normalized === mimeByExtension[extension] || normalized.startsWith("image/") || normalized.startsWith("video/"))) return normalized;
  return mimeByExtension[extension] ?? "application/octet-stream";
}

export function isConvertibleCourseware(type: CoursewareAssetType) {
  return type === "PPT" || type === "WORD";
}

export function previewMimeType(type: CoursewareAssetType, originalMimeType: string) {
  return isConvertibleCourseware(type) ? "application/pdf" : originalMimeType;
}
