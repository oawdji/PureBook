"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "antd";

interface MiniTrendChartProps {
  data: { month: string; income: string; expense: string }[];
  loading?: boolean;
}

export default function MiniTrendChart({ data, loading }: MiniTrendChartProps) {
  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  if (!data || data.length === 0) return null;

  const chartData = data.map((item) => ({
    month: item.month.slice(5),
    income: parseFloat(item.income),
    expense: parseFloat(item.expense),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <Tooltip
            formatter={(value) => `¥${Number(value ?? 0).toFixed(2)}`}
            labelStyle={{ color: "#666" }}
          />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#52c41a"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ff4d4f"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
