"use client";

import { useEffect, useRef, useState } from "react";
import { boundedCoursewarePage, coursewarePreviewUrl } from "@/lib/courseware-viewer-policy";

type PreviewSession = { contentUrl: string; expiresAt: string; watermark?: string };

export function CoursewareViewer({ assetId, title, pageCount, aspectRatio }: { assetId: string; title: string; pageCount?: number | null; aspectRatio?: string | null }) {
  const [session, setSession] = useState<PreviewSession | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const frameRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(1, pageCount ?? 1);

  useEffect(() => {
    let active = true;
    async function createPreviewSession() {
      try {
        const response = await fetch(`/api/me/courseware/${assetId}/preview-session`, { method: "POST", cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? "课件预览暂时不可用。");
        if (active) setSession(data);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "课件预览暂时不可用。");
      }
    }
    void createPreviewSession();
    return () => { active = false; };
  }, [assetId]);

  useEffect(() => { setPage((current) => boundedCoursewarePage(current, totalPages)); }, [totalPages]);

  async function enterFullscreen() { await frameRef.current?.requestFullscreen?.().catch(() => undefined); }

  if (error) return <p className="admin-message admin-error">{error}</p>;
  if (!session) return <p className="courseware-loading">正在创建受保护的课件预览…</p>;
  const previewUrl = coursewarePreviewUrl(session.contentUrl, page, totalPages);
  return <div className="courseware-preview-shell"><div className="courseware-preview-toolbar"><div><strong>在线预览</strong><small>{totalPages > 1 ? `第 ${page} / ${totalPages} 页` : aspectRatio ? `原始比例 ${aspectRatio}` : "单页资料"}</small></div><div className="courseware-toolbar-actions">{totalPages > 1 && <><button type="button" onClick={() => setPage((current) => boundedCoursewarePage(current - 1, totalPages))} disabled={page <= 1}>上一页</button><button type="button" onClick={() => setPage((current) => boundedCoursewarePage(current + 1, totalPages))} disabled={page >= totalPages}>下一页</button></>}<button type="button" onClick={() => void enterFullscreen()}>全屏展示</button></div></div><div className="courseware-preview-layout">{totalPages > 1 && <nav className="courseware-page-thumbnails" aria-label="课件页码缩略导航">{Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => <button type="button" key={item} className={item === page ? "active" : ""} onClick={() => setPage(item)} aria-label={`查看第 ${item} 页`}>第 {item} 页</button>)}</nav>}<div className="courseware-frame" ref={frameRef}><div className="courseware-watermark" aria-hidden="true">{session.watermark ?? "科瑞特 AI · 受限预览"}</div><iframe src={previewUrl} title={title} referrerPolicy="same-origin" /></div></div></div>;
}
