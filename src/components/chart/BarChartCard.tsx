"use client";

import { Card } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

interface BarChartCardProps {
  title: string;
  data: { month: string; income: string; expense: string }[];
  loading?: boolean;
}

export default function BarChartCard({
  title,
  data,
  loading,
}: BarChartCardProps) {
  if (!data || data.length === 0) {
    return (
      <Card title={title} className="!border-0 !shadow-sm">
        <div className="text-center text-gray-400 py-10">暂无数据</div>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    month: item.month.slice(5),
    income: parseFloat(item.income),
    expense: parseFloat(item.expense),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card title={title} loading={loading} className="!border-0 !shadow-sm">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value) =>
                `¥${Number(value ?? 0).toFixed(2)}`
              }
            />
            <Legend />
            <Bar
              dataKey="income"
              name="收入"
              fill="#52c41a"
              radius={[4, 4, 0, 0]}
              animationBegin={0}
              animationDuration={600}
            />
            <Bar
              dataKey="expense"
              name="支出"
              fill="#ff4d4f"
              radius={[4, 4, 0, 0]}
              animationBegin={200}
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </motion.div>
  );
}
