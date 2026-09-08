export function learningProgressPercent(completedLessons: number, totalLessons: number) {
  if (totalLessons <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((completedLessons / totalLessons) * 100)));
}
