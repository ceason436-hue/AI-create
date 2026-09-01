import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div>
          <img src="/logo2.png" alt="科瑞特 AI" className="brand-logo footer-logo" />
          <p className="footer-note">让孩子从使用科技，走向创造科技。</p>
        </div>
        <div className="footer-links">
          <Link href="/courses">课程体系</Link><Link href="/school-cooperation">校园合作</Link><Link href="/consult">课程咨询</Link><Link href="/about">校区与联系方式</Link>
        </div>
        <div className="footer-links">
          <Link href="/legal/privacy">隐私政策</Link><Link href="/legal/terms">服务条款</Link><Link href="/legal/ai-safety">AI 使用与内容安全</Link>
        </div>
      </div>
      <div className="footer-bottom">© 2026 科瑞特 AI 科创 · 内容中的占位素材将在资料确认后替换</div>
    </footer>
  );
}
