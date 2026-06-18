"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Row, Col, Card, Typography } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import StatCard from "@/components/dashboard/StatCard";
import MiniTrendChart from "@/components/chart/MiniTrendChart";
import Skeleton from "@/components/ui/Skeleton";
import type { TrendData, MonthlyStats } from "@/types";

const { Title } = Typography;

export default function DashboardPage() {
  const router = useRouter();
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [monthStats, setMonthStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    // 检查登录状态并拉取数据
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    Promise.all([
      fetch(`/api/statistics/monthly?month=${currentMonth}`).then((r) =>
        r.json()
      ),
      fetch("/api/statistics/trend").then((r) => r.json()),
    ])
      .then(([monthlyData, trendData]) => {
        if (monthlyData.code === 0) setMonthStats(monthlyData.data);
        else if (monthlyData.code === 1002) {
          // 未登录
          router.push("/login");
          return;
        }
        if (trendData.code === 0) setTrend(trendData.data);
      })
      .catch(() => {
        // 如果 API 不可用，尝试跳转登录
        if (!document.cookie.includes("token=")) {
          router.push("/login");
        }
      })
      .finally(() => {
        setAuthChecking(false);
        setLoading(false);
      });
  }, [router]);

  if (authChecking) {
    return (
      <div className="p-8">
        <Skeleton loading rows={6} />
      </div>
    );
  }

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Title level={4} className="!mb-6">
        {currentMonth} 收支概览
      </Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={8}>
          <StatCard
            title="本月收入"
            value={parseFloat(monthStats?.totalIncome ?? "0")}
            icon={<ArrowUpOutlined />}
            color="#52c41a"
            bgColor="#f6ffed"
            delay={0}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="本月支出"
            value={parseFloat(monthStats?.totalExpense ?? "0")}
            icon={<ArrowDownOutlined />}
            color="#ff4d4f"
            bgColor="#fff2f0"
            delay={0.1}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="本月结余"
            value={parseFloat(monthStats?.balance ?? "0")}
            icon={<WalletOutlined />}
            color="#1677ff"
            bgColor="#e6f4ff"
            delay={0.2}
          />
        </Col>
      </Row>

      {/* 趋势图 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="!border-0 !shadow-sm" title="近 6 月收支趋势">
          <MiniTrendChart data={trend?.months ?? []} loading={loading} />
        </Card>
      </motion.div>
    </motion.div>
  );
}
