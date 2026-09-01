import Link from "next/link";
import { AccountType } from "@prisma/client";
import { getCurrentAccount } from "@/lib/auth";
import { getLearningDashboard, canUseLearningCenter } from "@/lib/learning";

export default async function LearningDashboardPage() {
  const account = await getCurrentAccount().catch(() => null);
  if (!account) return <section className="workspace-card"><span className="eyebrow dark">MY LEARNING</span><h1>登录后开始学习</h1><p>课程、课件和学习进度只对已登录的个人学员展示。</p><Link className="button button-lime" href="/login?mode=personal">学员登录</Link></section>;
  if (account.type !== AccountType.PERSONAL || !canUseLearningCenter(account.type)) return <section className="workspace-card"><span className="eyebrow dark">MY LEARNING</span><h1>这是个人学员中心</h1><p>学校共享账号请进入课堂空间；管理员请从运营后台操作。</p><Link className="button button-lime" href="/">返回首页</Link></section>;
  const enrollments = await getLearningDashboard(account.id).catch(() => []);
  return <section className="workspace-card"><div className="learning-heading"><div><span className="eyebrow dark">MY LEARNING</span><h1>继续我的学习</h1><p>课程、课件和课程内 AI 工具都从这里开始。</p></div><Link href="/courses" className="button button-outline-dark">浏览课程</Link></div>{enrollments.length ? <div className="learning-course-grid">{enrollments.map((enrollment) => <Link href={`/learn/courses/${enrollment.course.slug}`} className="learning-course-card" key={enrollment.id}><span>{enrollment.course.category.name} · {enrollment.progressPercent}%</span><h2>{enrollment.course.name}</h2><p>{enrollment.course.shortDescription}</p><div className="learning-progress"><i style={{ width: `${enrollment.progressPercent}%` }} /></div><b>继续学习 →</b></Link>)}</div> : <div className="empty-learning"><h2>尚未加入课程</h2><p>课程报名后会出现在这里，不会伪造学习进度。</p><Link href="/consult" className="button button-lime">咨询课程</Link></div>}</section>;
}
