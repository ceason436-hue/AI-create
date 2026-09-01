"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionAccount = {
  loginIdentifier: string;
  type: "ADMIN" | "SCHOOL_SHARED" | "PERSONAL";
};

export function AuthNav({ sessionOnly = false }: { sessionOnly?: boolean } = {}) {
  const [account, setAccount] = useState<SessionAccount | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setAccount(data?.account ?? null))
      .catch(() => setAccount(null))
      .finally(() => setLoaded(true));
  }, []);

  async function logout() {
    if (document.cookie.includes("krt_account_type=SCHOOL_SHARED")) {
      sessionStorage.clear();
    }
    await fetch("/api/auth/logout", { method: "POST" });
    setAccount(null);
    window.location.assign("/");
  }

  if (!loaded) return sessionOnly ? null : <div className="h-10 w-24" aria-hidden="true" />;

  if (account) {
    return (
      <div className="flex items-center gap-2 md:gap-3">
        {account.type === "PERSONAL" && <Link href="/my-works" className="hidden text-sm font-bold text-on-primary-container underline sm:block">我的作品</Link>}
        {account.type === "ADMIN" && <Link href="/admin" className="hidden text-sm font-bold text-on-primary-container underline sm:block">运营后台</Link>}
        <span className="hidden max-w-28 truncate text-sm font-semibold text-on-primary-container sm:block" title={account.loginIdentifier}>
          {account.type === "SCHOOL_SHARED" ? "学校课堂" : account.loginIdentifier}
        </span>
        <button type="button" onClick={logout} className="px-4 py-2 text-sm font-bold text-on-primary-container brutalist-border-white rounded-full hover:bg-white/10 transition-colors">
          退出
        </button>
      </div>
    );
  }

  if (sessionOnly) return null;

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <Link href="/login" className="hidden sm:block px-4 py-2 md:px-6 md:py-3 font-label-bold text-sm md:text-label-bold text-on-primary-container brutalist-border-white rounded-full hover:bg-white/10 transition-colors">
        登录
      </Link>
      <Link href="/register" className="px-4 py-2 md:px-6 md:py-3 font-label-bold text-sm md:text-label-bold bg-secondary-fixed text-black brutalist-border rounded-full brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all">
        注册
      </Link>
    </div>
  );
}
