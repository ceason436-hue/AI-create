import { getPublicActivities } from "@/lib/public-content";

export async function GET(_request: Request, { params }: { params: Promise<{ activitySlug: string }> }) {
  const { activitySlug } = await params;
  const item = (await getPublicActivities()).find((entry) => entry.slug === activitySlug);
  if (!item) return Response.json({ error: "活动不存在。" }, { status: 404 });
  return Response.json({ activity: item });
}
