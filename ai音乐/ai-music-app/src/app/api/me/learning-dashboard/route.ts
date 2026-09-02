import { AccountStatus } from "@prisma/client";
import { getCurrentAccount } from "@/lib/auth";
import { getLearningDashboardSummary, canUseLearningCenter, serializeLearningEnrollment } from "@/lib/learning";

export async function GET() {
  const account = await getCurrentAccount().catch(() => null);
  if (!account) return Response.json({ error: "请先登录。" }, { status: 401 });
  if (account.status !== AccountStatus.ACTIVE || !canUseLearningCenter(account.type)) return Response.json({ error: "当前账号没有个人学习中心。" }, { status: 403 });
  try { const summary = await getLearningDashboardSummary(account.id); return Response.json({ enrollments: summary.enrollments.map(serializeLearningEnrollment), recentCourseware: summary.recentCourseware.map((access) => ({ assetId: access.asset.id, title: access.asset.title, assetType: access.asset.assetType, courseName: access.asset.course.name, courseSlug: access.asset.course.slug, accessedAt: access.accessedAt })), courseTools: summary.courseTools, recentWorks: summary.recentWorks }, { headers: { "Cache-Control": "private, no-store" } }); } catch { return Response.json({ error: "学习数据暂时不可用。" }, { status: 503 }); }
}
