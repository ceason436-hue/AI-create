import { AccountStatus } from "@prisma/client";
import { getCurrentAccount } from "@/lib/auth";
import { getLearningDashboard, canUseLearningCenter, serializeLearningEnrollment } from "@/lib/learning";

export async function GET() {
  const account = await getCurrentAccount().catch(() => null);
  if (!account) return Response.json({ error: "请先登录。" }, { status: 401 });
  if (account.status !== AccountStatus.ACTIVE || !canUseLearningCenter(account.type)) return Response.json({ error: "当前账号没有个人学习中心。" }, { status: 403 });
  try { const enrollments = await getLearningDashboard(account.id); return Response.json({ enrollments: enrollments.map(serializeLearningEnrollment) }, { headers: { "Cache-Control": "private, no-store" } }); } catch { return Response.json({ error: "学习数据暂时不可用。" }, { status: 503 }); }
}
