"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Layout, ConfigProvider, theme, App } from "antd";
import zhCN from "antd/locale/zh_CN";
import { lightTheme, darkTheme } from "@/theme";
import AppHeader from "./Header";
import Sidebar from "./Sidebar";

const { Sider, Content } = Layout;

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 从 localStorage 恢复主题偏好
  useEffect(() => {
    const saved = localStorage.getItem("purebook-theme");
    if (saved === "dark") {
      setIsDark(true);
    } else if (saved === "light") {
      setIsDark(false);
    } else {
      // 跟随系统
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // 切换主题
  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("purebook-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  // 登录页不显示布局骨架
  if (isLoginPage) {
    return (
      <ConfigProvider
        locale={zhCN}
        theme={{
          ...lightTheme,
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        ...(isDark ? darkTheme : lightTheme),
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <App>
        <Layout className="min-h-screen">
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            breakpoint="lg"
            className="!bg-white dark:!bg-gray-900 border-r border-gray-200 dark:border-gray-700"
          >
            <div className="h-16 flex items-center justify-center">
              <span className="text-xl font-bold text-blue-500">
                {collapsed ? "PB" : "PureBook"}
              </span>
            </div>
            <Sidebar />
          </Sider>

          <Layout>
            <AppHeader
              collapsed={collapsed}
              onToggle={() => setCollapsed(!collapsed)}
              isDark={isDark}
              onThemeToggle={toggleTheme}
            />
            <Content className="m-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl min-h-[calc(100vh-120px)]">
              {children}
            </Content>
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
}
