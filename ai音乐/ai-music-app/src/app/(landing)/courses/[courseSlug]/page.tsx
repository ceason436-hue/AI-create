import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCourse } from "@/lib/public-content";
import { PlaceholderImage, PublicPage } from "@/components/public-page";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const course = await getPublicCourse((await params).courseSlug);
  if (!course) notFound();
  return <PublicPage eyebrow={`${course.category.name} · ${course.difficulty}`} title={course.name} intro={course.shortDescription}><section className="detail-content"><div className="detail-hero-grid"><PlaceholderImage src={course.category.coverAssetId ?? "/tu1.jpg"} alt="课程概念占位图" className="detail-cover" /><div className="detail-summary"><div className="course-meta"><span>{course.gradeRange}</span><span>{course.durationText}</span><span>{course.deliveryModes.join(" / ")}</span></div><h2>把好奇心，变成一件完成的作品。</h2><p>{course.fullDescription}</p><div className="detail-actions"><Link href="/consult" className="button button-lime">咨询这门课程</Link><Link href="/login" className="button button-outline-dark">登录查看我的课程</Link></div></div></div><div className="detail-columns"><div><span className="eyebrow dark">WHAT YOU WILL MAKE</span><h2>课程会发生什么</h2><p>{course.targetAudience}</p><div className="module-list">{course.modules.map((module, index) => <article key={module.id} className="module-card"><span>0{index + 1}</span><div><h3>{module.title}</h3><p>{module.description}</p><ul>{module.lessons.map((lesson) => <li key={lesson.id}>{lesson.title}<small>{lesson.estimatedMinutes} 分钟 · {lesson.summary}</small></li>)}</ul></div></article>)}</div></div><aside className="detail-note"><strong>关于课程资料</strong><p>正式课件只对已报名且报名有效的学员开放，公开课程页不会暴露受保护文件。</p><strong>AI 工具</strong><p>课程任务可以打开同一套创作工具，并携带经过服务端验证的课程上下文。</p></aside></div></section></PublicPage>;
}
