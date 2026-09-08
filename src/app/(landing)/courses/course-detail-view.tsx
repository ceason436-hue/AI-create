import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import type { PublicCourse } from "@/lib/public-content";
import type { CourseTrack, PathwayCourse } from "./course-data";
import styles from "./courses.module.css";

type CourseDetailViewProps =
  | { track: CourseTrack; pathway?: never; published?: never }
  | { track?: never; pathway: PathwayCourse; published?: never }
  | { track?: never; pathway?: never; published: PublicCourse };

export function CourseDetailView({ track, pathway, published }: CourseDetailViewProps) {
  const title = track?.name ?? pathway?.name ?? published!.name;
  const eyebrow = track?.english ?? pathway?.grade ?? `${published!.category.name} · ${published!.difficulty}`;
  const intro = track?.intro ?? pathway?.statement ?? published!.shortDescription;
  const image = track?.image ?? (pathway ? "/media/krt/course-innovation.png" : published!.cover?.src);
  const stages = pathway?.stages ?? track?.topics ?? published!.modules.map((module) => module.title);

  return (
    <PublicShell>
      <main className={styles.page}>
        <section className={styles.detailHero}>
          <div className={styles.detailTopline}>
            <Link className={styles.back} href="/courses">← 返回课程体系</Link>
            <span>{eyebrow}</span>
          </div>
          <h1>{title}</h1>
          <p>{intro}</p>
          {image && <div className={styles.detailImage} style={{ backgroundImage: `url(${image})` }} role="img" aria-label={`${title}课程学习场景`} />}
        </section>

        <section className={styles.detailGrid}>
          <div>
            <span className={styles.eyebrow}>学习旅程</span>
            <h2>从理解，到做出自己的答案。</h2>
            <p>
              {pathway
                ? `${pathway.statement} 课程以动手搭建、编程学习、拓展练习和开放设计为基本节奏，在持续探究中完成可以演示、可以说明、也可以继续改进的作品。`
                : track
                  ? `${track.intro} 学习过程强调技术、认知与表达三条线同步成长，孩子不只完成作品，也需要讲清问题、选择与改进。`
                  : published!.fullDescription}
            </p>
            <ol className={styles.stageList}>
              {stages.map((stage) => <li key={stage}>{stage}</li>)}
            </ol>
            {published?.modules.map((module) => (
              <article className={styles.module} key={module.id}>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                {!!module.lessons.length && <ul>{module.lessons.map((lesson) => <li key={lesson.id}>{lesson.title} · {lesson.summary}</li>)}</ul>}
              </article>
            ))}
            {title.includes("C++") && <section className={styles.ojHub} aria-label="线上练习平台">
              <div><span>ONLINE PRACTICE</span><h2>把每一道题，变成看得见的进步。</h2><p>在 OJ Hub 完成在线编程练习、运行测试用例并查看提交记录；课堂学习后可继续自主巩固。</p></div>
              <a href="https://www.ojhub.cn" target="_blank" rel="noreferrer">进入 OJ Hub 在线练习平台 <b>↗</b></a>
            </section>}
          </div>
          <aside className={styles.aside} aria-label="课程信息">
            <dl>
              <div><dt>适合阶段</dt><dd>{pathway?.grade ?? track?.age ?? published!.gradeRange}</dd></div>
              <div><dt>学习节奏</dt><dd>{pathway?.rhythm ?? published?.durationText ?? "项目任务与动手实践结合"}</dd></div>
              <div><dt>代表成果</dt><dd>{pathway?.outcomes.join("、") ?? track?.outcome ?? "以课程安排为准"}</dd></div>
              <div><dt>学习方式</dt><dd>{published?.deliveryModes.length ? published.deliveryModes.join(" / ") : "探究 · 制作 · 改进 · 表达"}</dd></div>
            </dl>
            <Link href="/consult">咨询这门课程</Link>
          </aside>
        </section>
      </main>
    </PublicShell>
  );
}
