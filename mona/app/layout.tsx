import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 语音管家",
  description: "任务与执行力助手",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col`}>
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
            <Link href="/" className="text-base sm:text-lg font-semibold tracking-tight">AI 语音管家</Link>
            <nav className="flex items-center gap-2">
              <Link href="/" className="text-sm font-medium py-2 px-3 rounded-md hover:bg-muted transition-colors">今日概览</Link>
              <Link href="/tasks" className="text-sm font-medium py-2 px-3 rounded-md hover:bg-muted transition-colors">任务管理</Link>
              <Link href="/analytics" className="text-sm font-medium py-2 px-3 rounded-md hover:bg-muted transition-colors">数据分析</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
