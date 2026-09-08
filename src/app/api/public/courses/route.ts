import { getPublicCourses } from "@/lib/public-content";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return Response.json({ courses: await getPublicCourses({ category: url.searchParams.get("category") ?? undefined, query: url.searchParams.get("q") ?? undefined }) }, { headers: { "Cache-Control": "private, no-store" } });
}
