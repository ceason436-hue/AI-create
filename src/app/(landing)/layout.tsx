import type { Metadata } from "next";
import "../globals.css";
import "../public.css";
import { AiTrialConsent } from "@/components/ai-trial-consent";

export const metadata: Metadata = {
  title: "科瑞特 AI 创造平台",
  description: "科创五育，创智先行。让孩子在真实创造中理解科技。",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="light">
      <body className="landing-body">
        {children}
        <AiTrialConsent />
      </body>
    </html>
  );
}
