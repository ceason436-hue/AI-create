import { AccountType, OrganizationStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenText, Braces, Image as ImageIcon, Music2, Sparkles } from "lucide-react";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import styles from "./classroom.module.css";

const classroomTools = {
  reading: {
    title: "AI 阅读",
    description: "分段理解文本，把阅读思考变成一册自己的绘本。",
    href: "/ai-reading",
    Icon: BookOpenText,
  },
  image: {
    title: "AI 绘画",
    description: "用清晰的文字描述，完成一张有想法的视觉作品。",
    href: "/ai-art",
    Icon: ImageIcon,
  },
  code: {
    title: "AI 编程",
    description: "把创意说清楚，和 AI 一起做出能运行的小网页。",
    href: "/ai-programming",
    Icon: Braces,
  },
  music: {
    title: "AI 音乐",
    description: "从节奏、旋律和歌词出发，做一段属于课堂的声音。",
    href: "/ai-music",
    Icon: Music2,
  },
} as const;

type ClassroomToolKey = keyof typeof classroomTools;

function isClassroomToolKey(value: string): value is ClassroomToolKey {
  return value in classroomTools;
}

export default async function ClassroomPage() {
  const account = await getCurrentAccount().catch(() => null);
  if (!account) redirect("/login?mode=school");
  if (account.type === AccountType.PERSONAL) redirect("/learn");
  if (account.type === AccountType.ADMIN) redirect("/admin");

  const classroom = await db.organizationAccount.findUnique({
    where: { accountId: account.id },
    include: { organization: { select: { name: true, status: true } } },
  }).catch(() => null);
  const now = new Date();
  const accessIsActive = Boolean(
    classroom &&
    classroom.organization.status === OrganizationStatus.ACTIVE &&
    (!classroom.validFrom || classroom.validFrom <= now) &&
    (!classroom.validTo || classroom.validTo > now),
  );
  const tools = accessIsActive
    ? [...new Set(classroom!.allowedTools)].filter(isClassroomToolKey).map((key) => ({ key, ...classroomTools[key] }))
    : [];

  return (
    <section className={styles.classroom} aria-label="学校课堂空间">
      <header className={styles.intro}>
        <div>
          <p className={styles.schoolName}>{classroom?.organization.name ?? "学校课堂"}</p>
          <h1>开始今天的课堂创作</h1>
          <p className={styles.description}>选择老师安排的创作工具，完成观察、表达与分享。每一次尝试，都是一次新的发现。</p>
        </div>
        <div className={styles.sessionNote}>
          <Sparkles aria-hidden="true" size={22} />
          <div><strong>本次课堂</strong><span>作品仅保留在当前课堂设备</span></div>
        </div>
      </header>

      {tools.length ? (
        <div className={styles.toolList}>
          {tools.map(({ key, title, description, href, Icon }) => (
            <Link className={styles.tool} href={href} key={key}>
              <span className={styles.icon}><Icon aria-hidden="true" size={25} strokeWidth={1.8} /></span>
              <span className={styles.toolContent}><strong>{title}</strong><span>{description}</span></span>
              <span className={styles.open}>进入工具 <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <BookOpenText aria-hidden="true" size={30} />
          <div><h2>这节课的工具正在准备中</h2><p>请向老师确认今天要使用的课堂工具后再开始。</p></div>
        </div>
      )}

      <aside className={styles.help}>
        <span>课堂小提示</span>
        <p>完成创作后，请在下课前按老师的要求展示、下载或提交你的作品。</p>
      </aside>
    </section>
  );
}
