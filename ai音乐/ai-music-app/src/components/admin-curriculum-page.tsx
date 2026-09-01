"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Course = { id: string; name: string; slug: string };
type Lesson = { id: string; title: string; publishStatus: string };
type Module = { id: string; title: string; publishStatus: string; lessons: Lesson[] };
type Binding = { id: string; toolKey: string; status: string; accessMode: string; lesson?: { title: string } | null };
type Curriculum = { id: string; name: string; modules: Module[]; toolBindings: Binding[] };

export function AdminCurriculumPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lessons = useMemo(() => curriculum?.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title }))) ?? [], [curriculum]);

  async function loadCourses() {
    const response = await fetch("/api/admin/courses"); const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? "课程列表加载失败。");
    const next = (data.courses ?? []) as Course[]; setCourses(next); if (!courseId && next[0]) setCourseId(next[0].id);
  }
  async function loadCurriculum(id = courseId) {
    if (!id) return;
    const response = await fetch(`/api/admin/courses/${id}/curriculum`); const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? "课程结构加载失败。");
    setCurriculum(data.course);
  }
  useEffect(() => { void loadCourses().catch((reason) => setError(reason instanceof Error ? reason.message : "加载失败。")); }, []);
  useEffect(() => { void loadCurriculum().catch((reason) => setError(reason instanceof Error ? reason.message : "加载失败。")); }, [courseId]);
  async function create(event: FormEvent<HTMLFormElement>, kind: "MODULE" | "LESSON" | "TOOL_BINDING") {
    event.preventDefault(); if (!courseId) return; setBusy(true); setMessage(""); setError("");
    const form = event.currentTarget; const raw = Object.fromEntries(new FormData(form).entries());
    const payload = kind === "MODULE" ? { kind, title: raw.title, description: raw.description || undefined, publishStatus: raw.publishStatus } : kind === "LESSON" ? { kind, moduleId: raw.moduleId, title: raw.title, summary: raw.summary || undefined, content: raw.content || undefined, estimatedMinutes: Number(raw.estimatedMinutes || 45), publishStatus: raw.publishStatus } : { kind, lessonId: raw.lessonId || undefined, toolKey: raw.toolKey, accessMode: raw.accessMode };
    try { const response = await fetch(`/api/admin/courses/${courseId}/curriculum`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.error ?? "保存失败。"); form.reset(); setMessage("已保存到课程结构，公开端只读取已发布内容。"); await loadCurriculum(); } catch (reason) { setError(reason instanceof Error ? reason.message : "保存失败。"); } finally { setBusy(false); }
  }
  return <main className="admin-cms"><div className="admin-cms-top"><div><Link className="back-link" href="/admin">← 运营后台</Link><span className="eyebrow dark">CURRICULUM OPERATIONS</span><h1>课程结构与工具绑定</h1><p>在这里维护模块、课时与课程任务可调用的 AI 工具。工具绑定会由网关实时校验报名与课时权限。</p></div><Link href="/admin/courses" className="button button-outline-dark">课程基础信息</Link></div>{error && <p className="admin-message admin-error">{error}</p>}{message && <p className="admin-message admin-success">{message}</p>}<section className="admin-curriculum-picker"><label>选择课程<select value={courseId} onChange={(event) => setCourseId(event.target.value)}><option value="">选择课程</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name} · {course.slug}</option>)}</select></label></section>{courseId && <section className="admin-curriculum-layout"><div className="admin-curriculum-forms"><form className="admin-cms-form" onSubmit={(event) => void create(event, "MODULE")}><h2>新增模块</h2><label>模块标题<input name="title" required maxLength={180} /></label><label>模块说明<textarea name="description" maxLength={500} /></label><label>发布状态<select name="publishStatus" defaultValue="DRAFT"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option></select></label><button className="button button-lime" disabled={busy}>添加模块</button></form><form className="admin-cms-form" onSubmit={(event) => void create(event, "LESSON")}><h2>新增课时</h2><label>所属模块<select name="moduleId" required><option value="">选择模块</option>{curriculum?.modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</select></label><label>课时标题<input name="title" required maxLength={180} /></label><label>课时摘要<textarea name="summary" maxLength={500} /></label><label>任务/正文<textarea name="content" maxLength={20000} /></label><label>预计分钟<input name="estimatedMinutes" type="number" min="1" max="480" defaultValue="45" /></label><label>发布状态<select name="publishStatus" defaultValue="DRAFT"><option>DRAFT</option><option>REVIEW</option><option>PUBLISHED</option></select></label><button className="button button-lime" disabled={busy}>添加课时</button></form><form className="admin-cms-form" onSubmit={(event) => void create(event, "TOOL_BINDING")}><h2>绑定本课 AI 工具</h2><label>关联课时<select name="lessonId"><option value="">整个课程可用</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.moduleTitle} · {lesson.title}</option>)}</select></label><label>工具<select name="toolKey" defaultValue="image"><option value="image">AI 绘画</option><option value="code">AI 编程</option><option value="music">AI 音乐</option><option value="vision">AI 阅读/视觉</option><option value="chat">文本对话</option><option value="music_query">音乐查询</option></select></label><label>使用方式<select name="accessMode" defaultValue="TASK"><option value="TASK">课时任务</option><option value="COURSE">课程通用</option></select></label><button className="button button-lime" disabled={busy}>保存工具绑定</button></form></div><div className="admin-curriculum-summary"><h2>{curriculum?.name ?? "课程结构"}</h2>{curriculum?.modules.map((module) => <article className="curriculum-module" key={module.id}><span>{module.publishStatus}</span><strong>{module.title}</strong>{module.lessons.map((lesson) => <p key={lesson.id}>{lesson.publishStatus} · {lesson.title}</p>)}</article>)}{!curriculum?.modules.length && <p className="admin-empty">还没有模块。</p>}<h2>工具绑定</h2>{curriculum?.toolBindings.map((binding) => <article className="curriculum-module" key={binding.id}><span>{binding.status}</span><strong>{binding.toolKey}</strong><p>{binding.lesson?.title ?? "全课程"} · {binding.accessMode}</p></article>)}{!curriculum?.toolBindings.length && <p className="admin-empty">还没有工具绑定。</p>}</div></section>}</main>;
}
