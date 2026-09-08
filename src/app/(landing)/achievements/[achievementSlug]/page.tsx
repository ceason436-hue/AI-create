import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { getPublicAchievements } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export default async function AchievementDetailPage({ params }: { params: Promise<{ achievementSlug: string }> }) {
  const { achievementSlug } = await params;
  const item = (await getPublicAchievements()).find((entry) => entry.slug === achievementSlug);
  if (!item || ["handbook-awards", "handbook-robotics", "achievement-project-wall", "achievement-school-lab"].includes(item.id)) notFound();

  const cover = item.coverAssetId || "/media/krt/growth-showcase.png";
  const isFallbackVisual = !item.coverAssetId;

  return (
    <PublicShell>
      <main className="min-h-dvh bg-[#F8FAFD] text-[#24324D] selection:bg-[#F05A24]/20">
        <article>
          <header className="mx-auto max-w-[1120px] px-5 pb-14 pt-12 sm:px-8 lg:pb-20 lg:pt-20">
            <Link href="/achievements" className="text-sm font-bold text-[#1D2F82] underline decoration-[#D9E0EE] underline-offset-4 hover:decoration-[#F05A24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2545A8]">
              返回学员成长
            </Link>
            <div className="mt-12 grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <p className="text-sm font-bold tracking-[0.12em] text-[#F05A24]">{item.type || "成长记录"}</p>
              <div>
                <h1 className="text-balance text-[clamp(2.5rem,4.6vw,3.5rem)] font-black leading-[1.08] tracking-[-0.04em] text-[#172569]">{item.title}</h1>
                <p className="mt-6 max-w-[65ch] text-lg leading-8 text-[#62708B]">{item.summary}</p>
              </div>
            </div>
          </header>

          <figure className="mx-auto max-w-[1280px]">
            <div className="relative aspect-[16/7] overflow-hidden bg-[#E9EEF8]">
              {item.coverMimeType?.startsWith("video/") ? (
                <video src={cover} controls playsInline preload="metadata" className="h-full w-full object-cover" aria-label={`${item.title}视频`} />
              ) : (
                <Image src={cover} alt={isFallbackVisual ? "学生介绍科创作品的概念纪实场景" : item.title} fill priority sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
              )}
            </div>
            {isFallbackVisual && <figcaption className="mt-3 px-5 text-xs leading-5 text-[#62708B] sm:px-8">概念纪实场景，不指向具体学员、作品或获奖现场。</figcaption>}
          </figure>

          <div className="mx-auto grid max-w-[1120px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.68fr_1.32fr] lg:gap-16 lg:py-24">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-3xl font-black tracking-[-0.03em] text-[#172569]">从过程理解这项成果。</h2>
              <p className="mt-5 leading-7 text-[#62708B]">真实成长记录应同时说明问题、制作、修改与表达，不只保留最终结论。</p>
            </aside>
            <div>
              <div className="max-w-[72ch] text-lg leading-8 text-[#52617A]">
                <p>{item.content}</p>
              </div>
              {item.media?.length ? (
                <div className="mt-12 grid gap-5 sm:grid-cols-2">
                  {item.media.map((media, index) => (
                    <figure key={`${media.src}-${index}`} className="overflow-hidden rounded-[8px] bg-white shadow-[0_16px_40px_rgba(23,37,105,0.1)]">
                      {media.mimeType?.startsWith("video/") ? <video src={media.src} controls playsInline preload="metadata" className="aspect-[4/3] w-full object-cover" aria-label={`${item.title}素材 ${index + 1}`}>{media.captionsSrc && <track kind="captions" src={media.captionsSrc} srcLang={media.captionLanguage || "zh-CN"} label="字幕" default />}</video> : <Image src={media.src} alt={media.caption || `${item.title}记录 ${index + 1}`} width={900} height={675} className="aspect-[4/3] w-full object-cover" />}
                      {media.caption && <figcaption className="px-4 py-3 text-sm leading-6 text-[#62708B]">{media.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              ) : null}
              <section className="mt-12 border-y border-[#D9E0EE] py-7">
                <h2 className="text-xl font-black text-[#1D2F82]">信息说明</h2>
                <p className="mt-3 max-w-[68ch] leading-7 text-[#62708B]">成果名称、参与者、时间与外部评价以已公开并获得展示许可的资料为准。课程与活动不承诺获奖、升学或录取结果。</p>
              </section>
            </div>
          </div>
        </article>
      </main>
    </PublicShell>
  );
}
