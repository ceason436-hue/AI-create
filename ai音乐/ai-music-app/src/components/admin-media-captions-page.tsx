"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type CaptionAsset = { id: string; title: string | null; mimeType: string | null; captionObjectKey: string | null; captionLanguage: string | null };

export function AdminMediaCaptionsPage({ assetId }: { assetId: string }) {
  const [asset, setAsset] = useState<CaptionAsset | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/admin/media/${assetId}/captions`;
  async function load() { const response = await fetch(endpoint); const data = await response.json().catch(() => null); if (!response.ok) { setError(data?.error ?? "加载字幕信息失败。"); return; } setAsset(data.asset ?? null); }
  useEffect(() => { void load(); }, [endpoint]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); setMessage(""); const response = await fetch(endpoint, { method: "POST", body: new FormData(event.currentTarget) }); const data = await response.json().catch(() => null); setBusy(false); if (!response.ok) { setError(data?.error ?? "字幕上传失败。"); return; } event.currentTarget.reset(); setMessage("字幕已保存。公开视频播放器会通过受控字幕地址加载。"); await load(); }
  return <main className="admin-cms"><div className="admin-cms-top"><div><Link href="/admin/media" className="back-link">← 媒体库</Link><span className="eyebrow dark">VIDEO CAPTIONS</span><h1>视频字幕</h1><p>仅接受 UTF-8 WebVTT（.vtt）文件。字幕与视频原件分开保存在私有对象中，前台播放器通过受控地址加载。</p></div></div>{error && <p className="admin-message admin-error">{error}</p>}{message && <p className="admin-message admin-success">{message}</p>}<section className="admin-cms-grid"><form className="admin-cms-form" onSubmit={submit}><h2>{asset?.title || "视频媒体"}</h2><label>字幕语言<input name="language" defaultValue={asset?.captionLanguage || "zh-CN"} pattern="[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})?" required /></label><label>WebVTT 字幕文件<input name="file" type="file" accept="text/vtt,.vtt" required /></label><p className="admin-form-note">最大 2MB。上传新版本不会删除旧字幕对象，历史元数据可恢复。</p><button className="button button-lime" disabled={busy || !asset?.mimeType?.startsWith("video/")}>{busy ? "上传中…" : "上传字幕"}</button></form><div className="admin-list"><article><span>{asset?.mimeType || "加载中"}</span><strong>{asset?.captionObjectKey ? "已配置字幕" : "暂未配置字幕"}</strong><small>语言：{asset?.captionLanguage || "—"}</small><small>字幕对象：{asset?.captionObjectKey || "—"}</small></article></div></section></main>;
}
