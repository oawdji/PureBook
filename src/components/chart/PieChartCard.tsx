"use client";

import { Card } from "antd";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

interface PieChartCardProps {
  title: string;
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  loading?: boolean;
  onCellClick?: (name: string) => void;
}

export default function PieChartCard({
  title,
  data,
  loading,
  onCellClick,
}: PieChartCardProps) {
  if (!data || data.length === 0) {
    return (
      <Card title={title} className="!border-0 !shadow-sm">
        <div className="text-center text-gray-400 py-10">暂无数据</div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card title={title} loading={loading} className="!border-0 !shadow-sm">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              onClick={(entry) => entry.name && onCellClick?.(entry.name)}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `¥${Number(value ?? 0).toFixed(2)}`}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* 图例 */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-1 text-sm">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 dark:text-gray-300">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
