import { getPublicActivities } from "@/lib/public-content";

export async function GET() {
  return Response.json({ activities: await getPublicActivities() }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
