"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HomePageContent } from "@/lib/public-page-contract";
import type { PublicMediaSlot } from "@/lib/site-media-slot";
import s from "./reference-home.module.css";

type Slide = HomePageContent["carousel"][number];

export function HomeHeroCarousel({ content, heroMedia }: { content: HomePageContent; heroMedia?: PublicMediaSlot }) {
  const slides: Slide[] = content.carousel.map((slide, index) => index === 0 && heroMedia
    ? { ...slide, image: heroMedia.src, alt: heroMedia.altText || slide.alt }
    : slide);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);
  const slide = slides[active] ?? slides[0];
  return <section className={s.hero} aria-labelledby="home-title">
    {slides.map((item, index) => <Image key={`${item.image}-${index}`} src={item.image} width={1536} height={1024} alt={item.alt} className={`${s.heroPhoto} ${index === active ? s.heroPhotoActive : ""}`} priority={index === 0} />)}
    <div className={s.heroCopy}>
      <p className={s.slogan}>{slide.eyebrow ?? content.hero.eyebrow}</p><svg className={s.rule} viewBox="0 0 250 15" aria-hidden="true"><path d="M0 13 8 5H194M8 1h67M200 5h40" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="246" cy="5" r="3" fill="none" stroke="currentColor"/></svg>
      <h1 id="home-title">{slide.titleLine1 ?? content.hero.titleLine1}<br />{slide.titleLine2 ?? content.hero.titleLine2}<span>。</span></h1>
      <div className={s.actions}><Link href={slide.href}>{content.hero.primaryLabel}</Link><Link href="/consult">{content.hero.secondaryLabel}</Link></div>
      <div className={s.benefits}>{[["专业教研团队","10年青少儿编程教育"],["科学课程体系","培养综合能力与思维"],["丰富教学经验","合作学校院所多线"]].map(([title, copy]) => <div key={title}><span><strong>{title}</strong><small>{copy}</small></span></div>)}</div>
    </div>
    {slides.length > 1 && <div className={s.heroDots} aria-label="首页轮播图切换">{slides.map((item, index) => <button type="button" aria-label={`查看第 ${index + 1} 张轮播图：${item.alt}`} aria-current={index === active} className={index === active ? s.heroDotActive : ""} key={`${item.href}-${index}`} onClick={() => setActive(index)} />)}</div>}
  </section>;
}
