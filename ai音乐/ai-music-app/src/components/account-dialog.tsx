"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SessionAccount = { loginIdentifier: string; type: "ADMIN" | "SCHOOL_SHARED" | "PERSONAL" };

/** Header authentication always uses the full login and registration pages. */
export function PublicAuthControls({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
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
    if (document.cookie.includes("krt_account_type=SCHOOL_SHARED")) sessionStorage.clear();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!loaded) return <span className="auth-loading" aria-hidden="true" />;
  if (account) {
    return <div className="public-session">
      <Link href={account.type === "ADMIN" ? "/admin" : account.type === "PERSONAL" ? "/my-works" : "/learn"}>
        {account.type === "SCHOOL_SHARED" ? "进入课堂" : account.loginIdentifier}
      </Link>
      <button type="button" onClick={logout}><LogOut aria-hidden="true" size={16} />退出</button>
    </div>;
  }

  return <div className={`public-auth-controls ${compact ? "compact" : ""}`}>
    <Link href="/login" className="header-text-button">登录</Link>
    <Link href="/register" className="header-register-button">注册</Link>
  </div>;
}
