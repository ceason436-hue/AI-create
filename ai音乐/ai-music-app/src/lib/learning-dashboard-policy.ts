export function isEnrollmentExpiring(endsAt: Date | null, now = new Date(), days = 14) {
  return Boolean(endsAt && endsAt > now && endsAt.getTime() - now.getTime() <= days * 86_400_000);
}

export function learningContinueHref(courseSlug: string, lastLessonId: string | null, availableLessonIds: Set<string>) {
  return lastLessonId && availableLessonIds.has(lastLessonId) ? `/learn/courses/${courseSlug}/lessons/${lastLessonId}` : `/learn/courses/${courseSlug}`;
}
