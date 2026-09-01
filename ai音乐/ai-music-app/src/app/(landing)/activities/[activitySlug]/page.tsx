import { notFound } from "next/navigation";
import { getPublicActivities } from "@/lib/public-content";
import { PlaceholderImage, PublicPage } from "@/components/public-page";

export default async function ActivityDetailPage({ params }: { params: Promise<{ activitySlug: string }> }) {
  const { activitySlug } = await params;
  const item = (await getPublicActivities()).find((entry) => entry.slug === activitySlug);
  if (!item) notFound();
  return <PublicPage eyebrow={item.type || "ACTIVITY"} title={item.title} intro={item.summary}><section className="detail-content"><PlaceholderImage src="/tu1.jpg" alt="活动场景占位图" /><div className="rich-copy"><p>{item.content}</p><p>活动的正式时间、地点、适合对象和报名方式将在资料确认后由后台发布。</p></div></section></PublicPage>;
}
