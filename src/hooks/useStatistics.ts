"use client";

import { useState, useEffect, useCallback } from "react";
import type { MonthlyStats, TrendData } from "@/types";

export function useMonthlyStats(month: string) {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/statistics/monthly?month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 0) setStats(data.data);
      })
      .finally(() => setLoading(false));
  }, [month]);

  return { stats, loading };
}

export function useTrend() {
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrend = useCallback(() => {
    setLoading(true);
    fetch("/api/statistics/trend")
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 0) setTrend(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  return { trend, loading, refresh: fetchTrend };
}
