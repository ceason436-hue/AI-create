import { AdminCourseEditor } from "@/components/admin-course-editor";

export default async function AdminCourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  return <AdminCourseEditor courseId={(await params).courseId} />;
}
