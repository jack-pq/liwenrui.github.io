import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { ToastProvider } from "@/components/Toast";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import "./globals.css";

export const metadata: Metadata = {
  title: "日常集 · 生活工作台",
  description: "记账、习惯、健身、日程、清单、收藏——一站式生活工作台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <ToastProvider>
          <a href="#main-content" className="skip-link">
            跳到主要内容
          </a>
          <div className="flex min-h-screen">
            <Nav />
            <main id="main-content" className="flex-1 min-w-0 pb-20 md:pb-0" tabIndex={-1}>
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10">
                {children}
              </div>
            </main>
          </div>
          <AccessibilityPanel />
        </ToastProvider>
      </body>
    </html>
  );
}
