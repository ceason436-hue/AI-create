import type { Metadata } from "next";
import "../globals.css";
import { Music, Star, Home, Play } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI音乐创作魔法学院",
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
          {/* Top Navigation */}
          <header className="bg-primary-container/40 backdrop-blur-xl fixed top-0 w-full z-50 shadow-none border-none">
            <div className="flex justify-between items-center px-4 md:px-gutter py-base max-w-7xl mx-auto">
              <div className="flex items-center gap-4 md:gap-8">
                <Link className="flex items-center gap-2 md:gap-3" href="/">
                  <img
                    alt="Create AI Logo"
                    className="h-8 md:h-10 object-contain"
                    src="/logo2.png"
                  />
                  <span className="font-display-xl text-2xl md:text-headline-md font-black tracking-tighter text-on-primary-container sr-only">
                    Create AI (科瑞特)
                  </span>
                </Link>
                <div className="hidden md:flex items-center gap-6">
                  <Link className="text-secondary-fixed font-bold border-b-stroke-thick border-secondary-fixed pb-1 hover:scale-105 transition-transform duration-200" href="/ai-music">AI 音乐</Link>
                  <Link className="text-on-primary-container/80 font-medium pb-1 hover:scale-105 transition-transform duration-200" href="#">课程培训</Link>
                </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4">
                <button className="hidden sm:block px-4 py-2 md:px-6 md:py-3 font-label-bold text-sm md:text-label-bold text-on-primary-container brutalist-border-white rounded-full hover:bg-white/10 transition-colors">
                  登录
                </button>
                <button className="px-4 py-2 md:px-6 md:py-3 font-label-bold text-sm md:text-label-bold bg-secondary-fixed text-black brutalist-border rounded-full brutalist-shadow-blue hover:-translate-y-1 hover:translate-x-1 transition-all">
                  注册
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full relative z-10 mt-20">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}