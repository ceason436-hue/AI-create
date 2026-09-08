"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, KeyRound, Loader2, Plus, ShieldCheck, UserRoundCog } from "lucide-react";

const permissionLabels = {
  ADMIN_USERS: "账号、学校与培训管理",
  ADMIN_COURSES: "课程、课时与课件管理",
  ADMIN_CONTENT: "站点内容与媒体管理",
  ADMIN_AI: "AI 工具与成本设置",
  ADMIN_INQUIRIES: "课程咨询线索管理",
} as const;
type Permission = keyof typeof permissionLabels;
type Admin = {
  id: string;
  loginIdentifier: string;
  displayName: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  lastLoginAt: string | null;
  roleKeys: string[];
};

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "操作失败，请稍后重试。");
  return data;
}

function PermissionPicker({ value, onChange }: { value: Permission[]; onChange: (next: Permission[]) => void }) {
  return <div className="grid gap-2 sm:grid-cols-2">{Object.entries(permissionLabels).map(([key, label]) => {
    const permission = key as Permission;
    const checked = value.includes(permission);
    return <label key={key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${checked ? "border-blue-500 bg-blue-50 text-blue-950" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-700" checked={checked} onChange={() => onChange(checked ? value.filter((item) => item !== permission) : [...value, permission])} />
      <span>{label}</span>
    </label>;
  })}</div>;
}

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Record<string, { displayName: string; status: "ACTIVE" | "SUSPENDED"; permissions: Permission[]; superAdmin: boolean; password: string }>>({});
  const [newPermissions, setNewPermissions] = useState<Permission[]>(["ADMIN_CONTENT"]);
  const [newSuper, setNewSuper] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await request("/api/admin/admins");
      setAdmins(data.admins || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "管理员列表加载失败。");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true); setError(""); setNotice("");
    try {
      await request("/api/admin/admins", { method: "POST", body: JSON.stringify({ loginIdentifier: values.get("loginIdentifier"), password: values.get("password"), displayName: values.get("displayName"), permissions: newPermissions, superAdmin: newSuper }) });
      form.reset(); setNewPermissions(["ADMIN_CONTENT"]); setNewSuper(false);
      setNotice("管理员已创建，账号立即永久启用，直到超级管理员手动停用。");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "创建失败。"); }
    finally { setBusy(false); }
  }

  function draft(admin: Admin) {
    return editing[admin.id] ?? { displayName: admin.displayName, status: admin.status, permissions: admin.roleKeys.filter((key): key is Permission => key in permissionLabels), superAdmin: admin.roleKeys.includes("SUPER_ADMIN"), password: "" };
  }
  function change(admin: Admin, next: Partial<ReturnType<typeof draft>>) {
    setEditing((previous) => ({ ...previous, [admin.id]: { ...draft(admin), ...next } }));
  }
  async function save(admin: Admin) {
    const value = draft(admin);
    setBusy(true); setError(""); setNotice("");
    try {
      await request(`/api/admin/admins/${admin.id}`, { method: "PATCH", body: JSON.stringify({ displayName: value.displayName, status: value.status, permissions: value.permissions, superAdmin: value.superAdmin, ...(value.password ? { password: value.password } : {}) }) });
      setEditing((previous) => { const next = { ...previous }; delete next[admin.id]; return next; });
      setNotice(`${admin.loginIdentifier} 的权限已更新。`);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "更新失败。"); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900 lg:px-10">
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div><Link href="/admin" className="text-sm font-bold text-blue-700 hover:underline">← 返回运营后台</Link><h1 className="mt-3 text-3xl font-black tracking-tight">管理员与权限</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">超级管理员可创建管理账号、限制可管理的业务区域，或暂停账号。账号不设业务到期日。</p></div>
        <div className="flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-bold text-white"><ShieldCheck size={19} />仅超级管理员可修改</div>
      </div>
      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><Check size={17} />{notice}</p>}
      <section className="mb-7 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={19} />添加管理员</h2>
        <form onSubmit={create} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-3"><label className="grid gap-2 text-sm font-bold">登录账号<input name="loginIdentifier" required minLength={3} maxLength={64} pattern="[A-Za-z0-9_]+" className="rounded-xl border border-slate-300 px-3 py-2.5 font-normal uppercase focus:border-blue-600 focus:outline-none" placeholder="ADMIN_NAME" /></label><label className="grid gap-2 text-sm font-bold">显示名<input name="displayName" maxLength={80} className="rounded-xl border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none" placeholder="可选" /></label><label className="grid gap-2 text-sm font-bold">初始密码<input name="password" type="password" required minLength={12} maxLength={128} className="rounded-xl border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none" placeholder="至少 12 位" /></label></div>
          <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={newSuper} onChange={(event) => setNewSuper(event.target.checked)} className="h-4 w-4 accent-blue-700" />设为超级管理员（拥有全部权限）</label>
          {!newSuper && <PermissionPicker value={newPermissions} onChange={setNewPermissions} />}
          <button disabled={busy || (!newSuper && !newPermissions.length)} className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-blue-800 px-5 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <UserRoundCog size={17} />}创建管理员</button>
        </form>
      </section>
      <section className="grid gap-4">
        {admins.map((admin) => { const value = draft(admin); return <article key={admin.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="text-lg font-black">{admin.loginIdentifier}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${value.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{value.status === "ACTIVE" ? "已启用" : "已停用"}</span></div><p className="mt-1 text-xs text-slate-500">上次登录：{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString("zh-CN") : "从未登录"}</p></div><button disabled={busy} onClick={() => void save(admin)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">保存设置</button></div>
          <div className="mt-5 grid gap-4 md:grid-cols-3"><label className="grid gap-2 text-sm font-bold">显示名<input value={value.displayName} onChange={(event) => change(admin, { displayName: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 font-normal" /></label><label className="grid gap-2 text-sm font-bold">状态<select value={value.status} onChange={(event) => change(admin, { status: event.target.value as "ACTIVE" | "SUSPENDED" })} className="rounded-xl border border-slate-300 px-3 py-2 font-normal"><option value="ACTIVE">永久启用</option><option value="SUSPENDED">暂停使用</option></select></label><label className="grid gap-2 text-sm font-bold">重置密码<input type="password" minLength={12} value={value.password} onChange={(event) => change(admin, { password: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 font-normal" placeholder="留空表示不修改" /></label></div>
          <label className="mt-4 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={value.superAdmin} onChange={(event) => change(admin, { superAdmin: event.target.checked })} className="h-4 w-4 accent-blue-700" /><KeyRound size={17} />超级管理员</label>
          {!value.superAdmin && <div className="mt-4"><PermissionPicker value={value.permissions} onChange={(permissions) => change(admin, { permissions })} /></div>}
        </article>; })}
      </section>
    </div>
  </main>;
}
