"use client";

import { Layout, Button, Space, Typography, Switch } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WalletOutlined,
  BulbOutlined,
} from "@ant-design/icons";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export default function AppHeader({
  collapsed,
  onToggle,
  isDark,
  onThemeToggle,
}: AppHeaderProps) {
  return (
    <AntHeader
      className="flex items-center justify-between px-4 !bg-white dark:!bg-gray-900 border-b border-gray-200 dark:border-gray-700"
      style={{ padding: "0 24px" }}
    >
      <Space>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          className="text-lg"
        />
        <Space className="ml-2">
          <WalletOutlined className="text-xl text-blue-500" />
          <Text strong className="text-lg">
            PureBook
          </Text>
        </Space>
      </Space>

      <Space>
        <BulbOutlined
          className={isDark ? "text-yellow-400" : "text-gray-400"}
        />
        <Switch
          checked={isDark}
          onChange={onThemeToggle}
          checkedChildren="🌙"
          unCheckedChildren="☀️"
        />
      </Space>
    </AntHeader>
  );
}
