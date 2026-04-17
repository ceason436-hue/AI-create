import type { Metadata } from "next";
import "./globals.css";
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
      <body>
        <div className="min-h-screen flex flex-col overflow-x-hidden">
          {/* Top Navigation */}
          <header className="h-20 bg-white/80 backdrop-blur-sm shadow-sm border-b-4 border-macaron-pink flex items-center justify-between px-8 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-macaron-pink rounded-full flex items-center justify-center shadow-inner">
                <Music className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-pink-500 tracking-wide drop-shadow-sm">
                AI音乐魔法学院 🎶
              </h1>
            </div>
            
            <nav className="flex gap-4">
              <Link href="/" className="btn-bouncy flex items-center gap-2 px-6 py-3 bg-macaron-blue text-teal-800 rounded-full font-bold shadow-sm border-2 border-teal-200">
                <Home className="w-5 h-5" />
                首页
              </Link>
              <Link href="/stage1" className="btn-bouncy flex items-center gap-2 px-6 py-3 bg-macaron-yellow text-orange-800 rounded-full font-bold shadow-sm border-2 border-orange-200">
                <Star className="w-5 h-5 text-orange-500" />
                启蒙入门篇
              </Link>
            </nav>
            
            <div className="flex items-center gap-3">
              {/* Magic Energy Bar Placeholder */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-gray-500">魔法能量 ⚡</span>
                <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-inner">
                  <div className="w-1/3 h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full"></div>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center border-2 border-purple-300 shadow-sm overflow-hidden">
                👦
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full relative z-10">
            {children}
          </main>

          {/* Floating Mascot Sprite */}
          <div className="fixed bottom-8 right-8 z-50 animate-[bounce-sm_3s_infinite]">
            <div className="relative group cursor-pointer">
              {/* Speech Bubble */}
              <div className="absolute -top-16 -left-20 bg-white p-3 rounded-2xl rounded-br-none shadow-lg border-2 border-blue-200 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p className="text-sm font-bold text-blue-800">你好呀！我是音乐小精灵，需要帮忙吗？✨</p>
              </div>
              {/* Sprite Body */}
              <div className="w-24 h-24 bg-macaron-blue rounded-full shadow-xl border-4 border-white flex flex-col items-center justify-center overflow-hidden transform group-hover:scale-110 transition-transform duration-300">
                <div className="text-4xl">🧚‍♂️</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}