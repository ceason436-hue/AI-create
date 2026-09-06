"use client";

import { FormEvent, useState } from "react";

export function InquiryForm({ type = "COURSE" }: { type?: "COURSE" | "SCHOOL" }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try { const response = await fetch("/api/public/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, inquiryType: type }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); form.reset(); setStatus("提交成功，我们会尽快与你联系。"); } catch (error) { setStatus(error instanceof Error ? error.message : "提交失败，请稍后重试。"); } finally { setBusy(false); }
  }
  return <form className="inquiry-form" onSubmit={submit}><label>怎么称呼<input name="name" required maxLength={80} autoComplete="name" /></label><label>联系方式<input name="contact" required maxLength={160} placeholder="手机号 / 微信 / 邮箱" autoComplete="tel" /></label>{type === "COURSE" && <><label>孩子的年级<input name="grade" maxLength={80} placeholder="例如：四年级" /></label><label>感兴趣的方向<input name="courseInterest" maxLength={180} placeholder="编程、机器人、AI、无人机……" /></label></>}<label>所在区域<input name="region" maxLength={120} placeholder="城市或校区" autoComplete="address-level2" /></label><label>想进一步了解什么<textarea name="note" maxLength={2000} rows={4} placeholder={type === "COURSE" ? "可以写下学习目标、时间安排或孩子做过的项目" : "可以写下年级、课程场景和希望合作的方向"} /></label><button className="button button-primary" type="submit" disabled={busy}>{busy ? "提交中…" : "提交咨询"}</button>{status && <p role="status" className="form-status">{status}</p>}</form>;
}
