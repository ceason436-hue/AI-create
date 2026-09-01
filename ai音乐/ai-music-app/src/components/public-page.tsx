import Image from "next/image";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export function PublicPage({ eyebrow, title, intro, children, tone = "light" }: { eyebrow: string; title: string; intro: string; children: React.ReactNode; tone?: "light" | "blue" }) {
  return <PublicShell><main className={`public-page ${tone === "blue" ? "public-page-blue" : ""}`}><section className="page-hero"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></section>{children}</main></PublicShell>;
}

export function PlaceholderImage({ src = "/tu1.jpg", alt = "品牌占位图", className = "" }: { src?: string; alt?: string; className?: string }) {
  return <div className={`placeholder-image ${className}`}><Image src={src} alt={alt} width={1000} height={650} /><span>品牌占位素材 · 待替换</span></div>;
}

export function ContentCards({ items, basePath }: { items: Array<{ id: string; slug: string; title: string; summary: string; type?: string; coverAssetId?: string | null }>; basePath: string }) {
  return <div className="content-card-grid">{items.map((item, index) => <Link href={`${basePath}/${item.slug}`} key={item.id} className="content-card"><div className={`content-card-art art-${(index % 3) + 1}`}>{item.coverAssetId && item.coverAssetId.startsWith("/") ? <Image src={item.coverAssetId} alt="占位图" width={500} height={300} /> : <span>0{index + 1}</span>}</div><div className="content-card-body"><span>{item.type || "内容占位"}</span><h2>{item.title}</h2><p>{item.summary}</p><b>查看详情 →</b></div></Link>)}</div>;
}
