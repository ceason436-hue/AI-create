import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "运营后台 | 科瑞特 AI",
  description: "科瑞特 AI 平台运营管理后台",
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
