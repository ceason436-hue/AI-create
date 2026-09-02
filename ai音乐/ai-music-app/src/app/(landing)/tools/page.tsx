import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getPublicAiTools } from "@/lib/ai-tools";
import { AI_TOOL_CATALOG } from "@/lib/ai-tool-catalog";

const fallbackToolKeys = ["music", "image", "code", "vision"] as const;
const fallbackTools = fallbackToolKeys.map((toolKey) => ({ toolKey, ...AI_TOOL_CATALOG[toolKey], coverAssetId: null }));
export default async function ToolsPage() { const items = await getPublicAiTools().catch(() => fallbackTools); return <PublicShell><main className="tools-directory"><section className="page-hero"><span className="eyebrow dark">CREATION SPACE</span><h1>从灵感出发，选择一种表达方式。</h1><p>创作空间与课程入口共用同一套 AI 工具和服务端网关。登录后按账户权益使用，访客每个业务工具每天可试用 5 次。</p></section><section className="tool-directory-grid">{items.map((item, index) => <Link href={item.routePath} key={item.toolKey} className="tool-directory-card" style={{ background: item.color, color: item.color === "#07111f" || item.color === "#005bb3" ? "#fff" : "#07111f" }}><span>0{index + 1}</span><h2>{item.name}</h2><p>{item.description}</p><b>打开工具 →</b></Link>)}</section><section className="music-exercise-link"><div><span className="eyebrow dark">LOCAL INTERACTIVE LAB</span><h2>音乐基础练习</h2><p>浏览器本地互动练习，不调用 AI 额度。</p></div><Link href="/tools/music" className="button button-dark">进入练习目录</Link></section></main></PublicShell>; }
