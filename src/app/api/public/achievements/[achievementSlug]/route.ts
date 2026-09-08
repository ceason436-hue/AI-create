import { getPublicAchievements } from "@/lib/public-content";

export async function GET(_request: Request, { params }: { params: Promise<{ achievementSlug: string }> }) {
  const { achievementSlug } = await params;
  const item = (await getPublicAchievements()).find((entry) => entry.slug === achievementSlug);
  if (!item) return Response.json({ error: "成果不存在。" }, { status: 404 });
  return Response.json({ achievement: item });
}
