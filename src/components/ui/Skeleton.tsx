"use client";

import { Skeleton as AntSkeleton, Card } from "antd";

interface SkeletonProps {
  loading?: boolean;
  rows?: number;
}

export default function Skeleton({ loading = true, rows = 4 }: SkeletonProps) {
  if (!loading) return null;

  return (
    <Card className="!border-0 !shadow-sm">
      <AntSkeleton active paragraph={{ rows }} />
    </Card>
  );
}
