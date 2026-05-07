import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "科瑞特AI (Create AI) Innovation Training",
  description: "激发未来创造力，融合AI机器人与青少年科技教育的前沿阵地。",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background font-body-lg antialiased selection:bg-secondary-fixed selection:text-black">
        {children}
      </body>
    </html>
  );
}
