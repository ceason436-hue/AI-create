"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Inquiry = { id: string; inquiryType: string; name: string; contact: string; grade?: string | null; courseInterest?: string | null; region?: string | null; note?: string | null; status: string; createdAt: string };
const statuses = ["ALL", "NEW", "IN_PROGRESS", "RESOLVED", "ARCHIVED"] as const;

export function AdminInquiriesPage() {
  const [status, setStatus] = useState<(typeof statuses)[number]>("ALL");
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load(nextStatus = status) { setError(""); try { const response = await fetch(`/api/admin/inquiries?status=${nextStatus}`, { cache: "no-store" }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error ?? "线索加载失败。"); setItems(data.inquiries ?? []); } catch (reason) { setError(reason instanceof Error ? reason.message : "线索加载失败。"); } }
  useEffect(() => { void load(); }, [status]);
  async function update(id: string, nextStatus: Exclude<(typeof statuses)[number], "ALL">) { setError(""); setMessage(""); try { const response = await fetch(`/api/admin/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error ?? "状态更新失败。"); setMessage("线索状态已更新并写入审计记录。"); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "状态更新失败。"); } }
  return <main className="admin-cms"><div className="admin-cms-top"><div><Link href="/admin" className="back-link">← 运营后台</Link><span className="eyebrow dark">INQUIRY OPERATIONS</span><h1>咨询线索</h1><p>课程咨询与校园合作提交后统一进入这里。联系方式仅在后台受权限保护的页面展示。</p></div><Link href="/consult" className="button button-outline-dark">查看公开咨询页</Link></div>{error && <p className="admin-message admin-error">{error}</p>}{message && <p className="admin-message admin-success">{message}</p>}<div className="admin-inquiry-filters">{statuses.map((item) => <button type="button" className={status === item ? "active" : ""} onClick={() => setStatus(item)} key={item}>{item}</button>)}</div><section className="admin-inquiries">{items.map((item) => <article key={item.id}><span>{item.inquiryType} · {item.status}</span><h2>{item.name}</h2><p>{item.contact}{item.region ? ` · ${item.region}` : ""}</p>{item.grade && <p>年级：{item.grade}</p>}{item.courseInterest && <p>意向：{item.courseInterest}</p>}{item.note && <p className="inquiry-note">{item.note}</p>}<small>{new Date(item.createdAt).toLocaleString("zh-CN")}</small><div className="admin-list-actions"><button type="button" onClick={() => void update(item.id, "IN_PROGRESS")}>跟进中</button><button type="button" onClick={() => void update(item.id, "RESOLVED")}>已处理</button><button type="button" onClick={() => void update(item.id, "ARCHIVED")}>归档</button></div></article>)}{!items.length && <p className="admin-empty">当前筛选下没有咨询线索。</p>}</section></main>;
}
