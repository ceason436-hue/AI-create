"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PublicRegistrationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    loginIdentifier: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const endpoint = form.invitationCode.trim()
        ? "/api/auth/register/training"
        : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginIdentifier: form.loginIdentifier,
          displayName: form.displayName || undefined,
          password: form.password,
          ...(form.invitationCode.trim()
            ? { invitationCode: form.invitationCode }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "注册失败，请稍后重试。");
      router.replace("/");
      router.refresh();
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "注册失败，请稍后重试。",
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
          <h1 className="text-2xl font-black">注册个人账户</h1>
          <p className="mt-2 text-sm text-black/70">
            使用用户名和密码注册。培训学员可填写邀请码，自动获得对应培训权益。
          </p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block text-sm font-bold">
              用户名
              <input
                value={form.loginIdentifier}
                onChange={(event) =>
                  setForm({ ...form, loginIdentifier: event.target.value })
                }
                autoComplete="username"
                pattern="[A-Za-z0-9_]{3,64}"
                className="mt-1 block w-full border-2 border-black px-3 py-3 outline-none focus:ring-2 focus:ring-primary-container"
                required
              />
            </label>
            <label className="block text-sm font-bold">
              显示名称（可选）
              <input
                value={form.displayName}
                onChange={(event) =>
                  setForm({ ...form, displayName: event.target.value })
                }
                autoComplete="nickname"
                maxLength={80}
                className="mt-1 block w-full border-2 border-black px-3 py-3 outline-none focus:ring-2 focus:ring-primary-container"
              />
            </label>
            <label className="block text-sm font-bold">
              培训邀请码（可选）
              <input
                value={form.invitationCode}
                onChange={(event) =>
                  setForm({ ...form, invitationCode: event.target.value })
                }
                autoComplete="off"
                maxLength={128}
                placeholder="没有邀请码可留空"
                className="mt-1 block w-full border-2 border-black px-3 py-3 outline-none focus:ring-2 focus:ring-primary-container"
              />
            </label>
            <label className="block text-sm font-bold">
              密码
              <input
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="mt-1 block w-full border-2 border-black px-3 py-3 outline-none focus:ring-2 focus:ring-primary-container"
                required
              />
            </label>
            <label className="block text-sm font-bold">
              确认密码
              <input
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm({ ...form, confirmPassword: event.target.value })
                }
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="mt-1 block w-full border-2 border-black px-3 py-3 outline-none focus:ring-2 focus:ring-primary-container"
                required
              />
            </label>
            <p className="text-xs text-black/70">
              密码至少 8 位，且须同时包含字母和数字。
            </p>
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
              {submitting
                ? "正在创建..."
                : form.invitationCode.trim()
                  ? "创建培训账户"
                  : "创建免费账户"}
            </button>
          </form>
          <p className="mt-6 text-sm text-black/70">
            已有账户？
            <Link href="/login?mode=personal" className="font-bold underline">
              返回个人登录
            </Link>
          </p>
          <p className="mt-2 text-sm text-black/70">
            邀请码为可选项；不填写即注册社会用户。
          </p>
        </section>
      </div>
    </main>
  );
}
