import { getPublicCategories } from "@/lib/public-content";

export async function GET() {
  return Response.json({ categories: await getPublicCategories() }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
