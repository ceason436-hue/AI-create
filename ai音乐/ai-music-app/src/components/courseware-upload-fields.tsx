"use client";

import { useEffect, useMemo, useState } from "react";

type Lesson = { id: string; title: string; publishStatus: string };
type Module = { id: string; title: string; lessons: Lesson[] };
type Course = { id: string; name: string; slug: string; modules: Module[] };

export function CoursewareUploadFields({ busy }: { busy: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]); const [courseId, setCourseId] = useState(""); const [error, setError] = useState("");
  const selectedCourse = useMemo(() => courses.find((course) => course.id === courseId), [courseId, courses]);
  const lessons = selectedCourse?.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title }))) ?? [];
  useEffect(() => { void (async () => { const response = await fetch("/api/admin/courses"); const data = await response.json().catch(() => null); if (!response.ok) { setError(data?.error ?? "课程列表加载失败。"); return; } setCourses(data.courses ?? []); })(); }, []);
  return <><label>所属课程<select name="courseId" value={courseId} onChange={(event) => setCourseId(event.target.value)} required disabled={busy}><option value="">选择课程</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name} · {course.slug}</option>)}</select></label><label>关联课时（可选）<select name="lessonId" defaultValue="" disabled={busy || !courseId}><option value="">作为课程级课件</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.moduleTitle} · {lesson.title}（{lesson.publishStatus}）</option>)}</select></label>{error && <p className="admin-form-note">{error}</p>}<label>课件标题（可选）<input name="title" maxLength={180} placeholder="默认使用文件名" /></label><label>文件<input name="file" type="file" required accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,.mov" /></label><p className="admin-form-note">上传后由后台任务生成预览；PPT 与 Word 需要部署 LibreOffice，生成完成前不可发布。服务端会再次校验课时属于所选课程。</p></>;
}
