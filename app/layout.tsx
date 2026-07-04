import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HiSelf · 遇见更好的自己",
  description: "Hi, self! 你 + AI 的结合体：对内是第二大脑，对外是比你讲得更清楚的公开分身",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
