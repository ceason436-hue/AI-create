import Link from "next/link";
import { AccountType } from "@prisma/client";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { activeEnrollmentWhere } from "@/lib/learning";
import { CoursewareViewer } from "@/components/courseware-viewer";

export default async function CoursewarePage({ params }: { params: Promise<{ assetId: string }> }) { const account = await getCurrentAccount().catch(() => null); const { assetId } = await params; if (!account || account.type !== AccountType.PERSONAL) return <section className="workspace-card"><h1>请先登录</h1><Link href="/login" className="button button-lime">登录</Link></section>; const asset = await db.coursewareAsset.findFirst({ where: { id: assetId, publishStatus: "PUBLISHED", course: { enrollments: { some: activeEnrollmentWhere(account.id) } } }, include: { course: { select: { slug: true, name: true } }, lesson: { select: { title: true } } } }).catch(() => null); if (!asset) return <section className="workspace-card"><h1>课件不可用</h1><p>课件未发布、报名已失效，或当前账号没有访问权限。</p></section>; return <section className="workspace-card courseware-viewer"><Link href={`/learn/courses/${asset.course.slug}`} className="back-link">← {asset.course.name}</Link><span className="eyebrow dark">COURSEWARE · {asset.lesson?.title ?? "课程资料"}</span><h1>{asset.title}</h1><p>这是受保护的在线预览，不提供原文件下载；预览会经过实时鉴权并记录访问审计。</p><CoursewareViewer assetId={asset.id} title={asset.title} /></section>; }
