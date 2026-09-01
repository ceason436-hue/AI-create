"use client";

import { useEffect, useState } from "react";

type PreviewSession = { contentUrl: string; expiresAt: string; watermark?: string };

export function CoursewareViewer({ assetId, title }: { assetId: string; title: string }) {
  const [session, setSession] = useState<PreviewSession | null>(null);
  const [error, setError] = useState("");

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

  if (error) return <p className="admin-message admin-error">{error}</p>;
  if (!session) return <p className="courseware-loading">正在创建受保护的课件预览…</p>;
  return <div className="courseware-frame"><div className="courseware-watermark" aria-hidden="true">{session.watermark ?? "科瑞特 AI · 受限预览"}</div><iframe src={session.contentUrl} title={title} referrerPolicy="same-origin" /></div>;
}
