"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  TransactionOutlined,
  TagsOutlined,
  AccountBookOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const menuItems: MenuProps["items"] = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: "仪表盘",
  },
  {
    key: "/transactions",
    icon: <TransactionOutlined />,
    label: "收支记录",
  },
  {
    key: "/categories",
    icon: <TagsOutlined />,
    label: "分类管理",
  },
  {
    key: "/accounts",
    icon: <AccountBookOutlined />,
    label: "账户管理",
  },
  {
    key: "/statistics",
    icon: <BarChartOutlined />,
    label: "统计分析",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick: MenuProps["onClick"] = ({ key }) => {
    router.push(key);
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[pathname === "/" ? "/" : `/${pathname.split("/")[1]}`]}
      items={menuItems}
      onClick={handleClick}
      className="!border-r-0 pt-2"
    />
  );
}
