"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../login/auth.module.css";

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

export default function PublicRegistrationPage() {
  const router = useRouter();
  const [returnTo, setReturnTo] = useState("/");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ loginIdentifier: "", displayName: "", password: "", confirmPassword: "", invitationCode: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReturnTo(safeReturnTo(new URLSearchParams(window.location.search).get("returnTo")));
  }, []);

  const returnQuery = useMemo(
    () => (returnTo === "/" ? "" : `&returnTo=${encodeURIComponent(returnTo)}`),
    [returnTo],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (form.password !== form.confirmPassword) {
      setError("两次输入的密码不一致，请重新确认。");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const invitationCode = form.invitationCode.trim();
      const response = await fetch(invitationCode ? "/api/auth/register/training" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginIdentifier: form.loginIdentifier.trim(),
          displayName: form.displayName.trim() || undefined,
          password: form.password,
          ...(invitationCode ? { invitationCode } : {}),
        }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || "注册失败，请检查填写内容后重试。");
      router.replace(returnTo);
      router.refresh();
    } catch (registrationError) {
      setError(registrationError instanceof Error ? registrationError.message : "注册失败，请检查网络后重试。");
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
          <Link href="/" className={styles.backLink}><ArrowLeft aria-hidden="true" size={16} />返回官网</Link>
          <p className={styles.brandKicker}>科创五育，创智先行</p>
          <h2>开启你的作品<br />与学习记录<span>。</span></h2>
          <ul className={styles.proofs}>
            <li><CheckCircle2 aria-hidden="true" size={18} />用户名仅支持 3–64 位字母、数字或下划线</li>
            <li><CheckCircle2 aria-hidden="true" size={18} />作品、课程记录与学习成长都将安全保存</li>
          </ul>
        </aside>

        <section className={styles.card} aria-labelledby="register-title">
          <nav className={styles.modes} aria-label="账户入口">
            <Link className={styles.mode} href={`/login?mode=school${returnQuery}`}>学校登录</Link>
            <Link className={styles.mode} href={`/login?mode=personal${returnQuery}`}>个人登录</Link>
            <span className={styles.modeActive} aria-current="page">个人注册</span>
          </nav>

          <h1 id="register-title" className={styles.title}>创建个人账户</h1>
          <p className={styles.intro}>填写基础信息即可开始；培训邀请码可在获得后再输入。</p>

          <form className={styles.form} onSubmit={submit} aria-busy={submitting}>
            <label className={styles.field}>
              用户名
              <input value={form.loginIdentifier} onChange={(event) => setForm({ ...form, loginIdentifier: event.target.value })} autoComplete="username" autoCapitalize="none" spellCheck={false} pattern="[A-Za-z0-9_]{3,64}" title="请输入 3 至 64 位字母、数字或下划线" placeholder="3–64 位字母、数字或下划线" required disabled={submitting} />
            </label>
            <label className={styles.field}>
              显示名称 <span className={styles.srOnly}>可选</span>
              <input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} autoComplete="nickname" maxLength={80} placeholder="可选，方便课堂中识别" disabled={submitting} />
            </label>
            <label className={styles.field}>
              培训邀请码 <span className={styles.srOnly}>可选</span>
              <input value={form.invitationCode} onChange={(event) => setForm({ ...form, invitationCode: event.target.value })} autoComplete="off" maxLength={128} placeholder="没有邀请码可留空" disabled={submitting} />
            </label>
            <div className={styles.field}>
              <label htmlFor="register-password">密码</label>
              <span className={styles.passwordWrap}>
                <input id="register-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} placeholder="至少 8 位，须含字母和数字" required disabled={submitting} />
                <button type="button" className={styles.togglePassword} aria-label={showPassword ? "隐藏密码" : "显示密码"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
                  {showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
                </button>
              </span>
            </div>
            <label className={styles.field}>
              确认密码
              <input value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} placeholder="再次输入密码" required disabled={submitting} />
            </label>
            <p className={styles.hint}>密码至少 8 位，并同时包含字母和数字。</p>
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button type="submit" disabled={submitting} className={styles.submit}>{submitting ? "正在创建账户…" : form.invitationCode.trim() ? "创建培训账户" : "创建个人账户"}</button>
          </form>

          <p className={styles.footnote}>已有账户？ <Link href={`/login?mode=personal${returnQuery}`}>返回个人登录</Link></p>
        </section>
      </div>
    </main>
  );
}
