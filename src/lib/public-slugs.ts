export const RESERVED_COURSE_DIRECTION_SLUGS = [
  "programming",
  "3d-modeling",
  "ai",
  "drone",
  "robotics",
  "innovation",
  "experience",
  "growth",
  "inventor",
  "young-scholar",
] as const;

const reservedCourseDirectionSlugs = new Set<string>(RESERVED_COURSE_DIRECTION_SLUGS);

export function isReservedCourseDirectionSlug(slug: string) {
  return reservedCourseDirectionSlugs.has(slug.trim().toLowerCase());
}
