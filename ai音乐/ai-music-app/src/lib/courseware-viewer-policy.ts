export function boundedCoursewarePage(page: number, pageCount?: number | null) {
  const maximum = Math.max(1, pageCount ?? 1);
  return Math.min(maximum, Math.max(1, Math.trunc(page) || 1));
}

export function coursewarePreviewUrl(contentUrl: string, page: number, pageCount?: number | null) {
  return `${contentUrl}#page=${boundedCoursewarePage(page, pageCount)}`;
}
