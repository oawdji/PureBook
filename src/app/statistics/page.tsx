"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Row,
  Col,
  DatePicker,
  Skeleton as AntSkeleton,
} from "antd";
import { motion } from "framer-motion";
import PieChartCard from "@/components/chart/PieChartCard";
import BarChartCard from "@/components/chart/BarChartCard";
import { useTrend } from "@/hooks/useStatistics";
import type { MonthlyStats } from "@/types";

const { Title } = Typography;

export default function StatisticsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { trend, loading: trendLoading } = useTrend();

  const fetchMonthlyStats = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/statistics/monthly?month=${selectedMonth}`);
    const data = await res.json();
    if (data.code === 0) setStats(data.data);
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchMonthlyStats();
  }, [fetchMonthlyStats]);

  // 构建饼图数据
  const pieData = (stats?.categoryBreakdown ?? []).map((item) => ({
    name: item.categoryName,
    value: parseFloat(item.amount),
    color: item.categoryColor,
  }));

  const handlePieClick = () => {
    // 钻取到记录列表（携带分类参数）
    window.location.href = `/transactions`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!mb-0">统计分析</Title>
        <DatePicker
          picker="month"
          onChange={(date) => {
            if (date) {
              setSelectedMonth(date.format("YYYY-MM"));
            }
          }}
          placeholder="选择月份"
        />
      </div>

      {/* 汇总数字 */}
      {loading ? (
        <AntSkeleton active paragraph={{ rows: 1 }} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <Row gutter={[16, 16]}>
            <Col xs={8}>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-gray-500 text-sm">
                  本月收入
                </div>
                <div className="text-xl font-bold text-green-500 mt-1">
                  ¥{parseFloat(stats?.totalIncome ?? "0").toFixed(2)}
                </div>
              </div>
            </Col>
            <Col xs={8}>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="text-gray-500 text-sm">
                  本月支出
                </div>
                <div className="text-xl font-bold text-red-500 mt-1">
                  ¥{parseFloat(stats?.totalExpense ?? "0").toFixed(2)}
                </div>
              </div>
            </Col>
            <Col xs={8}>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-gray-500 text-sm">
                  本月结余
                </div>
                <div className="text-xl font-bold text-blue-500 mt-1">
                  ¥{parseFloat(stats?.balance ?? "0").toFixed(2)}
                </div>
              </div>
            </Col>
          </Row>
        </motion.div>
      )}

      <Row gutter={[16, 16]}>
        {/* 饼图 */}
        <Col xs={24} lg={12}>
          <PieChartCard
            title="支出分类占比"
            data={pieData}
            loading={loading}
            onCellClick={handlePieClick}
          />
        </Col>

        {/* 柱状图 */}
        <Col xs={24} lg={12}>
          <BarChartCard
            title="近 6 月收支趋势"
            data={trend?.months ?? []}
            loading={trendLoading}
          />
        </Col>
      </Row>
    </motion.div>
  );
}
