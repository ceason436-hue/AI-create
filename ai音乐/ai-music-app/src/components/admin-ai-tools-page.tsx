"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Tool = { id: string; toolKey: string; name: string; description: string; category: string; routePath: string; sortOrder: number; status: string; visibleToPublic: boolean; allowAnonymousTrial: boolean; dailyTrialLimit: number; coverAssetId: string | null };

export function AdminAiToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => { void fetch("/api/admin/ai-tools").then(async (response) => { const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error ?? "工具目录加载失败。"); setTools(body.tools ?? []); }).catch((reason) => setError(reason instanceof Error ? reason.message : "工具目录加载失败。")); }, []);
  async function save(event: React.FormEvent<HTMLFormElement>, tool: Tool) {
    event.preventDefault(); setSaving(tool.toolKey); setError(""); setNotice("");
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = { name: raw.name, description: raw.description, category: raw.category, sortOrder: Number(raw.sortOrder), status: raw.status, visibleToPublic: raw.visibleToPublic === "on", allowAnonymousTrial: raw.allowAnonymousTrial === "on", dailyTrialLimit: Number(raw.dailyTrialLimit), coverAssetId: raw.coverAssetId || null };
    try { const response = await fetch(`/api/admin/ai-tools/${tool.toolKey}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error ?? "保存失败。"); setTools((items) => items.map((item) => item.toolKey === tool.toolKey ? body.tool : item)); setNotice(`${tool.name} 已更新；全局停用会在网关调用供应商前生效。`); } catch (reason) { setError(reason instanceof Error ? reason.message : "保存失败。"); } finally { setSaving(null); }
  }
  return <main className="admin-cms"><div className="admin-cms-top"><div><Link href="/admin" className="back-link">← 运营后台</Link><span className="eyebrow dark">AI TOOL CATALOG</span><h1>AI 工具目录与全局开关</h1><p>这里只能维护已在服务端白名单中实现的工具；不能创建任意供应商能力或路由。</p></div></div>{error && <p className="admin-message admin-error">{error}</p>}{notice && <p className="admin-message admin-success">{notice}</p>}<section className="admin-cms-list">{tools.map((tool) => <form key={tool.id} className="admin-cms-form" onSubmit={(event) => void save(event, tool)}><div className="admin-cms-top"><div><span className="eyebrow dark">{tool.toolKey}</span><h2>{tool.name}</h2><p>稳定路由：{tool.routePath}</p></div><span>{tool.status}</span></div><label>名称<input name="name" defaultValue={tool.name} required maxLength={120} /></label><label>说明<textarea name="description" defaultValue={tool.description} required maxLength={500} /></label><div className="admin-form-grid"><label>分类<input name="category" defaultValue={tool.category} required maxLength={64} /></label><label>排序<input name="sortOrder" type="number" min="0" max="9999" defaultValue={tool.sortOrder} /></label><label>全局状态<select name="status" defaultValue={tool.status}><option value="ACTIVE">启用</option><option value="INACTIVE">暂停</option></select></label><label>每日访客试用次数<input name="dailyTrialLimit" type="number" min="0" max="20" defaultValue={tool.dailyTrialLimit} /></label></div><label>封面媒体 ID（可选）<input name="coverAssetId" defaultValue={tool.coverAssetId ?? ""} /></label><div className="admin-checkbox-row"><label><input name="visibleToPublic" type="checkbox" defaultChecked={tool.visibleToPublic} /> 在公开创作空间展示</label><label><input name="allowAnonymousTrial" type="checkbox" defaultChecked={tool.allowAnonymousTrial} /> 允许匿名访客试用</label></div><button className="button button-lime" disabled={saving === tool.toolKey}>{saving === tool.toolKey ? "保存中…" : "保存工具配置"}</button></form>)}{!tools.length && !error && <p className="admin-empty">正在加载工具目录…</p>}</section></main>;
}
