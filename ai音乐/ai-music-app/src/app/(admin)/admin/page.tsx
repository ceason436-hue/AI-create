"use client";

import {
  Building2,
  ChevronRight,
  Coins,
  KeyRound,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Save,
  Settings2,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const toolKeys = [
  "chat",
  "code",
  "image",
  "music",
  "music_query",
  "vision",
] as const;
type Tool = (typeof toolKeys)[number];
const toolNames: Record<Tool, string> = {
  chat: "文本对话",
  code: "AI 编程",
  image: "AI 绘画",
  music: "AI 音乐",
  music_query: "音乐查询",
  vision: "视觉点评",
};
type Tab = "overview" | "schools" | "training" | "access" | "ai";
type School = {
  id: string;
  name: string;
  code: string;
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED";
  accounts: Array<{
    loginIdentifier: string;
    status: string;
    lastLoginAt: string | null;
    allowedTools: Tool[];
    validFrom: string | null;
    validTo: string | null;
  }>;
};
type Cohort = {
  id: string;
  name: string;
  organization: { id: string; name: string; code: string };
  memberCount: number;
  invitationCount: number;
};
type Plan = {
  id: string;
  code: string;
  version: number;
  name: string;
  storageLimitBytes: string;
  monthlyCredits: number;
  allowedTools: Tool[];
  status: string;
};
type Invitation = {
  id: string;
  status: string;
  maxUses: number;
  usedCount: number;
  cohort?: { name: string; organization?: { name: string } };
  plan: { name: string; code: string } | null;
};
type Data = {
  schools: School[];
  cohorts: Cohort[];
  plans: Plan[];
  invitations: Invitation[];
  costs: Record<Tool, number> | null;
};
type Commit = (
  event: FormEvent<HTMLFormElement> | undefined,
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  payload: unknown,
  message: (result: Record<string, unknown>) => string,
) => Promise<void> | void;
type ModalState =
  | {
      kind: "confirm";
      title: string;
      message: string;
      confirmLabel: string;
      onConfirm: () => void;
    }
  | {
      kind: "password";
      title: string;
      message: string;
      onConfirm: (password: string) => void;
    }
  | null;
function datetime(value: string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}
async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "操作失败，请稍后重试。");
  return result as Record<string, unknown>;
}
const navigation: Array<{
  id: Tab;
  label: string;
  icon: typeof LayoutDashboard;
  tabs: string[];
}> = [
  {
    id: "overview",
    label: "工作台",
    icon: LayoutDashboard,
    tabs: ["平台概览"],
  },
  {
    id: "schools",
    label: "学校管理",
    icon: Building2,
    tabs: ["学校账号", "课堂配置"],
  },
  {
    id: "training",
    label: "培训管理",
    icon: UsersRound,
    tabs: ["培训班", "邀请码"],
  },
  { id: "access", label: "权益与套餐", icon: Settings2, tabs: ["权益模板"] },
  { id: "ai", label: "AI 与成本", icon: Coins, tabs: ["点数规则"] },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const hasLoaded = useRef(false);
  const [active, setActive] = useState<Tab>("overview");
  const [subTab, setSubTab] = useState("平台概览");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [schoolTools, setSchoolTools] = useState<Tool[]>([]);
  const [planTools, setPlanTools] = useState<Tool[]>([]);
  const [costs, setCosts] = useState<Record<Tool, string>>({
    chat: "",
    code: "",
    image: "",
    music: "",
    music_query: "",
    vision: "",
  });
  const load = useCallback(async () => {
    setError("");
    try {
      const urls = [
        "/api/admin/schools",
        "/api/admin/training/cohorts",
        "/api/admin/invitations",
        "/api/admin/plans",
        "/api/admin/ai-settings",
      ];
      const responses = await Promise.all(urls.map((url) => fetch(url)));
      if (responses.some((response) => response.status === 401)) {
        router.replace("/login?mode=personal");
        return;
      }
      const payloads = await Promise.all(
        responses.map((response) =>
          response.ok ? response.json().catch(() => ({})) : Promise.resolve({}),
        ),
      );
      const [schools, cohorts, invitations, plans, settings] = payloads;
      const failed = responses.find((response) => !response.ok);
      if (failed && !hasLoaded.current) {
        if (failed.status === 401) {
          router.replace("/login?mode=personal");
          return;
        }
        if (failed.status === 403)
          throw new Error("当前账户没有后台访问权限。");
        throw new Error(
          `后台数据加载失败（HTTP ${failed.status}），请稍后重试。`,
        );
      }
      const savedCosts = settings.costs ?? null;
      setData((previous) => ({
        schools: schools.schools ?? previous?.schools ?? [],
        cohorts: cohorts.cohorts ?? previous?.cohorts ?? [],
        invitations: invitations.invitations ?? previous?.invitations ?? [],
        plans: plans.plans ?? previous?.plans ?? [],
        costs: savedCosts ?? previous?.costs ?? null,
      }));
      hasLoaded.current = true;
      if (savedCosts)
        setCosts(
          Object.fromEntries(
            toolKeys.map((tool) => [tool, String(savedCosts[tool] ?? "")]),
          ) as Record<Tool, string>,
        );
      if (failed)
        setError("部分后台数据暂时无法刷新，已保留可用数据。请稍后点击刷新。");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "无法加载后台数据。",
      );
      setData(
        (previous) =>
          previous ?? {
            schools: [],
            cohorts: [],
            plans: [],
            invitations: [],
            costs: null,
          },
      );
    }
  }, [router]);
  useEffect(() => {
    void load();
  }, [load]);
  const commit: Commit = async (event, url, method, payload, message) => {
    event?.preventDefault();
    const form = event?.currentTarget;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(url, { method, body: JSON.stringify(payload) });
      setNotice(message(result));
      form?.reset();
      if (url === "/api/admin/schools" && result.school && result.account) {
        const school = result.school as {
          id: string;
          name: string;
          code: string;
        };
        const account = result.account as { loginIdentifier: string };
        setData((previous) =>
          previous
            ? {
                ...previous,
                schools: [
                  ...previous.schools,
                  {
                    ...school,
                    status: "ACTIVE",
                    accounts: [
                      {
                        loginIdentifier: account.loginIdentifier,
                        status: "ACTIVE",
                        lastLoginAt: null,
                        allowedTools: [],
                        validFrom: null,
                        validTo: null,
                      },
                    ],
                  },
                ],
              }
            : previous,
        );
      }
      if (
        url === "/api/admin/training/cohorts" &&
        result.cohort &&
        result.organization
      ) {
        const cohort = result.cohort as {
          id: string;
          name: string;
          organizationId: string;
        };
        const organization = result.organization as {
          id: string;
          name: string;
          code: string;
        };
        setData((previous) =>
          previous
            ? {
                ...previous,
                cohorts: [
                  {
                    ...cohort,
                    organization,
                    memberCount: 0,
                    invitationCount: 0,
                  },
                  ...previous.cohorts,
                ],
              }
            : previous,
        );
      }
      if (url === "/api/admin/invitations" && result.invitation) {
        const invitation = result.invitation as {
          id: string;
          cohortId: string;
          planId: string;
          maxUses: number;
        };
        setData((previous) => {
          if (!previous) return previous;
          const cohort = previous.cohorts.find(
            (item) => item.id === invitation.cohortId,
          );
          const plan =
            previous.plans.find((item) => item.id === invitation.planId) ??
            null;
          if (!cohort) return previous;
          return {
            ...previous,
            invitations: [
              {
                id: invitation.id,
                status: "ACTIVE",
                maxUses: invitation.maxUses,
                usedCount: 0,
                cohort: {
                  name: cohort.name,
                  organization: { name: cohort.organization.name },
                },
                plan: plan ? { name: plan.name, code: plan.code } : null,
              },
              ...previous.invitations,
            ],
          };
        });
      }
      if (url === "/api/admin/plans" && result.plan) {
        const plan = result.plan as Plan;
        setData((previous) =>
          previous
            ? { ...previous, plans: [plan, ...previous.plans] }
            : previous,
        );
      }
      await load();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "操作失败。",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!data)
    return (
      <section className="flex min-h-64 flex-col items-center justify-center gap-3 text-on-primary-container">
        <Loader2 className="animate-spin" />
        正在加载运营后台...
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
      </section>
    );
  const selectedNav =
    navigation.find((item) => item.id === active) ?? navigation[0];
  const indicators: Array<[string, number | string, typeof Building2]> = [
    ["学校课堂", data.schools.length, Building2],
    ["培训班", data.cohorts.length, UsersRound],
    ["邀请码", data.invitations.length, KeyRound],
    ["权益模板", data.plans.length, Settings2],
    ["点数规则", data.costs ? "已配置" : "待核定", Coins],
  ];
  const changeSection = (id: Tab) => {
    setActive(id);
    setSubTab(navigation.find((item) => item.id === id)?.tabs[0] ?? "");
  };
  return (
    <section className="flex min-h-screen w-full overflow-visible bg-slate-100 text-slate-900 lg:flex-row">
      <aside className="w-full shrink-0 border-b border-slate-200 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r lg:border-slate-800">
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#caf204] text-slate-950">
            <Settings2 size={21} />
          </div>
          <div>
            <p className="text-sm font-bold">科瑞特 AI</p>
            <p className="text-xs text-slate-400">运营管理中心</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 lg:block">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => changeSection(id)}
              className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition lg:mb-1 lg:w-full ${active === id ? "bg-[#caf204] text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={15} className="ml-auto hidden lg:block" />
            </button>
          ))}
        </nav>
        <div className="hidden border-t border-slate-800 p-4 text-xs leading-5 text-slate-500 lg:block">
          权限受服务端会话保护
          <br />
          敏感操作会写入审计日志
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                {selectedNav.label}
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                {subTab}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                返回主站
              </a>
              <button
                type="button"
                title="刷新数据"
                onClick={() => void load()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-1 overflow-x-auto">
            {selectedNav.tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSubTab(tab)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${subTab === tab ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>
        <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 lg:px-8">
          <span className="mr-2 self-center text-xs font-bold uppercase tracking-wider text-slate-400">内容与学习</span>
          <Link href="/admin/courses" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-[#caf204]">课程管理</Link>
          <Link href="/admin/course-categories" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-[#caf204]">课程分类</Link>
          <Link href="/admin/curriculum" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-[#caf204]">课时与工具</Link>
          <Link href="/admin/courseware" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-[#caf204]">课件管理</Link>
          <Link href="/admin/enrollments" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-[#caf204]">报名管理</Link>
          <Link href="/admin/content" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-[#caf204]">主站内容</Link>
          <Link href="/admin/media" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-[#caf204]">图片媒体库</Link>
          <Link href="/admin/site-pages" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-[#caf204]">页面区块</Link>
          <Link href="/admin/inquiries" className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-[#caf204]">咨询线索</Link>
        </div>
        <main className="mx-auto max-w-[1400px] space-y-6 p-5 lg:p-8">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {notice}
            </p>
          )}
          {active === "overview" && (
            <Overview
              indicators={indicators}
              data={data}
              onNavigate={changeSection}
            />
          )}
          {active === "schools" && (
            <SchoolsPanel
              data={data}
              subTab={subTab}
              schoolTools={schoolTools}
              setSchoolTools={setSchoolTools}
              busy={busy}
              commit={commit}
              requestConfirm={(title, message, onConfirm) =>
                setModal({
                  kind: "confirm",
                  title,
                  message,
                  confirmLabel: "确认删除",
                  onConfirm,
                })
              }
              requestPassword={(title, message, onConfirm) =>
                setModal({ kind: "password", title, message, onConfirm })
              }
            />
          )}
          {active === "training" && (
            <TrainingPanel
              data={data}
              subTab={subTab}
              busy={busy}
              commit={commit}
              requestConfirm={(title, message, onConfirm) =>
                setModal({
                  kind: "confirm",
                  title,
                  message,
                  confirmLabel: "确认删除",
                  onConfirm,
                })
              }
            />
          )}
          {active === "access" && (
            <AccessPanel
              data={data}
              planTools={planTools}
              setPlanTools={setPlanTools}
              busy={busy}
              commit={commit}
            />
          )}
          {active === "ai" && (
            <AiPanel
              costs={costs}
              setCosts={setCosts}
              busy={busy}
              commit={commit}
            />
          )}
        </main>
      </div>
      <AdminModal modal={modal} close={() => setModal(null)} />
    </section>
  );
}

function Overview({
  indicators,
  data,
  onNavigate,
}: {
  indicators: Array<[string, number | string, typeof Building2]>;
  data: Data;
  onNavigate: (tab: Tab) => void;
}) {
  const quickActions: Array<[Tab, string, string, typeof Building2]> = [
    ["schools", "创建学校课堂账号", "为学校生成 KRT 共享账号", Building2],
    ["training", "创建培训班与邀请码", "发放课程权益", KeyRound],
    ["access", "配置权益模板", "管理存储与 AI 工具", Settings2],
    ["ai", "调整点数规则", "控制试运行成本", Coins],
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {indicators.map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                <Icon size={19} />
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                实时
              </span>
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Quick actions
              </p>
              <h2 className="mt-1 text-xl font-black">常用管理操作</h2>
            </div>
            <LayoutDashboard className="text-slate-300" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {quickActions.map(([id, title, description, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-400 hover:shadow-sm"
              >
                <span className="inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
                  <Icon size={18} />
                </span>
                <p className="mt-3 font-bold">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
                <ChevronRight
                  size={17}
                  className="mt-3 text-slate-400 transition group-hover:translate-x-1"
                />
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            System snapshot
          </p>
          <h2 className="mt-1 text-xl font-black">当前数据概况</h2>
          <div className="mt-6 space-y-4">
            {[
              [
                "学校账号",
                data.schools.reduce(
                  (count, school) => count + school.accounts.length,
                  0,
                ),
                "可在学校管理中重置密码",
              ],
              [
                "培训邀请码",
                data.invitations.filter((item) => item.status === "ACTIVE")
                  .length,
                "启用中的邀请码",
              ],
              [
                "权益模板",
                data.plans.filter((item) => item.status === "ACTIVE").length,
                "当前可发放模板",
              ],
            ].map(([label, value, hint]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-sm text-slate-500">{hint}</p>
                </div>
                <p className="text-2xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SchoolsPanel({
  data,
  subTab,
  schoolTools,
  setSchoolTools,
  busy,
  commit,
  requestConfirm,
  requestPassword,
}: {
  data: Data;
  subTab: string;
  schoolTools: Tool[];
  setSchoolTools: (value: Tool[]) => void;
  busy: boolean;
  commit: Commit;
  requestConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => void;
  requestPassword: (
    title: string,
    message: string,
    onConfirm: (password: string) => void,
  ) => void;
}) {
  const showAccounts = subTab === "学校账号";
  return (
    <div className="space-y-6">
      <PanelHeader
        title={showAccounts ? "学校账号" : "课堂配置"}
        description={
          showAccounts
            ? "创建学校共享账号并安全记录一次性初始密码。"
            : "调整学校合作期限、启停状态和课堂可用 AI 工具。"
        }
      />
      <div
        className={
          showAccounts
            ? "grid gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]"
            : ""
        }
      >
        {showAccounts && (
          <form
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              const form = new FormData(event.currentTarget);
              void commit(
                event,
                "/api/admin/schools",
                "POST",
                {
                  name: form.get("name"),
                  code: form.get("code"),
                  notes: form.get("notes") || undefined,
                  allowedTools: schoolTools,
                  validFrom: form.get("validFrom")
                    ? new Date(String(form.get("validFrom"))).toISOString()
                    : undefined,
                  validTo: form.get("validTo")
                    ? new Date(String(form.get("validTo"))).toISOString()
                    : undefined,
                },
                (result) => {
                  const account = result.account as {
                    loginIdentifier: string;
                    initialPassword: string;
                  };
                  return `学校已创建：${account.loginIdentifier}，初始密码 ${account.initialPassword}。请立即安全记录。`;
                },
              );
            }}
          >
            <FormTitle title="新增学校" />
            <Input
              label="学校名称"
              name="name"
              minLength={2}
              maxLength={160}
              required
            />
            <Input
              label="学校代码"
              name="code"
              pattern="[A-Za-z0-9_]{2,32}"
              required
            />
            <ToolPicker value={schoolTools} onChange={setSchoolTools} />
            <Dates names={["validFrom", "validTo"]} />
            <label className="field">
              备注
              <textarea name="notes" maxLength={2000} />
            </label>
            <Submit disabled={busy}>创建学校账号</Submit>
          </form>
        )}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormTitle title={showAccounts ? "已创建的学校" : "课堂配置列表"} />
          <div className="mt-5 space-y-5">
            {data.schools.length === 0 ? (
              <Empty text="尚无学校账号。" />
            ) : (
              data.schools.map((school) => (
                <SchoolEditor
                  key={school.id}
                  school={school}
                  busy={busy}
                  commit={commit}
                  showAccounts={showAccounts}
                  requestConfirm={requestConfirm}
                  requestPassword={requestPassword}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
function TrainingPanel({
  data,
  subTab,
  busy,
  commit,
  requestConfirm,
}: {
  data: Data;
  subTab: string;
  busy: boolean;
  commit: Commit;
  requestConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => void;
}) {
  const showCohorts = subTab === "培训班";
  return (
    <div className="space-y-6">
      <PanelHeader
        title={showCohorts ? "培训班" : "邀请码"}
        description={
          showCohorts
            ? "创建培训机构和班级，供后续邀请码绑定。"
            : "选择培训班和权益模板，生成可分发的邀请码。"
        }
      />
      {showCohorts ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
          <form
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              const form = new FormData(event.currentTarget);
              void commit(
                event,
                "/api/admin/training/cohorts",
                "POST",
                {
                  organizationName: form.get("organizationName"),
                  organizationCode: form.get("organizationCode"),
                  name: form.get("name"),
                  startsAt: form.get("startsAt")
                    ? new Date(String(form.get("startsAt"))).toISOString()
                    : undefined,
                  endsAt: form.get("endsAt")
                    ? new Date(String(form.get("endsAt"))).toISOString()
                    : undefined,
                },
                () => "培训班已创建。",
              );
            }}
          >
            <FormTitle title="新增培训班" />
            <Input
              label="培训机构名称"
              name="organizationName"
              minLength={2}
              maxLength={160}
              required
            />
            <Input
              label="机构代码"
              name="organizationCode"
              pattern="[A-Za-z0-9_]{2,32}"
              required
            />
            <Input
              label="班级名称"
              name="name"
              minLength={2}
              maxLength={160}
              required
            />
            <Dates names={["startsAt", "endsAt"]} />
            <Submit disabled={busy}>创建培训班</Submit>
          </form>
          <RecordList title="已创建的培训班" empty="尚无培训班。">
            {data.cohorts.map((cohort) => (
              <li key={cohort.id}>
                <div className="flex items-start justify-between gap-3">
                  <strong>
                    {cohort.organization.name} · {cohort.name}
                  </strong>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => {
                      requestConfirm(
                        "删除培训班",
                        `确认删除培训班 ${cohort.name}？其邀请码也会被删除，已注册学员账户不会删除。`,
                        () =>
                          void commit(
                            undefined,
                            `/api/admin/training/cohorts/${cohort.id}`,
                            "DELETE",
                            {},
                            () => "培训班已删除。",
                          ),
                      );
                    }}
                  >
                    删除
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => {
                      requestConfirm(
                        "删除培训机构",
                        `确认删除机构 ${cohort.organization.name}？该机构下所有培训班和邀请码都会被删除。`,
                        () =>
                          void commit(
                            undefined,
                            `/api/admin/training/organizations/${cohort.organization.id}`,
                            "DELETE",
                            {},
                            () => "培训机构已删除。",
                          ),
                      );
                    }}
                  >
                    删除机构
                  </button>
                </div>
                <span>
                  学员 {cohort.memberCount} 人 · 邀请码 {cohort.invitationCount}{" "}
                  个
                </span>
              </li>
            ))}
          </RecordList>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
          <form
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(event) => {
              const form = new FormData(event.currentTarget);
              void commit(
                event,
                "/api/admin/invitations",
                "POST",
                {
                  cohortId: form.get("cohortId"),
                  planId: form.get("planId"),
                  maxUses: Number(form.get("maxUses")),
                  validFrom: form.get("validFrom")
                    ? new Date(String(form.get("validFrom"))).toISOString()
                    : undefined,
                  expiresAt: form.get("expiresAt")
                    ? new Date(String(form.get("expiresAt"))).toISOString()
                    : undefined,
                  entitlementDays: form.get("entitlementDays")
                    ? Number(form.get("entitlementDays"))
                    : undefined,
                },
                (result) =>
                  `邀请码已生成：${String(result.code)}。请立即安全分发。`,
              );
            }}
          >
            <FormTitle title="生成邀请码" />
            <Select
              label="培训班"
              name="cohortId"
              options={data.cohorts.map((cohort) => [
                cohort.id,
                `${cohort.organization.name} · ${cohort.name}`,
              ])}
            />
            <Select
              label="权益模板"
              name="planId"
              options={data.plans
                .filter((plan) => plan.status === "ACTIVE")
                .map((plan) => [
                  plan.id,
                  `${plan.name}（${plan.code} v${plan.version}）`,
                ])}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="最大兑换人数"
                name="maxUses"
                type="number"
                min="1"
                max="10000"
                required
              />
              <Input
                label="权益天数"
                name="entitlementDays"
                type="number"
                min="1"
                max="3650"
              />
            </div>
            <Dates names={["validFrom", "expiresAt"]} />
            <Submit
              disabled={busy || !data.cohorts.length || !data.plans.length}
            >
              生成培训邀请码
            </Submit>
          </form>
          <RecordList title="已生成的邀请码" empty="尚无邀请码。">
            {data.invitations.map((invitation) => (
              <li key={invitation.id}>
                <div className="flex items-start justify-between gap-3">
                  <strong>
                    {invitation.cohort?.organization?.name ?? "未命名机构"} ·{" "}
                    {invitation.cohort?.name ?? "未命名培训班"}
                  </strong>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => {
                      requestConfirm(
                        "删除邀请码",
                        "确认删除这个邀请码？已使用记录也会被删除。",
                        () =>
                          void commit(
                            undefined,
                            `/api/admin/invitations/${invitation.id}`,
                            "DELETE",
                            {},
                            () => "邀请码已删除。",
                          ),
                      );
                    }}
                  >
                    删除
                  </button>
                </div>
                <span>
                  {invitation.status} · 已用 {invitation.usedCount}/
                  {invitation.maxUses} · {invitation.plan?.name ?? "无模板"}
                </span>
              </li>
            ))}
          </RecordList>
        </div>
      )}
    </div>
  );
}
function AccessPanel({
  data,
  planTools,
  setPlanTools,
  busy,
  commit,
}: {
  data: Data;
  planTools: Tool[];
  setPlanTools: (value: Tool[]) => void;
  busy: boolean;
  commit: Commit;
}) {
  return (
    <div className="space-y-6">
      <PanelHeader
        title="权益与套餐"
        description="权益模板决定 AI 工具权限、云端作品空间和月度点数；价格可以后续再补充。"
      />
      <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={(event) => {
            const form = new FormData(event.currentTarget);
            void commit(
              event,
              "/api/admin/plans",
              "POST",
              {
                code: form.get("code"),
                name: form.get("name"),
                storageLimitBytes: Number(form.get("storageLimitBytes")),
                monthlyCredits: Number(form.get("monthlyCredits")),
                allowedTools: planTools,
              },
              () => "权益模板新版本已创建。",
            );
          }}
        >
          <FormTitle title="新增权益模板" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="套餐代码"
              name="code"
              pattern="[A-Za-z0-9_]{2,32}"
              required
            />
            <Input
              label="显示名称"
              name="name"
              minLength={2}
              maxLength={80}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="存储字节数"
              name="storageLimitBytes"
              type="number"
              min="0"
              required
            />
            <Input
              label="月度点数"
              name="monthlyCredits"
              type="number"
              min="0"
              required
            />
          </div>
          <ToolPicker value={planTools} onChange={setPlanTools} required />
          <Submit disabled={busy || planTools.length === 0}>
            创建权益模板
          </Submit>
        </form>
        <RecordList title="现有权益模板" empty="尚无权益模板。">
          {data.plans.map((plan) => (
            <li key={plan.id}>
              <strong>
                {plan.name}{" "}
                <em>
                  {plan.code} v{plan.version}
                </em>
              </strong>
              <span>
                {plan.status} · 存储 {plan.storageLimitBytes} bytes · 月度点数{" "}
                {plan.monthlyCredits}
              </span>
            </li>
          ))}
        </RecordList>
      </div>
    </div>
  );
}
function AiPanel({
  costs,
  setCosts,
  busy,
  commit,
}: {
  costs: Record<Tool, string>;
  setCosts: React.Dispatch<React.SetStateAction<Record<Tool, string>>>;
  busy: boolean;
  commit: Commit;
}) {
  return (
    <div className="space-y-6">
      <PanelHeader
        title="AI 与成本"
        description="当前试运行期六类工具均可配置为 0 点。认证、权益、限流、并发、幂等和审计仍然有效。"
      />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <FormTitle title="AI 点数权重" />
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          onSubmit={(event) => {
            void commit(
              event,
              "/api/admin/ai-settings",
              "PATCH",
              Object.fromEntries(
                toolKeys.map((tool) => [tool, Number(costs[tool])]),
              ),
              () => "AI 点数权重已更新。",
            );
          }}
        >
          {toolKeys.map((tool) => (
            <label key={tool} className="field">
              {toolNames[tool]}
              <input
                required
                type="number"
                min="0"
                max="10000"
                value={costs[tool]}
                onChange={(event) =>
                  setCosts((previous) => ({
                    ...previous,
                    [tool]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
          <div className="flex items-end">
            <Submit disabled={busy}>保存点数规则</Submit>
          </div>
        </form>
      </section>
    </div>
  );
}
function SchoolEditor({
  school,
  busy,
  commit,
  showAccounts,
  requestConfirm,
  requestPassword,
}: {
  school: School;
  busy: boolean;
  commit: Commit;
  showAccounts: boolean;
  requestConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => void;
  requestPassword: (
    title: string,
    message: string,
    onConfirm: (password: string) => void,
  ) => void;
}) {
  const account = school.accounts[0];
  const [status, setStatus] = useState(school.status);
  const [selected, setSelected] = useState<Tool[]>(account?.allowedTools ?? []);
  const [from, setFrom] = useState(datetime(account?.validFrom));
  const [to, setTo] = useState(datetime(account?.validTo));
  return (
    <article className="rounded-xl border border-slate-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-black">
            {school.name}{" "}
            <span className="font-normal text-slate-400">{school.code}</span>
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            课堂账号：{account?.loginIdentifier ?? "未配置"} · 最近登录：
            {account?.lastLoginAt
              ? new Date(account.lastLoginAt).toLocaleString("zh-CN")
              : "从未"}
          </p>
        </div>
        {showAccounts && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                requestPassword(
                  `重置 ${school.name} 的学校密码`,
                  "请输入新的 6 位数字密码。旧课堂会话会失效，重置次数不受限制。",
                  (password) => {
                    if (!/^\d{6}$/.test(password)) return;
                    void commit(
                      undefined,
                      `/api/admin/schools/${school.id}/reset-password`,
                      "POST",
                      { password },
                      (result) => {
                        const item = result.account as {
                          loginIdentifier: string;
                        };
                        return `密码已重置：${item.loginIdentifier}。自定义密码已生效。`;
                      },
                    );
                  },
                );
              }}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              重置密码
            </button>
            <button
              type="button"
              onClick={() => {
                requestConfirm(
                  "删除学校",
                  `确认删除学校 ${school.name}？学校账号、会话和课堂配置将被删除。`,
                  () =>
                    void commit(
                      undefined,
                      `/api/admin/schools/${school.id}`,
                      "DELETE",
                      {},
                      () => `${school.name} 已删除。`,
                    ),
                );
              }}
              disabled={busy}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              删除
            </button>
          </div>
        )}
      </div>
      {showAccounts ? (
        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          学校账号按 KRT01、KRT02 顺序生成。密码只在创建或重置后显示一次。
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <label className="field">
              状态
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as School["status"])
                }
              >
                <option value="ACTIVE">启用</option>
                <option value="SUSPENDED">暂停</option>
                <option value="EXPIRED">结束</option>
              </select>
            </label>
            <label className="field">
              开始
              <input
                type="datetime-local"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="field">
              结束
              <input
                type="datetime-local"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-4">
            <ToolPicker value={selected} onChange={setSelected} />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void commit(
                undefined,
                `/api/admin/schools/${school.id}`,
                "PATCH",
                {
                  status,
                  allowedTools: selected,
                  validFrom: from ? new Date(from).toISOString() : null,
                  validTo: to ? new Date(to).toISOString() : null,
                },
                () => `${school.name} 已更新。`,
              )
            }
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            保存课堂配置
          </button>
        </>
      )}
    </article>
  );
}
function PanelHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
    </div>
  );
}
function FormTitle({ title }: { title: string }) {
  return (
    <h3 className="border-b border-slate-100 pb-4 text-lg font-black">
      {title}
    </h3>
  );
}
function ToolPicker({
  value,
  onChange,
  required = false,
}: {
  value: Tool[];
  onChange: (next: Tool[]) => void;
  required?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold">
        可用 AI 工具{required ? "（至少一项）" : ""}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {toolKeys.map((tool) => (
          <label
            key={tool}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={value.includes(tool)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, tool]
                    : value.filter((item) => item !== tool),
                )
              }
            />
            {toolNames[tool]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function Input({
  label,
  name,
  type = "text",
  ...props
}: {
  label: string;
  name: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      {label}
      <input name={name} type={type} {...props} />
    </label>
  );
}
function Dates({ names }: { names: [string, string] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="开始时间" name={names[0]} type="datetime-local" />
      <Input label="结束时间" name={names[1]} type="datetime-local" />
    </div>
  );
}
function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: Array<string[]>;
}) {
  return (
    <label className="field">
      {label}
      <select name={name} required defaultValue="">
        <option value="" disabled>
          请选择
        </option>
        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function Submit({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
    >
      <Save size={16} />
      {children}
    </button>
  );
}
function RecordList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <FormTitle title={title} />
      <ul className="mt-4 divide-y divide-slate-100">
        {children.length ? (
          children
        ) : (
          <li className="py-4 text-sm text-slate-500">{empty}</li>
        )}
      </ul>
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {text}
    </p>
  );
}
function AdminModal({
  modal,
  close,
}: {
  modal: ModalState;
  close: () => void;
}) {
  const [password, setPassword] = useState("");
  useEffect(() => setPassword(""), [modal]);
  if (!modal) return null;
  const confirm = () => {
    if (modal.kind === "password" && !/^\d{6}$/.test(password)) return;
    if (modal.kind === "password") modal.onConfirm(password);
    else modal.onConfirm();
    close();
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black">{modal.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {modal.message}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>
        {modal.kind === "password" && (
          <label className="field mt-5">
            新密码
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={password}
              onChange={(event) =>
                setPassword(event.target.value.replace(/\D/g, ""))
              }
              placeholder="请输入 6 位数字"
            />
          </label>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={confirm}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${modal.kind === "confirm" ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-700"}`}
          >
            {modal.kind === "password" ? "确认重置" : modal.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
