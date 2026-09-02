import { ContentCards, PublicPage } from "@/components/public-page";
import { getPublicAchievements } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  return <PublicPage eyebrow="GROWTH & WORKS" title="学员成长，先记录过程再展示结果" intro="作品展示、项目成果和经过授权的竞赛信息分开呈现。没有核验证据的内容不会被宣传为获奖事实。"><section className="public-content"><ContentCards items={await getPublicAchievements()} basePath="/achievements" /></section></PublicPage>;
}
