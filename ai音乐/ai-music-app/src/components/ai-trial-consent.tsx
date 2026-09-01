"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AiTrialConsent() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/ai/trial").then((response) => response.ok ? response.json() : null).then((data) => {
      if (active && data && !data.authenticated && !data.consent) setVisible(true);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  if (!visible) return null;
  async function accept() {
    setBusy(true);
    try {
      const response = await fetch("/api/ai/trial", { method: "POST" });
      if (response.ok) setVisible(false);
    } finally {
      setBusy(false);
    }
  }
  return <div className="trial-consent" role="dialog" aria-label="AI 试用提示"><div className="trial-consent-card"><span className="eyebrow dark">TRY BEFORE YOU JOIN</span><h2>先登录，或直接试用 AI</h2><p>登录后可以保存作品并按账户权益使用；访客也可以选择先试用，每个 AI 业务工具每天 5 次，匿名结果不会保存到云端。</p><div className="trial-consent-actions"><Link className="button button-dark" href="/login">学员登录</Link><button className="button button-lime" onClick={() => void accept()} disabled={busy}>{busy ? "准备中…" : "先试用"}</button></div></div></div>;
}
