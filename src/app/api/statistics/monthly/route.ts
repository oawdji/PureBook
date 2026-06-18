import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { verifyAuth } from "@/lib/auth";
import { apiResponse, apiError, formatMonth } from "@/lib/utils";

/**
 * GET /api/statistics/monthly — 月度统计概览
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return apiError("请先登录", 1002, 401);

    const monthParam =
      request.nextUrl.searchParams.get("month") ?? formatMonth(new Date());

    // 解析月份
    const [year, month] = monthParam.split("-").map(Number);
    if (!year || !month || month < 1 || month > 12) {
      return apiError("无效的月份格式，须为 YYYY-MM", 1001);
    }

    // 缓存键
    const cacheKey = `cache:statistics:monthly:${monthParam}:${user.userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return apiResponse(JSON.parse(cached));
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 并行查询
    const [incomeAgg, expenseAgg, categoryBreakdown, dailySummary] =
      await Promise.all([
        // 总收入
        prisma.transaction.aggregate({
          where: {
            userId: user.userId,
            type: "income",
            transDate: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        // 总支出
        prisma.transaction.aggregate({
          where: {
            userId: user.userId,
            type: "expense",
            transDate: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        // 分类明细（仅支出）
        prisma.transaction.groupBy({
          by: ["categoryId"],
          where: {
            userId: user.userId,
            type: "expense",
            transDate: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
          _count: true,
          orderBy: { _sum: { amount: "desc" } },
        }),
        // 每日明细
        prisma.$queryRaw<
          { date: string; income: number; expense: number }[]
        >`
          SELECT
            "trans_date"::text AS date,
            COALESCE(SUM(CASE WHEN "type" = 'income' THEN "amount" ELSE 0 END), 0) AS income,
            COALESCE(SUM(CASE WHEN "type" = 'expense' THEN "amount" ELSE 0 END), 0) AS expense
          FROM "transactions"
          WHERE "user_id" = ${user.userId}
            AND "trans_date" >= ${startDate}::date
            AND "trans_date" <= ${endDate}::date
          GROUP BY "trans_date"
          ORDER BY "trans_date" ASC
        `,
      ]);

    const totalIncome = incomeAgg._sum.amount?.toString() ?? "0";
    const totalExpense = expenseAgg._sum.amount?.toString() ?? "0";
    const totalExpenseNum = parseFloat(totalExpense);

    // 获取分类信息
    const categoryIds = categoryBreakdown.map((c) => c.categoryId);
    const categories =
      categoryIds.length > 0
        ? await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, icon: true, color: true },
          })
        : [];
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // 构建分类明细
    const breakdown = categoryBreakdown.map((c) => {
      const cat = categoryMap.get(c.categoryId);
      const amount = c._sum.amount?.toString() ?? "0";
      return {
        categoryId: c.categoryId,
        categoryName: cat?.name ?? "未知",
        categoryIcon: cat?.icon ?? "QuestionOutlined",
        categoryColor: cat?.color ?? "#95A5A6",
        amount,
        percentage:
          totalExpenseNum > 0
            ? Math.round((parseFloat(amount) / totalExpenseNum) * 1000) / 10
            : 0,
        count: c._count,
      };
    });

    const result = {
      month: monthParam,
      totalIncome,
      totalExpense,
      balance: (
        parseFloat(totalIncome) - parseFloat(totalExpense)
      ).toFixed(2),
      categoryBreakdown: breakdown,
      dailySummary: dailySummary.map((d) => ({
        ...d,
        income: Number(d.income).toFixed(2),
        expense: Number(d.expense).toFixed(2),
      })),
    };

    // 缓存 5 分钟
    await redis.set(cacheKey, JSON.stringify(result), "EX", 300);

    return apiResponse(result);
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
