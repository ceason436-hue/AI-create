import { ContentCards, PublicPage } from "@/components/public-page";
import { getPublicActivities } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  return <PublicPage eyebrow="ACTIVITIES" title="科创活动，把学习带到真实场景" intro="活动、工作坊和作品展示由运营后台维护。真实时间、地点和报名信息确认后再发布。"><section className="public-content"><ContentCards items={await getPublicActivities()} basePath="/activities" /></section></PublicPage>;
}
