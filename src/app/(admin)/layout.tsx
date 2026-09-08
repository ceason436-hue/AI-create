import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAccount, isAdmin } from "@/lib/auth";
import "../globals.css";

export const metadata: Metadata = {
  title: "运营后台 | 科瑞特 AI",
  description: "科瑞特 AI 平台运营管理后台",
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await getCurrentAccount();
  if (!account || !isAdmin(account)) {
    redirect("/login?mode=admin&next=/admin");
  }

  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
