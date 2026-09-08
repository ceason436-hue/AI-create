"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function AiTrialConsent() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    async function onFirstUse() {
      try {
        const response = await fetch("/api/ai/trial", { cache: "no-store" });
        const data = response.ok ? await response.json() : null;
        if (data && !data.authenticated && !data.consent) setVisible(true);
      } catch {
        // The generation request owns its visible error state. Never create an
        // unhandled browser rejection that can interrupt the rest of the tool UI.
      }
    }
    const handleFirstUse = () => { void onFirstUse(); };
    window.addEventListener("krt:ai-first-use", handleFirstUse);
    return () => window.removeEventListener("krt:ai-first-use", handleFirstUse);
  }, []);
  useEffect(() => {
    if (visible && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [visible]);
  if (!visible) return null;
  async function accept() {
    setBusy(true);
    try {
      const response = await fetch("/api/ai/trial", { method: "POST" });
      if (response.ok) { dialogRef.current?.close(); setVisible(false); }
    } finally {
      setBusy(false);
    }
  }
  return <dialog ref={dialogRef} className="site-dialog trial-consent" aria-labelledby="trial-title" onClose={() => setVisible(false)}><div className="dialog-sheet trial-consent-card"><button type="button" className="dialog-close" onClick={() => dialogRef.current?.close()} aria-label="关闭提示"><X aria-hidden="true" size={20} /></button><span className="section-kicker">FIRST CREATION · 第一次创作</span><h2 id="trial-title">先试着完成一个想法</h2><p>你可以直接开始体验。登录后，作品与学习进度可以继续保存和完善。</p><div className="trial-consent-actions"><Link className="button button-secondary" href="/login">登录学习账户</Link><button className="button button-primary" onClick={() => void accept()} disabled={busy}>{busy ? "正在准备…" : "开始体验"}</button></div></div></dialog>;
}
