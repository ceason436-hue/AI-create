"use client";

import { FormEvent, useState } from "react";

export function InquiryForm({ type = "COURSE" }: { type?: "COURSE" | "SCHOOL" }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try { const response = await fetch("/api/public/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, inquiryType: type }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); form.reset(); setStatus("已收到你的信息，我们会在确认联系方式后联系你。"); } catch (error) { setStatus(error instanceof Error ? error.message : "提交失败，请稍后重试。"); } finally { setBusy(false); }
  }
  return <form className="inquiry-form" onSubmit={submit}><label>怎么称呼<input name="name" required maxLength={80} /></label><label>联系方式<input name="contact" required maxLength={160} placeholder="手机号 / 微信 / 邮箱" /></label>{type === "COURSE" && <><label>学员年级<input name="grade" maxLength={80} placeholder="例如：四年级" /></label><label>意向课程<input name="courseInterest" maxLength={180} placeholder="可以先写感兴趣的方向" /></label></>}<label>所在区域<input name="region" maxLength={120} placeholder="城市或校区" /></label><label>补充说明<textarea name="note" maxLength={2000} rows={4} /></label><button className="button button-lime" type="submit" disabled={busy}>{busy ? "提交中…" : "提交咨询"}</button>{status && <p role="status" className="form-status">{status}</p>}</form>;
}
