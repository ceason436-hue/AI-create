import type { Metadata } from "next";
import "../globals.css";
import Image from "next/image";
import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import { AiTrialConsent } from "@/components/ai-trial-consent";

export const metadata: Metadata = {
  title: "AI科瑞特",
  description: "专为小学生设计的AI音乐创作网页应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="bg-primary-container font-body-lg antialiased selection:bg-secondary-fixed selection:text-black">
        {/* Background Fluid Shapes (Copied from Landing Hero) */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] bg-secondary-fixed blur-[8px] fluid-shape-1 opacity-80"></div>
          <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-secondary-fixed/50 blur-[12px] fluid-shape-2 opacity-60"></div>
        </div>

        <div className="min-h-screen flex flex-col overflow-x-hidden">
          <script dangerouslySetInnerHTML={{ __html: `(() => {
            try {
              const cookie = document.cookie.split('; ').find((item) => item.startsWith('krt_account_type='));
              if (!cookie || decodeURIComponent(cookie.split('=').slice(1).join('=')) !== 'SCHOOL_SHARED') return;
              const startedAtKey = 'krt_classroom_started_at';
              const now = Date.now();
              const startedAt = Number(sessionStorage.getItem(startedAtKey) || now);
              if (!Number.isFinite(startedAt) || now - startedAt > 12 * 60 * 60 * 1000) {
                sessionStorage.clear();
                sessionStorage.setItem(startedAtKey, String(now));
              } else if (!sessionStorage.getItem(startedAtKey)) {
                sessionStorage.setItem(startedAtKey, String(startedAt));
              }
              Object.defineProperty(window, 'localStorage', { configurable: true, get: () => sessionStorage });
            } catch (_) {}
          })();` }} />
          {/* Top Navigation */}
          <header className="bg-primary-container/40 backdrop-blur-xl fixed top-0 w-full z-[40] shadow-none border-none">
            <div className="flex justify-between items-center px-4 md:px-gutter py-base max-w-7xl mx-auto">
              <div className="flex items-center gap-4 md:gap-8">
                <Link className="flex items-center gap-2 md:gap-3" href="/">
                  <Image
                    alt="Create AI Logo"
                    className="h-8 md:h-10 object-contain"
                    src="/logo2.png"
                    width={160}
                    height={64}
                    priority
                  />
                  <span className="font-display-xl text-2xl md:text-headline-md font-black tracking-tighter text-on-primary-container sr-only">
                    Create AI (科瑞特)
                  </span>
                </Link>
                <div className="hidden md:flex items-center gap-6">
                  <Link className="text-on-primary-container/80 font-medium pb-1 hover:scale-105 transition-transform duration-200" href="/tools/ai-music">AI 音乐</Link>
                  <Link className="text-on-primary-container/80 font-medium pb-1 hover:scale-105 transition-transform duration-200" href="/tools/ai-art">AI 绘画</Link>
                  <Link className="text-on-primary-container/80 font-medium pb-1 hover:scale-105 transition-transform duration-200" href="/tools/ai-programming">AI 编程</Link>
                  <Link className="text-secondary-fixed font-bold border-b-stroke-thick border-secondary-fixed pb-1 hover:scale-105 transition-transform duration-200" href="/tools/ai-reading">AI 阅读</Link>
                  <Link className="text-on-primary-container/80 font-medium pb-1 hover:scale-105 transition-transform duration-200" href="/courses">课程体系</Link>
                </div>
              </div>
              
              <AuthNav />
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full relative z-10 mt-20">
            {children}
          </main>
          <AiTrialConsent />
        </div>
      </body>
    </html>
  );
}
