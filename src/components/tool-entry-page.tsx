import Link from "next/link";
import Image from "next/image";
import { PublicShell } from "@/components/public-shell";

type ToolEntryPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  appHref: string;
  steps: [string, string, string];
};

export function ToolEntryPage({ eyebrow, title, description, image, imageAlt, appHref, steps }: ToolEntryPageProps) {
  return (
    <PublicShell>
      <main className="tool-entry">
        <section className="tool-entry__hero">
          <div className="tool-entry__copy">
            <span className="tool-entry__eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="tool-entry__actions">
              <Link href={appHref} className="tool-entry__primary">开始创作 <span aria-hidden="true">→</span></Link>
              <Link href="/tools" className="tool-entry__secondary">查看全部媒介</Link>
            </div>
          </div>
          <figure className="tool-entry__image">
            <Image src={image} alt={imageAlt} width={1200} height={900} sizes="(max-width: 720px) 100vw, 56vw" />
            <figcaption>从一份草稿开始，留下你的选择与修改。</figcaption>
          </figure>
        </section>
        <section className="tool-entry__method" aria-label="创作步骤">
          {steps.map((step, index) => <div key={step}><span>0{index + 1}</span><p>{step}</p></div>)}
        </section>
      </main>
    </PublicShell>
  );
}
