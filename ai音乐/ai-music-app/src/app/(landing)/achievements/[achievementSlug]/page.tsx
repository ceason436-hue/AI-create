import { notFound } from "next/navigation";
import { getPublicAchievements } from "@/lib/public-content";
import { PlaceholderImage, PublicPage } from "@/components/public-page";

export default async function AchievementDetailPage({ params }: { params: Promise<{ achievementSlug: string }> }) {
  const { achievementSlug } = await params;
  const item = (await getPublicAchievements()).find((entry) => entry.slug === achievementSlug);
  if (!item) notFound();
  return <PublicPage eyebrow={item.type || "WORK"} title={item.title} intro={item.summary}><section className="detail-content"><PlaceholderImage src="/tu2.png" alt="学员作品占位图" /><div className="rich-copy"><p>{item.content}</p><p className="placeholder-warning">当前内容包含品牌占位，不代表真实学员、学校、竞赛或获奖证据。</p></div></section></PublicPage>;
}
