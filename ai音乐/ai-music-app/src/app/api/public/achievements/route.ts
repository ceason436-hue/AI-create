import { getPublicAchievements } from "@/lib/public-content";

export async function GET() {
  return Response.json({ achievements: await getPublicAchievements() }, { headers: { "Cache-Control": "private, no-store" } });
}
