"use client";

import { useEffect, useState } from "react";

type Account = { id: string; loginIdentifier: string; displayName: string | null; status: string };
type Course = { id: string; name: string; slug: string };

export function EnrollmentFields({ busy }: { busy: boolean }) {
  const [accounts, setAccounts] = useState<Account[]>([]); const [courses, setCourses] = useState<Course[]>([]); const [error, setError] = useState("");
  useEffect(() => { void (async () => { const [accountResponse, courseResponse] = await Promise.all([fetch("/api/admin/accounts?type=PERSONAL&status=ACTIVE"), fetch("/api/admin/courses")]); const accountData = await accountResponse.json().catch(() => null); const courseData = await courseResponse.json().catch(() => null); if (!accountResponse.ok || !courseResponse.ok) { setError(accountData?.error ?? courseData?.error ?? "报名可选数据加载失败。"); return; } setAccounts(accountData.accounts ?? []); setCourses(courseData.courses ?? []); })(); }, []);
  return <><label>个人学员<select name="accountId" required disabled={busy}><option value="">选择启用个人账户</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.displayName ? `${account.displayName} · ` : ""}{account.loginIdentifier}</option>)}</select></label><label>报名课程<select name="courseId" required disabled={busy}><option value="">选择课程</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name} · {course.slug}</option>)}</select></label>{error && <p className="admin-form-note">{error}</p>}<label>报名来源<input name="source" maxLength={32} defaultValue="ADMIN" /></label><label>开始时间<input name="startsAt" type="datetime-local" required /></label><label>结束时间<input name="endsAt" type="datetime-local" /></label><p className="admin-form-note">仅显示启用的个人账户。提交时服务端会再次核对账户类型、状态和课程存在性。</p></>;
}
