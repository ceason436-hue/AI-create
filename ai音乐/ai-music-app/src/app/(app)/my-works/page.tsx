"use client";

import Link from "next/link";
import {
  Download,
  FileCode2,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Music2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Work = {
  id: string;
  title: string;
  type: string;
  status: string;
  sizeBytes: string;
  createdAt: string;
  courseContext?: { course: { name: string; slug: string }; lesson: { title: string } | null; contextType: string } | null;
};
type WorksResponse = {
  works: Work[];
  storage: { usedBytes: string; limitBytes: string };
};
type LegacyArt = { id: string; url: string; prompt?: string };
function megabytes(value: string) {
  return (Number(value) / 1024 / 1024).toFixed(1);
}
function typeIcon(type: string) {
  if (type.includes("IMAGE")) return ImageIcon;
  if (type.includes("AUDIO") || type.includes("MUSIC")) return Music2;
  if (type.includes("HTML") || type.includes("CODE")) return FileCode2;
  return FileText;
}

export default function MyWorksPage() {
  const router = useRouter();
  const [data, setData] = useState<WorksResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [legacyArt, setLegacyArt] = useState<LegacyArt[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  async function loadWorks() {
    setLoading(true);
    const response = await fetch("/api/works");
    const body = await response.json();
    if (response.status === 401) {
      router.replace("/login?mode=personal");
      return;
    }
    if (!response.ok) {
      setError(body.error ?? "暂时无法加载云端作品。");
      setLoading(false);
      return;
    }
    setData(body);
    setLoading(false);
  }
  useEffect(() => {
    void loadWorks();
    try {
      const parsed = JSON.parse(
        localStorage.getItem("ai_art_works") ?? "[]",
      ) as LegacyArt[];
      setLegacyArt(
        parsed.filter((work) =>
          /^data:image\/(jpeg|png|webp);base64,/.test(work.url),
        ),
      );
    } catch {
      setLegacyArt([]);
    }
  }, []);
  async function importLegacyArt(work: LegacyArt) {
    const [header, contentBase64] = work.url.split(",", 2);
    const mimeType = header.match(
      /^data:(image\/(?:jpeg|png|webp));base64$/,
    )?.[1];
    if (!contentBase64 || !mimeType) return;
    setImporting(work.id);
    setError("");
    try {
      const response = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "IMAGE",
          title: work.prompt?.slice(0, 80) || "本机 AI 绘画",
          mimeType,
          contentBase64,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "导入失败，请稍后重试。");
      setLegacyArt((items) => items.filter((item) => item.id !== work.id));
      await loadWorks();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "导入失败，请稍后重试。",
      );
    } finally {
      setImporting(null);
    }
  }
  async function removeWork(workId: string) {
    if (!window.confirm("确定删除这份云端作品吗？此操作无法恢复。")) return;
    const response = await fetch(`/api/works/${workId}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "删除失败，请稍后重试。");
      return;
    }
    await loadWorks();
  }
  const used = Number(data?.storage.usedBytes ?? 0);
  const limit = Number(data?.storage.limitBytes ?? 1);
  const percent = Math.min(100, Math.round((used / limit) * 100));
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <Sparkles size={14} />
            个人创作空间
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            我的作品
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            集中管理你在科瑞特 AI 创建的图片、音乐、代码与阅读内容。
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
        >
          <Sparkles size={16} />
          开始创作
        </Link>
      </div>
      {loading && (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-slate-600 shadow-sm">
          <Loader2 className="animate-spin" />
          正在加载作品...
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-800"
        >
          {error}
        </p>
      )}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-[1.4fr_.6fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">云端存储</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {megabytes(data.storage.usedBytes)}{" "}
                    <span className="text-sm font-semibold text-slate-400">
                      / {megabytes(data.storage.limitBytes)} MB
                    </span>
                  </p>
                </div>
                <span className="rounded-xl bg-slate-100 p-3 text-slate-700">
                  <HardDrive size={20} />
                </span>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                已使用 {percent}% · 共 {data.works.length} 份作品
              </p>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-sm text-slate-400">作品状态</p>
              <p className="mt-2 text-2xl font-black">{data.works.length}</p>
              <p className="mt-1 text-sm text-slate-400">云端保存的个人作品</p>
            </section>
          </div>
          {legacyArt.length > 0 && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-black text-amber-950">发现本机旧绘画</h2>
              <p className="mt-1 text-sm text-amber-900/70">
                仅导入实际保存在此浏览器中的图片，学校课堂数据不会自动上传。
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {legacyArt.map((work) => (
                  <article
                    key={work.id}
                    className="flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-3"
                  >
                    <img
                      src={work.url}
                      alt="本机旧绘画"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {work.prompt || "本机 AI 绘画"}
                      </p>
                      <button
                        type="button"
                        onClick={() => void importLegacyArt(work)}
                        disabled={importing !== null}
                        className="mt-2 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {importing === work.id ? "导入中..." : "导入云端"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
          {data.works.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <Sparkles className="mx-auto text-indigo-400" size={30} />
              <h2 className="mt-4 text-lg font-black text-slate-900">
                还没有云端作品
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                完成一次创作后，作品会出现在这里。
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
              >
                去创作
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.works.map((work) => {
                const Icon = typeIcon(work.type);
                return (
                  <article
                    key={work.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
                        <Icon size={21} />
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        {work.status}
                      </span>
                    </div>
                    <h2
                      className="mt-5 truncate font-black text-slate-900"
                      title={work.title}
                    >
                      {work.title}
                    </h2>
                    <p className="mt-2 text-xs text-slate-500">
                      {work.type} · {megabytes(work.sizeBytes)} MB ·{" "}
                      {new Date(work.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                    {work.courseContext && <p className="mt-2 text-xs font-semibold text-indigo-700">课程作品 · {work.courseContext.course.name}{work.courseContext.lesson ? ` · ${work.courseContext.lesson.title}` : ""}</p>}
                    <div className="mt-5 flex gap-2">
                      <a
                        href={`/api/works/${work.id}/download`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Download size={16} />
                        下载
                      </a>
                      <button
                        type="button"
                        onClick={() => void removeWork(work.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                        aria-label={`删除 ${work.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
