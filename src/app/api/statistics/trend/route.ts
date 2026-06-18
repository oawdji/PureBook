import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { verifyAuth } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/statistics/trend — 近 6 月收支趋势
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return apiError("请先登录", 1002, 401);

    const cacheKey = `cache:statistics:trend:${user.userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return apiResponse(JSON.parse(cached));
    }

    // 生成最近 6 个月的列表
    const months: { month: string; startDate: Date; endDate: Date }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const y = now.getFullYear();
      const m = now.getMonth() - i;
      const startDate = new Date(y, m, 1);
      const endDate = new Date(y, m + 1, 0);
      const monthStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
      months.push({ month: monthStr, startDate, endDate });
    }

    // 逐月查询
    const result = await Promise.all(
      months.map(async ({ month, startDate, endDate }) => {
        const [incomeAgg, expenseAgg] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId: user.userId,
              type: "income",
              transDate: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId: user.userId,
              type: "expense",
              transDate: { gte: startDate, lte: endDate },
            },
            _sum: { amount: true },
          }),
        ]);

        const income = incomeAgg._sum.amount?.toString() ?? "0";
        const expense = expenseAgg._sum.amount?.toString() ?? "0";
        const balance = (parseFloat(income) - parseFloat(expense)).toFixed(2);

        return { month, income, expense, balance };
      })
    );

    const data = { months: result };

    // 缓存 5 分钟
    await redis.set(cacheKey, JSON.stringify(data), "EX", 300);

    return apiResponse(data);
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
