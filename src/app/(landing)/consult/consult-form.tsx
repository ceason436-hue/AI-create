"use client";

import { FormEvent, useState } from "react";
import styles from "./consult-replica.module.css";

export function CourseConsultForm() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setStatus(null);
    try {
      const interest = String(data.get("interest") || "");
      const goal = String(data.get("goal") || "");
      const scene = String(data.get("scene") || "");
      const note = String(data.get("note") || "").trim();
      const response = await fetch("/api/public/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType: "COURSE",
          name: String(data.get("name") || "").trim(),
          contact: String(data.get("contact") || "").trim(),
          grade: String(data.get("grade") || "").trim(),
          courseInterest: [interest, goal, scene].filter(Boolean).join("｜"),
          region: String(data.get("region") || "").trim(),
          note: note || undefined,
        }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || "提交失败，请稍后重试。");
      form.reset();
      setStatus({ kind: "success", message: "咨询信息已收到。我们会根据你留下的联系方式，和你一起确认合适的学习起点。" });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "提交失败，请稍后重试。" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} aria-busy={busy}>
      <div className={styles.formGrid}>
        <label className={styles.field}>怎么称呼 <span className={styles.required} aria-hidden="true">*</span><input name="name" autoComplete="name" maxLength={80} required disabled={busy} /></label>
        <label className={styles.field}>联系方式 <span className={styles.required} aria-hidden="true">*</span><input name="contact" autoComplete="tel" maxLength={160} placeholder="手机号 / 微信 / 邮箱" required disabled={busy} /></label>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.field}>孩子所在年级<select name="grade" defaultValue="" disabled={busy}><option value="">请选择</option><option>幼儿园大班</option><option>小学 1–3 年级</option><option>小学 4–5 年级</option><option>小学 6 年级</option><option>初中 7 年级及以上</option></select></label>
        <label className={styles.field}>所在区域<input name="region" autoComplete="address-level2" maxLength={120} placeholder="城市或所在区域" disabled={busy} /></label>
      </div>
      <label className={styles.field}>目前更感兴趣的方向<select name="interest" defaultValue="" disabled={busy}><option value="">还不确定，想先了解</option><option>编程</option><option>3D 建模</option><option>AI 智能</option><option>无人机</option><option>机器人</option><option>综合科创</option></select></label>
      <div className={styles.formGrid}>
        <label className={styles.field}>这次更想解决什么<select name="goal" defaultValue="" disabled={busy}><option value="">请选择</option><option>先体验，发现兴趣</option><option>建立长期学习路径</option><option>完成主题科创项目</option><option>准备竞赛或成果展示</option></select></label>
        <label className={styles.field}>更合适的学习场景<select name="scene" defaultValue="" disabled={busy}><option value="">暂未确定</option><option>线下校区</option><option>学校课程 / 社团</option><option>希望先电话沟通</option></select></label>
      </div>
      <label className={styles.field}>还有什么想告诉我们<textarea name="note" rows={4} maxLength={2000} placeholder="例如：已有学习经历、方便联系的时间" disabled={busy} /></label>
      <p className={styles.privacy}>提交即表示你同意我们仅为本次课程咨询使用以上信息。</p>
      <button className={styles.submit} type="submit" disabled={busy}>{busy ? "正在提交…" : "提交课程咨询"}</button>
      {status && <p role={status.kind === "error" ? "alert" : "status"} className={status.kind === "error" ? styles.error : styles.status}>{status.message}</p>}
    </form>
  );
}
