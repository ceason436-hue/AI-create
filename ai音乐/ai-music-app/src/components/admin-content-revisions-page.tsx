"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Revision = { id: string; version: number; payload: unknown; createdAt: string };
const contentLabels: Record<string, string> = { activities: "科创活动", achievements: "学员成长", teachers: "师资", campuses: "校区", partners: "合作学校" };

export function AdminContentRevisionsPage({ contentType, itemId }: { contentType: string; itemId: string }) {
  const [revisions, setRevisions] = useState<Revision[]>([]); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState<number | null>(null);
  const label = contentLabels[contentType] ?? "内容";
  async function load() { setError(""); try { const response = await fetch(`/api/admin/content/${contentType}/${itemId}/revisions`); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "加载历史版本失败"); setRevisions(data.revisions ?? []); } catch (cause) { setError(cause instanceof Error ? cause.message : "加载历史版本失败"); } }
  useEffect(() => { void load(); }, [contentType, itemId]);
  async function restore(version: number) { if (!window.confirm(`恢复到版本 ${version} 吗？系统会先保存当前内容为一个新版本。`)) return; setBusy(version); setError(""); setMessage(""); try { const response = await fetch(`/api/admin/content/${contentType}/${itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restoreVersion: version }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "恢复失败"); setMessage(`已恢复版本 ${version}，当前状态已另存为版本 ${data.version}。`); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "恢复失败"); } finally { setBusy(null); } }
  return <main className="admin-cms"><div className="admin-cms-top"><div><Link href={`/admin/content/${contentType}`} className="back-link">← {label}管理</Link><span className="eyebrow dark">VERSION HISTORY</span><h1>{label}历史版本</h1><p>每次新建、编辑、发布状态变更与恢复都会保存快照；恢复不会覆盖当前历史，而是产生一个新的版本。</p></div><Link href={`/admin/content/${contentType}`} className="button button-outline-dark">返回内容管理</Link></div>{error && <p className="admin-message admin-error">{error}</p>}{message && <p className="admin-message admin-success">{message}</p>}<section className="admin-revision-panel"><h2>可恢复版本</h2>{revisions.map((revision) => <article key={revision.id} className="admin-content-revision"><div><strong>版本 {revision.version}</strong><small>{new Date(revision.createdAt).toLocaleString("zh-CN")}</small><pre>{JSON.stringify(revision.payload, null, 2)}</pre></div><button className="button button-lime" type="button" disabled={busy !== null} onClick={() => void restore(revision.version)}>{busy === revision.version ? "恢复中…" : `恢复版本 ${revision.version}`}</button></article>)}{!revisions.length && <p className="admin-empty">暂无历史版本，或当前数据库尚未连接。</p>}</section></main>;
}
