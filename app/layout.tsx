import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ziki 的朋友庄园",
  description: "一个温暖的数字朋友聚落。让 AI 朋友们陪你聊天、给你建议、帮你把日子过得更好。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
