import { AdminCourseAnnouncementsPage } from "@/components/admin-course-announcements-page";

export default async function AdminCourseAnnouncementsRoute({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <AdminCourseAnnouncementsPage courseId={courseId} />;
}
