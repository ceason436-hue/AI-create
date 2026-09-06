import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { getPublicActivities } from "@/lib/public-content";
import { findCompetitionReference } from "../competition-data";

export const dynamic = "force-dynamic";

export default async function ActivityDetailPage({ params }: { params: Promise<{ activitySlug: string }> }) {
  const { activitySlug } = await params;
  const competition = findCompetitionReference(activitySlug);
  const item = competition ? null : (await getPublicActivities()).find((entry) => entry.slug === activitySlug);
  if (!competition && (!item || ["activity-open-lab", "activity-project-day"].includes(item.id))) notFound();

  const title = competition?.name || item!.title;
  const summary = competition?.focus || item!.summary;
  const cover = item?.coverAssetId || "/media/krt/activity-workshop.png";
  const isFallbackVisual = !item?.coverAssetId;

  return (
    <PublicShell>
      <main className="min-h-dvh bg-[#F8FAFD] text-[#24324D] selection:bg-[#F05A24]/20">
        <article>
          <header className="mx-auto max-w-[1120px] px-5 pb-14 pt-12 sm:px-8 lg:pb-20 lg:pt-20">
            <Link href="/activities" className="text-sm font-bold text-[#1D2F82] underline decoration-[#D9E0EE] underline-offset-4 hover:decoration-[#F05A24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2545A8]">
              返回科创活动
            </Link>
            <div className="mt-12 grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <p className="text-sm font-bold tracking-[0.12em] text-[#F05A24]">{competition ? "赛事资料" : item!.type || "活动记录"}</p>
              <div>
                <h1 className="text-balance text-[clamp(2.5rem,4.6vw,3.5rem)] font-black leading-[1.08] tracking-[-0.04em] text-[#172569]">{title}</h1>
                <p className="mt-6 max-w-[65ch] text-lg leading-8 text-[#62708B]">{summary}</p>
              </div>
            </div>
          </header>

          <figure className="mx-auto max-w-[1280px]">
            <div className="relative aspect-[16/7] overflow-hidden bg-[#E9EEF8]">
              {item?.coverMimeType?.startsWith("video/") ? (
                <video src={cover} controls playsInline preload="metadata" className="h-full w-full object-cover" aria-label={`${title}视频`} />
              ) : (
                <Image src={cover} alt={isFallbackVisual ? "科创活动项目制作概念纪实场景" : title} fill priority sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
              )}
            </div>
            {isFallbackVisual && <figcaption className="mt-3 px-5 text-xs leading-5 text-[#62708B] sm:px-8">概念纪实场景，不指向具体赛事现场。</figcaption>}
          </figure>

          {competition ? (
            <div className="mx-auto grid max-w-[1120px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 lg:py-24">
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <h2 className="text-3xl font-black tracking-[-0.03em] text-[#172569]">先读懂赛事，再决定怎么准备。</h2>
                <p className="mt-5 leading-7 text-[#62708B]">报名不是项目的起点。选题、研究、制作与修改，应该在看见赛事之前就已经发生。</p>
              </aside>
              <div>
                <dl className="border-t border-[#D9E0EE]">
                  {[
                    ["常见时段", competition.season],
                    ["适合对象", competition.audience],
                    ["手册所列主办方", competition.organizer],
                    ["手册是否标注进入综评", competition.shortlist],
                    ["材料准备", competition.preparation],
                  ].map(([label, value]) => (
                    <div key={label} className="grid gap-3 border-b border-[#D9E0EE] py-6 sm:grid-cols-[180px_1fr]">
                      <dt className="text-sm font-bold text-[#1D2F82]">{label}</dt>
                      <dd className="leading-7 text-[#52617A]">{value}</dd>
                    </div>
                  ))}
                </dl>
                <section className="mt-12 bg-[#F3F6FB] p-7 sm:p-9">
                  <h2 className="text-2xl font-black text-[#172569]">资料来源与使用说明</h2>
                  <p className="mt-4 leading-7 text-[#62708B]">赛事信息整理自《AI科瑞特手册》第{competition.sourcePage}页。手册记录用于帮助理解赛事方向，不代表本年度正在报名，也不表示参与即可获奖或获得升学结果。</p>
                  <p className="mt-3 leading-7 text-[#62708B]">赛事规则、年龄组别、时间、赛项、主办单位与申报材料可能调整，请以赛事当年正式通知为准。</p>
                </section>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-[900px] px-5 py-16 sm:px-8 lg:py-24">
              <div className="max-w-[72ch] text-lg leading-8 text-[#52617A]">
                <p>{item!.content}</p>
                {item!.date && <p className="mt-6 text-sm font-bold text-[#1D2F82]">活动时间：{new Date(item!.date).toLocaleDateString("zh-CN")}</p>}
              </div>
              {item!.media?.length ? (
                <div className="mt-12 grid gap-5 sm:grid-cols-2">
                  {item!.media.map((media, index) => (
                    <figure key={`${media.src}-${index}`} className="overflow-hidden rounded-[8px] bg-white shadow-[0_16px_40px_rgba(23,37,105,0.1)]">
                      {media.mimeType?.startsWith("video/") ? <video src={media.src} controls playsInline preload="metadata" className="aspect-[4/3] w-full object-cover" aria-label={`${title}素材 ${index + 1}`}>{media.captionsSrc && <track kind="captions" src={media.captionsSrc} srcLang={media.captionLanguage || "zh-CN"} label="字幕" default />}</video> : <Image src={media.src} alt={media.caption || `${title}活动记录 ${index + 1}`} width={900} height={675} className="aspect-[4/3] w-full object-cover" />}
                      {media.caption && <figcaption className="px-4 py-3 text-sm leading-6 text-[#62708B]">{media.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </article>
      </main>
    </PublicShell>
  );
}
