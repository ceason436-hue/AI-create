import Image from "next/image";
import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";

export function PublicHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand-mark" aria-label="返回科瑞特 AI 首页">
          <Image src="/logo2.png" alt="科瑞特 AI" className="brand-logo" width={160} height={64} priority />
          <span>科瑞特 AI</span>
        </Link>
        <nav className="site-nav" aria-label="主导航">
          <Link href="/courses">课程体系</Link>
          <Link href="/school-cooperation">校园合作</Link>
          <Link href="/activities">科创活动</Link>
          <Link href="/achievements">学员成长</Link>
          <Link href="/about">走进科瑞特</Link>
        </nav>
        <div className="site-actions">
          <Link href="/tools" className="site-action-link">AI 创作体验</Link>
          <Link href="/login" className="site-action-link site-action-login">学员登录</Link>
          <Link href="/consult" className="site-action-button">课程咨询</Link>
        </div>
        <details className="mobile-nav">
          <summary aria-label="打开导航">菜单</summary>
          <nav aria-label="移动端导航">
            <Link href="/courses">课程体系</Link><Link href="/school-cooperation">校园合作</Link><Link href="/activities">科创活动</Link><Link href="/achievements">学员成长</Link><Link href="/about">走进科瑞特</Link><Link href="/tools">AI 创作体验</Link><Link href="/login">学员登录</Link><Link href="/consult">课程咨询</Link>
          </nav>
        </details>
        <div className="session-nav"><AuthNav sessionOnly /></div>
      </div>
    </header>
  );
}
