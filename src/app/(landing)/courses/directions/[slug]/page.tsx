import { notFound } from "next/navigation";
import { CourseDetailView } from "../../course-detail-view";
import { findCourseTrack, findPathwayCourse } from "../../course-data";

export default async function CourseDirectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const track = findCourseTrack(slug);
  if (track) return <CourseDetailView track={track} />;

  const pathway = findPathwayCourse(slug);
  if (pathway) return <CourseDetailView pathway={pathway} />;

  notFound();
}
