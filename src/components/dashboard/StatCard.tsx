"use client";

import { Card, Typography } from "antd";
import { motion } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import type { ReactNode } from "react";

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  delay?: number;
}

export default function StatCard({
  title,
  value,
  prefix = "¥",
  icon,
  color,
  bgColor,
  delay = 0,
}: StatCardProps) {
  const springProps = useSpring({
    number: value,
    from: { number: 0 },
    config: { mass: 1, tension: 80, friction: 20 },
    delay: delay * 1000,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Card
        className="!border-0 !shadow-sm hover:!shadow-md transition-shadow duration-150"
        styles={{ body: { padding: "24px" } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <Text type="secondary" className="text-sm">
              {title}
            </Text>
            <div className="mt-2">
              <animated.span className="text-3xl font-bold">
                {springProps.number.to((n) => `${prefix}${n.toFixed(2)}`)}
              </animated.span>
            </div>
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: bgColor, color }}
          >
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
