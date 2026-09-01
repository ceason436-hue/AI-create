import { getPublicCourse } from "@/lib/public-content";

export async function GET(_request: Request, { params }: { params: Promise<{ courseSlug: string }> }) {
  const course = await getPublicCourse((await params).courseSlug);
  if (!course) return Response.json({ error: "课程不存在。" }, { status: 404 });
  return Response.json({ course }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
