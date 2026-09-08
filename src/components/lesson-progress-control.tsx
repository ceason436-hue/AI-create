"use client";

import { useState } from "react";

export function LessonProgressControl({ courseId, lessonId, initialCompleted }: { courseId: string; lessonId: string; initialCompleted: boolean }) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function update() { setBusy(true); setMessage(""); const response = await fetch(`/api/me/courses/${courseId}/lessons/${lessonId}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !completed }) }); const data = await response.json().catch(() => null); setBusy(false); if (!response.ok) { setMessage(data?.error ?? "进度暂时无法保存。"); return; } setCompleted(data.completed); setMessage(data.completed ? `已完成本课 · 课程进度 ${data.progressPercent}%` : `已撤销完成标记 · 课程进度 ${data.progressPercent}%`); }
  return <div className="lesson-progress-control"><button type="button" className={completed ? "button button-outline-dark" : "button button-lime"} disabled={busy} onClick={() => void update()}>{busy ? "保存中…" : completed ? "撤销完成标记" : "标记本课已完成"}</button>{message && <small role="status">{message}</small>}</div>;
}
