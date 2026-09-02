import Image from "next/image";
import { InquiryForm } from "@/components/inquiry-form";
import { PlaceholderImage, PublicPage } from "@/components/public-page";
import { getPublicPartners } from "@/lib/public-content";
import { getPublishedPageSections } from "@/lib/site-pages";
import { sectionPayload } from "@/lib/site-page-payload";

export const dynamic = "force-dynamic";

export default async function SchoolCooperationPage() {
  const [partners, sections] = await Promise.all([getPublicPartners(), getPublishedPageSections("school-cooperation")]);
  const hero = sectionPayload(sections, "HERO", { eyebrow: "FOR SCHOOLS", title: "让一间教室，变成一座小型创作实验室", intro: "为学校提供可落地的课程、课堂账号和 AI 工具能力，围绕学生当堂完成的作品组织教学。" });
  return <PublicPage eyebrow={hero.eyebrow} title={hero.title} intro={hero.intro} tone="blue"><section className="public-content split-content"><div><PlaceholderImage src="/tu1.jpg" alt="校园合作场景占位图" /><div className="feature-list"><article><b>01</b><h2>课程进校</h2><p>常规课、AI 课程、社团活动和竞赛项目都可以按学校场景组织。</p></article><article><b>02</b><h2>共享课堂账号</h2><p>每校一个短账号，学生不建立个人实名档案，作品当堂在本机处理。</p></article><article><b>03</b><h2>后台成本保护</h2><p>工具范围、并发、频率、异常和紧急暂停由平台服务端控制。</p></article></div>{partners.length > 0 && <section className="partner-logos"><span className="eyebrow dark">PARTNER SCHOOLS</span><h2>已授权展示的合作学校</h2><div>{partners.map((partner) => <article key={partner.id}>{partner.logoUrl && <Image src={partner.logoUrl} alt={`${partner.name} Logo`} width={180} height={100} />}<strong>{partner.name}</strong>{partner.description && <p>{partner.description}</p>}</article>)}</div></section>}</div><div className="form-card"><span className="eyebrow dark">SCHOOL INQUIRY</span><h2>聊聊你的学校场景</h2><p>提交后由运营人员确认合作范围和实施条件。当前不虚构学校名单或合作案例。</p><InquiryForm type="SCHOOL" /></div></section></PublicPage>;
}
