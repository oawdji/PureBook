"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Layout, ConfigProvider, App } from "antd";
import zhCN from "antd/locale/zh_CN";
import { lightTheme } from "@/theme";
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

  // 登录页不显示布局骨架
  if (isLoginPage) {
    return (
      <ConfigProvider locale={zhCN} theme={lightTheme}>
        <App>{children}</App>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={zhCN} theme={lightTheme}>
      <App>
        <Layout className="min-h-screen">
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            breakpoint="lg"
            className="!bg-white border-r border-gray-200"
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
            />
            <Content className="m-6 p-6 bg-gray-50 rounded-xl min-h-[calc(100vh-120px)]">
              {children}
            </Content>
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
}
