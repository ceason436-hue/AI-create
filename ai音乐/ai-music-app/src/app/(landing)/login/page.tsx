"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpenText, Box, ChartNoAxesCombined, CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

type LoginMode = "school" | "personal" | "admin";

function parseLoginMode(raw: string | null): LoginMode {
  if (raw === "personal" || raw === "admin") return raw;
  return "school";
}

function safeReturnTo(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/";
  try {
    const destination = new URL(raw, window.location.origin);
    return destination.origin === window.location.origin
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : "/";
  } catch {
    return "/";
  }
}

async function responseMessage(response: Response) {
  const data = await response.json().catch(() => null) as { error?: string } | null;
  if (response.ok) return "";
  return data?.error || "登录失败，请检查账号信息后重试。";
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("school");
  const [returnTo, setReturnTo] = useState("/");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const requestedMode = parseLoginMode(search.get("mode"));
    setMode(requestedMode);
    setReturnTo(requestedMode === "admin" ? "/admin" : safeReturnTo(search.get("returnTo")));
  }, []);

  const encodedReturnTo = useMemo(
    () => (returnTo === "/" ? "" : `?returnTo=${encodeURIComponent(returnTo)}`),
    [returnTo],
  );

  function switchMode(nextMode: LoginMode) {
    const nextReturnTo = mode === "admin" ? "/" : returnTo;
    setMode(nextMode);
    setReturnTo(nextReturnTo);
    setError("");
    const search = new URLSearchParams();
    search.set("mode", nextMode);
    if (nextReturnTo !== "/") search.set("returnTo", nextReturnTo);
    window.history.replaceState(null, "", `/login?${search.toString()}`);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, loginIdentifier: loginIdentifier.trim(), password }),
      });
      const message = await responseMessage(response);
      if (message) throw new Error(message);
      router.replace(returnTo);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败，请检查网络后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.brandPanel}>
          <Link href="/" className={styles.brand} aria-label="返回科瑞特 AI 首页">
            <Image src="/logo2.png" alt="科瑞特 AI" width={154} height={40} priority />
            <span>青少儿科创机器人编程</span>
          </Link>
          <br />
          <Link href="/" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" size={16} />
            返回官网
          </Link>
          <p className={styles.brandKicker}>科创五育，创智先行</p>
          <h2>回到你的作品<br />与学习记录<span>。</span></h2>
          <ul className={styles.proofs}>
            <li><BookOpenText aria-hidden="true" /><span><b>课程记录</b><small>随时回顾课堂内容<br />巩固学习要点。</small></span></li>
            <li><Box aria-hidden="true" /><span><b>创作作品</b><small>管理你的项目作品<br />记录创作过程。</small></span></li>
            <li><ChartNoAxesCombined aria-hidden="true" /><span><b>学习成长</b><small>追踪学习进度轨迹<br />见证每一次进步。</small></span></li>
          </ul>
        </aside>

        <section className={styles.card} aria-labelledby="login-title">
          <nav className={styles.modes} aria-label="账户入口">
            <button type="button" className={mode === "school" ? styles.modeActive : styles.mode} aria-current={mode === "school" ? "page" : undefined} onClick={() => switchMode("school")}>学校登录</button>
            <button type="button" className={mode === "personal" ? styles.modeActive : styles.mode} aria-current={mode === "personal" ? "page" : undefined} onClick={() => switchMode("personal")}>个人登录</button>
            <Link className={styles.mode} href={`/register${encodedReturnTo}`}>注册账号</Link>
          </nav>

          <h1 id="login-title" className={styles.title}>{mode === "school" ? "进入学校课堂" : mode === "admin" ? "登录运营后台" : "登录个人账户"}</h1>
          <p className={styles.intro}>{mode === "school" ? "输入学校提供的 KRT 账号与课堂密码。" : mode === "admin" ? "输入管理员账号与密码。" : "输入注册时使用的用户名与密码。"}</p>

          <form className={styles.form} onSubmit={submit} aria-busy={submitting}>
            <label className={styles.field}>
              {mode === "school" ? "学校账号" : mode === "admin" ? "管理员账号" : "用户名"}
              <input value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder={mode === "school" ? "例如：KRT01" : mode === "admin" ? "请输入管理员账号" : "请输入用户名"} required disabled={submitting} />
            </label>
            <div className={styles.field}>
              <label htmlFor="login-password">密码</label>
              <span className={styles.passwordWrap}>
                <input id="login-password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} inputMode={mode === "school" ? "numeric" : "text"} autoComplete="current-password" placeholder={mode === "school" ? "请输入课堂密码" : "请输入密码"} required disabled={submitting} />
                <button type="button" className={styles.togglePassword} aria-label={showPassword ? "隐藏密码" : "显示密码"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
                  {showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
                </button>
              </span>
            </div>

            <label className={styles.agreement}>
              <input type="checkbox" required />
              <span>我已阅读并同意 <Link href="/legal/terms">《用户协议》</Link> 与 <Link href="/legal/privacy">《隐私政策》</Link></span>
            </label>

            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button type="submit" disabled={submitting} className={styles.submit}>{submitting ? "正在登录…" : "登录并继续"}</button>
          </form>
          <Link className={styles.registerButton} href={`/register${encodedReturnTo}`}>注册新账号</Link>
          <p className={styles.privacy}><ShieldCheck aria-hidden="true" />我们重视隐私保护，您的信息将仅用于账号安全与学习服务。</p>

          <section className={styles.preview} aria-label="当前账号规则">
            <h2>账号与服务边界</h2>
            <div className={styles.previewGrid}>
              <div className={styles.previewFields}>
                <p><span>注册方式</span><b>用户名 + 密码</b><CheckCircle2 aria-hidden="true" /></p>
                <p><span>套餐开通</span><b>管理员人工处理</b><CheckCircle2 aria-hidden="true" /></p>
                <p><span>暂未开放</span><b>短信、找回与在线支付</b><Eye aria-hidden="true" /></p>
              </div>
              <div className={styles.previewStates}>
                <p className={styles.success}><CheckCircle2 aria-hidden="true" /><span><b>社会用户可注册</b><small>使用用户名和密码登录</small></span></p>
                <p><span><b>学校账号独立</b><small>由学校提供课堂账号</small></span></p>
                <p><span><b>运营后台隔离</b><small>管理员必须从后台入口登录</small></span></p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
