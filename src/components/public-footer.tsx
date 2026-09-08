import Image from "next/image";
import Link from "next/link";
import { ContactDialogTrigger } from "@/components/contact-dialog";

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div>
          <Image src="/logo2.png" alt="科瑞特 AI" className="brand-logo footer-logo" width={160} height={64} />
          <p className="footer-note">科创五育，创智先行。<br />让孩子在真实创造中理解科技。</p>
        </div>
        <div className="footer-links">
          <span>探索</span><Link href="/courses">课程体系</Link><Link href="/tools">AI 创作空间</Link><Link href="/school-cooperation">校园合作</Link><Link href="/activities">科创活动</Link>
        </div>
        <div className="footer-links">
          <span>继续了解</span><Link href="/achievements">学员成长</Link><Link href="/consult">课程咨询</Link><Link href="/about">走进科瑞特</Link><ContactDialogTrigger className="footer-contact-button">校区与联系方式</ContactDialogTrigger>
        </div>
        <div className="footer-links">
          <span>使用说明</span><Link href="/legal/privacy">隐私政策</Link><Link href="/legal/terms">服务条款</Link><Link href="/legal/ai-safety">AI 使用与内容安全</Link>
        </div>
      </div>
      <div className="footer-bottom"><span>© 2026 科瑞特 AI 科创</span><span>上海 · 徐汇</span></div>
    </footer>
  );
}
