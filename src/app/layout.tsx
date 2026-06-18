import type { Metadata } from "next";
import localFont from "next/font/local";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PureBook — 个人记账",
  description: "简单优雅的个人财务管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 简单的路由保护：非登录页需要检查 cookie
  // 注意：这是客户端保护的基础层，真正的鉴权在 API 层
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} antialiased`}>
        <AntdRegistry>
          <AppLayout>{children}</AppLayout>
        </AntdRegistry>
      </body>
    </html>
  );
}
