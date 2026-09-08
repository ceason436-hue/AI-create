/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { BookOpen, ChevronLeft, ImagePlus, LoaderCircle, Plus, Save, Sparkles, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import s from "./admin-reading-lessons-page.module.css";
import type { ReadingAnalysis } from "@/lib/reading-analysis";

type Lesson = { id: string; title: string; article: string; teacherGuide: string; coverImage: string; grade: number; semester: "FIRST" | "SECOND"; publisher: string; summary: string; analysis?: ReadingAnalysis; publishStatus: "DRAFT" | "PUBLISHED"; sortOrder: number };
const empty = (): Omit<Lesson, "id"> => ({ title: "", article: "", teacherGuide: "", coverImage: "", grade: 1, semester: "FIRST", publisher: "统编版", summary: "", publishStatus: "DRAFT", sortOrder: 0 });

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init), data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "操作失败，请稍后重试。");
  return data;
}

export function AdminReadingLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]), [draft, setDraft] = useState<Omit<Lesson, "id"> & { id?: string }>(empty()), [busy, setBusy] = useState(""), [message, setMessage] = useState(""), [error, setError] = useState("");
  const articleFile = useRef<HTMLInputElement>(null), guideFile = useRef<HTMLInputElement>(null), coverFile = useRef<HTMLInputElement>(null);
  async function load() { const data = await jsonRequest("/api/admin/reading-lessons"); setLessons(data.lessons ?? []); }
  useEffect(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : "课文库加载失败。")); }, []);
  function edit(lesson: Lesson) { setDraft({ ...lesson }); setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function extract(file: File | undefined, target: "article" | "teacherGuide") {
    if (!file) return;
    setBusy(target); setError("");
    try { const form = new FormData(); form.set("file", file); const response = await fetch("/api/ai/reading/extract", { method: "POST", body: form }); const data = await response.json(); if (!response.ok || typeof data.text !== "string") throw new Error(data.error || "文件识别失败。"); setDraft((value) => ({ ...value, [target]: data.text.slice(0, target === "article" ? 50_000 : 10_000), ...(target === "article" && !value.title ? { title: file.name.replace(/\.[^.]+$/, "") } : {}) })); setMessage(target === "article" ? "课文原文已识别。" : "教师教案已识别。"); } catch (reason) { setError(reason instanceof Error ? reason.message : "文件识别失败。"); } finally { setBusy(""); }
  }
  async function uploadCover(file?: File) {
    if (!file) return; setBusy("cover"); setError("");
    try { const form = new FormData(); form.set("file", file); form.set("title", `${draft.title || "课文"}课程封面`); form.set("altText", `${draft.title || "课文"}课程封面`); const response = await fetch("/api/admin/media", { method: "POST", body: form }); const data = await response.json(); if (!response.ok || !data.asset?.id) throw new Error(data.error || "封面上传失败。"); setDraft((value) => ({ ...value, coverImage: `/api/media/${data.asset.id}` })); setMessage("课程封面已上传。"); } catch (reason) { setError(reason instanceof Error ? reason.message : "封面上传失败。"); } finally { setBusy(""); }
  }
  async function generateCover() {
    if (!draft.title) return setError("请先填写课文名称。"); setBusy("cover"); setError("");
    try { const data = await jsonRequest("/api/admin/reading-lessons/cover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: draft.title, summary: draft.summary, article: draft.article.slice(0, 4_000) }) }); setDraft((value) => ({ ...value, coverImage: data.coverImage })); setMessage("AI 课程封面已生成并保存到媒体库。"); } catch (reason) { setError(reason instanceof Error ? reason.message : "封面生成失败。"); } finally { setBusy(""); }
  }
  async function analyze() {
    if (!draft.title || draft.article.trim().length < 20) return setError("请先填写课文名称和至少 20 字的原文。"); setBusy("analysis"); setError("");
    try { const data = await jsonRequest("/api/admin/reading-lessons/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: draft.title, article: draft.article, teacherGuide: draft.teacherGuide || undefined }) }); setDraft((value) => ({ ...value, analysis: data.analysis, summary: value.summary || data.analysis.summary })); setMessage(`AI 已按单幅画面标准拆分为 ${data.analysis.segments.length} 段。`); } catch (reason) { setError(reason instanceof Error ? reason.message : "AI 拆分失败。"); } finally { setBusy(""); }
  }
  async function save() {
    if (!draft.analysis?.segments.length) return setError("请先使用 AI 拆分课文，再保存发布。"); setBusy("save"); setError("");
    try { const { id, publishStatus, sortOrder, ...payload } = draft; await jsonRequest(id ? `/api/admin/reading-lessons/${id}` : "/api/admin/reading-lessons", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload, publishStatus, sortOrder }) }); setMessage(publishStatus === "PUBLISHED" ? "课文已发布，学生端书架现在可以看到。" : "课文草稿已保存。"); setDraft(empty()); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "保存失败。"); } finally { setBusy(""); }
  }
  async function archive(id: string) { if (!window.confirm("确认从课文库归档这篇课文？")) return; setBusy("archive"); try { await jsonRequest(`/api/admin/reading-lessons/${id}`, { method: "DELETE" }); if (draft.id === id) setDraft(empty()); await load(); setMessage("课文已归档。"); } catch (reason) { setError(reason instanceof Error ? reason.message : "归档失败。"); } finally { setBusy(""); } }
  return <main className={s.page}>
    <header><div><Link href="/admin/resources"><ChevronLeft />返回内容与学习</Link><h1><BookOpen />AI 阅读课文库</h1><p>上传课本原文与教学要求，完成场景拆分和课程封面后再发布给学生。</p></div><button onClick={() => setDraft(empty())}><Plus />新建课文</button></header>
    {(error || message) && <p className={error ? s.error : s.success}>{error || message}</p>}
    <div className={s.workspace}>
      <section className={s.editor}>
        <div className={s.editorHead}><h2>{draft.id ? "编辑课文" : "创建预制课文"}</h2><span>{draft.analysis ? `${draft.analysis.segments.length} 个绘本场景` : "尚未拆分"}</span></div>
        <div className={s.meta}><label>课文名称<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="例如：植物妈妈有办法" /></label><label>年级<select value={draft.grade} onChange={(e) => setDraft({ ...draft, grade: Number(e.target.value) })}>{[1,2,3,4,5,6].map((n) => <option value={n} key={n}>{n} 年级</option>)}</select></label><label>学期<select value={draft.semester} onChange={(e) => setDraft({ ...draft, semester: e.target.value as "FIRST" | "SECOND" })}><option value="FIRST">上学期</option><option value="SECOND">下学期</option></select></label><label>教材版本<input value={draft.publisher} onChange={(e) => setDraft({ ...draft, publisher: e.target.value })} /></label></div>
        <label className={s.full}>课程摘要<textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="用于学生端课程介绍，可在 AI 拆分后自动生成。" /></label>
        <div className={s.coverRow}><div className={s.cover}>{draft.coverImage ? <img src={draft.coverImage} alt="课程封面预览" /> : <ImagePlus />} </div><div><h3>课程封面</h3><p>支持上传图片，也可以根据课文内容生成绘本风格封面。</p><button onClick={() => coverFile.current?.click()} disabled={!!busy}><Upload />上传封面</button><button onClick={() => void generateCover()} disabled={!!busy}><Sparkles />{busy === "cover" ? "正在生成…" : "AI 生成封面"}</button><input ref={coverFile} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void uploadCover(e.target.files?.[0])} /></div></div>
        <div className={s.textHead}><div><h3>课文原文</h3><p>AI 会依照“同一幅画面可完整展示”的标准动态拆分，不固定段数。</p></div><button onClick={() => articleFile.current?.click()} disabled={!!busy}><Upload />上传课本文件</button><input ref={articleFile} hidden type="file" accept=".txt,.md,.docx" onChange={(e) => void extract(e.target.files?.[0], "article")} /></div>
        <textarea className={s.article} value={draft.article} onChange={(e) => setDraft({ ...draft, article: e.target.value, analysis: undefined })} placeholder="粘贴课文原文，或上传 TXT / MD / DOCX 文件…" />
        <details><summary>教师教案与理解要求（可选）</summary><button onClick={() => guideFile.current?.click()} disabled={!!busy}><Upload />上传教师教案</button><input ref={guideFile} hidden type="file" accept=".txt,.md,.docx" onChange={(e) => void extract(e.target.files?.[0], "teacherGuide")} /><textarea value={draft.teacherGuide} onChange={(e) => setDraft({ ...draft, teacherGuide: e.target.value })} placeholder="教师教案、阅读理解要求、需要关注的关键词…" /></details>
        <div className={s.actions}><button className={s.analyze} onClick={() => void analyze()} disabled={!!busy}>{busy === "analysis" ? <LoaderCircle className={s.spin} /> : <Sparkles />}AI 智能拆分</button><label>发布状态<select value={draft.publishStatus} onChange={(e) => setDraft({ ...draft, publishStatus: e.target.value as "DRAFT" | "PUBLISHED" })}><option value="DRAFT">保存为草稿</option><option value="PUBLISHED">发布到学生端</option></select></label><button className={s.save} onClick={() => void save()} disabled={!!busy}><Save />{busy === "save" ? "正在保存…" : "保存课文"}</button></div>
      </section>
      <aside><div className={s.libraryHead}><h2>课文库</h2><span>{lessons.length} 篇</span></div>{lessons.length ? lessons.map((lesson) => <article key={lesson.id} onClick={() => edit(lesson)} className={draft.id === lesson.id ? s.selected : ""}>{lesson.coverImage ? <img src={lesson.coverImage} alt="" /> : <BookOpen />}<div><strong>{lesson.title}</strong><p>{lesson.grade} 年级 · {lesson.semester === "FIRST" ? "上学期" : "下学期"} · {lesson.publisher}</p><span className={lesson.publishStatus === "PUBLISHED" ? s.published : ""}>{lesson.publishStatus === "PUBLISHED" ? "已发布" : "草稿"} · {lesson.analysis?.segments.length ?? 0} 段</span></div><button aria-label={`归档${lesson.title}`} onClick={(e) => { e.stopPropagation(); void archive(lesson.id); }}><Trash2 /></button></article>) : <div className={s.empty}><BookOpen /><strong>还没有课文</strong><p>创建第一篇课文后会显示在这里。</p></div>}</aside>
    </div>
  </main>;
}
