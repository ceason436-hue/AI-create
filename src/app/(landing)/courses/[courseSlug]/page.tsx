import { notFound, permanentRedirect } from "next/navigation";
import { getPublicCourse } from "@/lib/public-content";
import { findCourseTrack, findPathwayCourse } from "../course-data";
import { CourseDetailView } from "../course-detail-view";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const track = findCourseTrack(courseSlug);
  const pathway = findPathwayCourse(courseSlug);
  if (track || pathway) permanentRedirect(`/courses/directions/${courseSlug}`);

  const published = await getPublicCourse(courseSlug);
  if (!published) notFound();
  return <CourseDetailView published={published} />;
}
