import Link from "next/link";
import { getCurrentAccount } from "@/lib/auth";
import { getLearningDashboard } from "@/lib/learning";

export default async function MyCoursesPage() { const account = await getCurrentAccount().catch(() => null); if (!account) return <section className="workspace-card"><h1>请先登录</h1><Link href="/login?mode=personal" className="button button-lime">学员登录</Link></section>; const enrollments = await getLearningDashboard(account.id).catch(() => []); return <section className="workspace-card"><span className="eyebrow dark">MY COURSES</span><h1>我的课程</h1><div className="learning-course-grid">{enrollments.map((enrollment) => <Link href={`/learn/courses/${enrollment.course.slug}`} className="learning-course-card" key={enrollment.id}><span>{enrollment.course.category.name}</span><h2>{enrollment.course.name}</h2><p>{enrollment.course.shortDescription}</p><b>查看课程 →</b></Link>)}</div>{!enrollments.length && <p className="empty-learning">当前没有有效报名课程。</p>}</section>; }
