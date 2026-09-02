import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getPublicActivities, getPublicAchievements, getPublicCourses, placeholderMedia } from "@/lib/public-content";
import { getPublishedPageSections } from "@/lib/site-pages";
import { sectionPayload } from "@/lib/site-page-payload";
import { getPublicMediaSlots } from "@/lib/media-slots";
import { slotMedia, type PublicMediaSlot } from "@/lib/site-media-slot";

export const dynamic = "force-dynamic";

const tools = [
  { name: "AI 音乐", detail: "从节奏与旋律开始", href: "/tools/ai-music", image: "/tu1.jpg", className: "tool-card-blue" },
  { name: "AI 绘画", detail: "把想象变成画面", href: "/tools/ai-art", image: "/tu2.png", className: "tool-card-green" },
  { name: "AI 编程", detail: "让创意成为可运行的作品", href: "/tools/ai-programming", image: "/logo2.png", className: "tool-card-dark" },
  { name: "AI 阅读", detail: "边读边画，做自己的绘本", href: "/tools/ai-reading", image: "/haibao1.png", className: "tool-card-white" },
];

function SlotVisual({ slot, width, height, priority = false }: { slot: PublicMediaSlot; width: number; height: number; priority?: boolean }) {
  const style = { objectPosition: slot.focalPoint || "center" };
  if (slot.mimeType?.startsWith("video/")) return <video src={slot.src} muted autoPlay loop playsInline preload="metadata" aria-label={slot.altText} style={style} />;
  if (slot.mobileSrc && !slot.mobileMimeType?.startsWith("video/")) return <picture><source media="(max-width: 680px)" srcSet={slot.mobileSrc} /><img src={slot.src} alt={slot.altText} width={width} height={height} style={style} /></picture>;
  return <Image src={slot.src} alt={slot.altText} width={width} height={height} priority={priority} style={style} />;
}

export default async function LandingPage() {
  const [courses, activities, achievements, homeSections, mediaSlots] = await Promise.all([getPublicCourses(), getPublicActivities(), getPublicAchievements(), getPublishedPageSections("home"), getPublicMediaSlots(["home-hero", "home-work", "home-school-cooperation"])]);
  const hero = sectionPayload(homeSections, "HERO", { eyebrow: "CREATE WITH INTELLIGENCE · KRT AI", title: "让孩子从使用科技，走向创造科技。", intro: "把 AI、机器人和项目式学习放进孩子真正能理解、能动手、能展示的创作过程里。", primaryLabel: "查看课程体系", secondaryLabel: "校园合作" });
  const process = sectionPayload(homeSections, "PROCESS", { eyebrow: "HOW IT WORKS", title: "学习不是看完一页，而是完成一次创作。", intro: "每一个课程任务都把理解、实践和表达连在一起。孩子可以在安全的工具环境里试错，再把过程整理成自己的作品。", buttonLabel: "了解 AI 创作启航" });
  const consult = sectionPayload(homeSections, "CONSULT_CTA", { eyebrow: "MAKE THE NEXT THING", title: "准备好开始一项真正属于孩子的创作了吗？", intro: "告诉我们孩子的年龄、兴趣和目标，我们会一起找到合适的开始方式。", buttonLabel: "课程咨询" });
  const heroVisual = slotMedia(mediaSlots, "home-hero", { src: placeholderMedia.scene, mimeType: "image/jpeg", altText: "AI 科创学习场景占位图" });
  const workVisual = slotMedia(mediaSlots, "home-work", { src: placeholderMedia.art, mimeType: "image/png", altText: "AI 作品占位图" });
  const cooperationVisual = slotMedia(mediaSlots, "home-school-cooperation", { src: placeholderMedia.scene, mimeType: "image/jpeg", altText: "校园合作场景占位图" });
  return (
    <PublicShell>
      <main>
        <section className="hero-section">
          <div className="hero-copy"><span className="eyebrow">{hero.eyebrow}</span><h1>{hero.title}</h1><p>{hero.intro}</p><div className="hero-actions"><Link href="/courses" className="button button-lime">{hero.primaryLabel}</Link><Link href="/school-cooperation" className="button button-outline">{hero.secondaryLabel}</Link></div><div className="hero-pills"><span>AI 科创教育</span><span>项目制学习</span><span>作品可展示</span></div></div>
          <div className="hero-stage"><div className="hero-stage-main"><SlotVisual slot={heroVisual} width={1200} height={800} priority /></div><div className="floating-card floating-card-path"><small>学习路径</small><strong>课程 → 实践 → 创作 → 展示</strong></div><div className="floating-card floating-card-art"><SlotVisual slot={workVisual} width={120} height={96} /><span>一件正在发生的作品</span></div></div>
        </section>

        <section className="shortcut-section page-section"><div className="section-intro"><span className="eyebrow dark">START HERE</span><h2>找到适合你的下一步</h2><p>不同身份有不同的入口，先从最重要的事情开始。</p></div><div className="shortcut-grid"><Link href="/login" className="shortcut-card shortcut-card-blue"><span>在读学员</span><strong>继续我的学习 →</strong><small>进入课程、课件和作品空间</small></Link><Link href="/school-cooperation" className="shortcut-card shortcut-card-dark"><span>学校与机构</span><strong>了解校园合作 →</strong><small>课程进校、课堂账号与 AI 工具</small></Link><Link href="/consult" className="shortcut-card shortcut-card-lime"><span>家长与新同学</span><strong>咨询课程 →</strong><small>根据年龄、兴趣和目标开始选择</small></Link></div></section>

        <section className="category-section page-section"><div className="section-heading"><div><span className="eyebrow dark">COURSE SYSTEM</span><h2>三条学习路径，持续长出作品</h2></div><Link href="/courses" className="text-link">浏览全部课程 ↗</Link></div><div className="category-grid">{[...new Map(courses.map((course) => [course.category.slug, course.category])).values()].slice(0, 3).map((category, index) => <Link key={category.slug} href={`/courses?category=${category.slug}`} className={`category-card category-${index + 1}`}><div className="category-number">0{index + 1}</div><h3>{category.name}</h3><p>{category.description}</p><span>查看方向 →</span></Link>)}</div><div className="course-preview-row">{courses.slice(0, 3).map((course) => <Link href={`/courses/${course.slug}`} key={course.id} className="mini-course"><span>{course.category.name}</span><strong>{course.name}</strong><small>{course.shortDescription}</small></Link>)}</div></section>

        <section className="process-section page-section"><div className="process-copy"><span className="eyebrow">{process.eyebrow}</span><h2>{process.title}</h2><p>{process.intro}</p><Link href="/courses/ai-creation-starter" className="button button-lime">{process.buttonLabel}</Link></div><div className="process-steps">{["课程学习", "课件实践", "AI 工具创作", "作品成果"].map((step, index) => <div className="process-step" key={step}><b>0{index + 1}</b><div><strong>{step}</strong><span>{["理解问题和方法", "跟着任务动手做", "把想法变成作品", "展示、复盘和迭代"][index]}</span></div></div>)}</div></section>

        <section className="tools-section page-section"><div className="section-heading light"><div><span className="eyebrow">ONE GATEWAY · FOUR WAYS TO CREATE</span><h2>创作空间，随时从灵感出发</h2></div><Link href="/tools" className="text-link light-link">进入创作空间 ↗</Link></div><div className="tools-grid">{tools.map((tool) => <Link href={tool.href} key={tool.name} className={`tool-card ${tool.className}`}><div className="tool-image"><Image src={tool.image} alt={`${tool.name}占位图`} width={600} height={380} /></div><div><span>{tool.detail}</span><h3>{tool.name}</h3></div></Link>)}</div><p className="trial-note">登录后按账户权益使用；访客每个 AI 业务工具每天可试用 5 次，匿名结果只留在当前浏览器。</p></section>

        <section className="cooperation-section page-section"><div className="cooperation-visual"><SlotVisual slot={cooperationVisual} width={900} height={620} /><span>{mediaSlots["home-school-cooperation"] ? "已发布合作素材" : "真实课堂素材待补充"}</span></div><div className="cooperation-copy"><span className="eyebrow dark">FOR SCHOOLS</span><h2>把一间教室，变成一座小型创作实验室。</h2><p>为学校提供可落地的课程、课堂账号和 AI 工具能力。学生完成当堂任务，学校不需要建立学生个人云端档案。</p><div className="check-list"><span>✓ 课程进校与社团活动</span><span>✓ 每校共享课堂账号</span><span>✓ 课堂成本和并发保护</span></div><Link href="/school-cooperation" className="button button-dark">查看合作方式</Link></div></section>

        <section className="stories-section page-section"><div className="section-heading"><div><span className="eyebrow dark">WHAT IS HAPPENING</span><h2>活动与成长，先展示过程</h2></div><Link href="/achievements" className="text-link">查看学员成长 ↗</Link></div><div className="story-grid"><div className="story-column"><h3>科创活动</h3>{activities.slice(0, 2).map((item) => <Link href={`/activities/${item.slug}`} key={item.id} className="story-card"><span>{item.type || "活动预告"}</span><strong>{item.title}</strong><p>{item.summary}</p></Link>)}</div><div className="story-column"><h3>作品与案例</h3>{achievements.slice(0, 2).map((item) => <Link href={`/achievements/${item.slug}`} key={item.id} className="story-card"><span>{item.type || "作品展示"}</span><strong>{item.title}</strong><p>{item.summary}</p></Link>)}</div></div></section>

        <section className="consult-cta"><div><span className="eyebrow">{consult.eyebrow}</span><h2>{consult.title}</h2><p>{consult.intro}</p></div><Link href="/consult" className="button button-lime">{consult.buttonLabel}</Link></section>
      </main>
    </PublicShell>
  );
}
