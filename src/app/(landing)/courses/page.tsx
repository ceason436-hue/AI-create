import { ReferenceCourses } from "@/components/reference-courses";
import { PublicShell } from "@/components/public-shell";
import { coursesPageContent } from "@/lib/public-page-contract";
import { loadPublishedPageSections } from "@/lib/site-pages";
import { loadPublicCourseCatalog } from "@/lib/public-content";
import { loadPublicMediaSlots } from "@/lib/media-slots";

export default async function CoursesPage() {
  const [page, catalog, media] = await Promise.all([loadPublishedPageSections("courses"), loadPublicCourseCatalog(), loadPublicMediaSlots(["courses-hero"])]);
  return <PublicShell><ReferenceCourses content={coursesPageContent(page.sections)} contentState={page.state} categories={catalog.categories} publishedCourses={catalog.courses} catalogState={catalog.state} heroMedia={media.slots["courses-hero"]} mediaState={media.state} /></PublicShell>;
}
