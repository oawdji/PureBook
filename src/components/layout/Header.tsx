"use client";

import { Layout, Button, Space, Typography } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WalletOutlined,
} from "@ant-design/icons";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppHeader({ collapsed, onToggle }: AppHeaderProps) {
  return (
    <AntHeader
      className="flex items-center justify-between px-4 !bg-white border-b border-gray-200"
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
    </AntHeader>
  );
}
