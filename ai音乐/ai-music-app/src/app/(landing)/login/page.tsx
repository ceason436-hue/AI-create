"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoginMode = "school" | "personal";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("school");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(
      new URLSearchParams(window.location.search).get("mode") === "personal"
        ? "personal"
        : "school",
    );
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginIdentifier, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "登录失败，请稍后重试。");
      router.replace("/");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "登录失败，请稍后重试。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-primary-container px-5 py-10 text-on-primary-container sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit items-center gap-3 text-lg font-bold"
        >
          <Image
            src="/logo2.png"
            alt="科瑞特 AI"
            width={154}
            height={40}
            className="h-10 w-auto"
            priority
          />
          科瑞特 AI 平台
        </Link>
        <section className="border-2 border-black bg-white p-6 text-black shadow-[6px_6px_0_0_#caf204] sm:p-8">
          <div className="mb-6 grid grid-cols-2 border-2 border-black">
            <button
              type="button"
              onClick={() => setMode("school")}
              className={`min-h-11 px-3 text-sm font-bold ${mode === "school" ? "bg-secondary-fixed" : "bg-white"}`}
            >
              学校课堂登录
            </button>
            <button
              type="button"
              onClick={() => setMode("personal")}
              className={`min-h-11 border-l-2 border-black px-3 text-sm font-bold ${mode === "personal" ? "bg-secondary-fixed" : "bg-white"}`}
            >
              个人用户登录
            </button>
          </div>
          <h1 className="text-2xl font-black">
            {mode === "school" ? "学校课堂" : "个人账户"}
          </h1>
          <p className="mt-2 text-sm text-black/70">
            {mode === "school"
              ? "输入学校提供的 KRT 账号和六位课堂密码。"
              : "输入个人用户名和密码。"}
          </p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block text-sm font-bold">
              {mode === "school" ? "学校账号" : "用户名"}
              <input
                value={loginIdentifier}
                onChange={(event) => setLoginIdentifier(event.target.value)}
                autoComplete="username"
                className="mt-1 block w-full border-2 border-black px-3 py-3 outline-none focus:ring-2 focus:ring-primary-container"
                placeholder={mode === "school" ? "KRT01" : "用户名"}
                required
              />
            </label>
            <label className="block text-sm font-bold">
              密码
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                inputMode={mode === "school" ? "numeric" : "text"}
                autoComplete="current-password"
                className="mt-1 block w-full border-2 border-black px-3 py-3 outline-none focus:ring-2 focus:ring-primary-container"
                placeholder={mode === "school" ? "六位数字密码" : "密码"}
                required
              />
            </label>
            {error && (
              <p
                role="alert"
                className="border-2 border-red-700 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
              >
                {error}
              </p>
            )}
            <button
              disabled={submitting}
              className="w-full border-2 border-black bg-secondary-fixed px-4 py-3 font-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "正在登录..." : "登录"}
            </button>
          </form>
          <p className="mt-6 text-sm text-black/70">
            还没有个人账户？
            <Link href="/register" className="ml-1 font-bold underline">
              注册个人账户
            </Link>
            ，培训学员可在注册时填写邀请码。
          </p>
        </section>
      </div>
    </main>
  );
}
