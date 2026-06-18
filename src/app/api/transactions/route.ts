import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { verifyAuth } from "@/lib/auth";
import { apiResponse, apiError, paginatedResponse } from "@/lib/utils";

/**
 * GET /api/transactions — 获取收支记录列表（分页 + 筛选）
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return apiError("请先登录", 1002, 401);
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
    );

    // 构建筛选条件
    const where: Prisma.TransactionWhereInput = { userId: user.userId };

    const type = searchParams.get("type");
    if (type === "income" || type === "expense") {
      where.type = type;
    }

    const categoryId = parseInt(searchParams.get("categoryId") ?? "", 10);
    if (!isNaN(categoryId)) {
      where.categoryId = categoryId;
    }

    const accountId = parseInt(searchParams.get("accountId") ?? "", 10);
    if (!isNaN(accountId)) {
      where.accountId = accountId;
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      where.transDate = {};
      if (startDate) where.transDate.gte = new Date(startDate);
      if (endDate) where.transDate.lte = new Date(endDate);
    } else {
      // 默认最近 30 天
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.transDate = { gte: thirtyDaysAgo };
    }

    const keyword = searchParams.get("keyword");
    if (keyword) {
      where.note = { contains: keyword, mode: "insensitive" };
    }

    const minAmount = parseFloat(searchParams.get("minAmount") ?? "");
    const maxAmount = parseFloat(searchParams.get("maxAmount") ?? "");
    if (!isNaN(minAmount) || !isNaN(maxAmount)) {
      where.amount = {};
      if (!isNaN(minAmount)) where.amount.gte = minAmount;
      if (!isNaN(maxAmount)) where.amount.lte = maxAmount;
    }

    // 排序
    const sortBy = searchParams.get("sortBy") ?? "transDate";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [list, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          amount: true,
          note: true,
          transDate: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
          account: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Decimal 转字符串
    const result = list.map((t) => ({
      ...t,
      amount: t.amount.toString(),
      transDate: t.transDate.toISOString().split("T")[0],
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return apiResponse(paginatedResponse(result, total, page, pageSize));
  } catch (e) {
    console.error("GET /api/transactions error:", e);
    return apiError("服务器内部错误", 9999, 500);
  }
}

/**
 * POST /api/transactions — 创建收支记录
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return apiError("请先登录", 1002, 401);
    }

    const { type, amount, categoryId, accountId, transDate, note } =
      await request.json();

    // 参数校验
    if (type !== "income" && type !== "expense") {
      return apiError("类型须为 income 或 expense", 1001);
    }
    if (!amount || Number(amount) <= 0) {
      return apiError("金额必须大于 0", 1001);
    }
    if (!categoryId) {
      return apiError("请选择分类", 1001);
    }
    if (!accountId) {
      return apiError("请选择账户", 1001);
    }
    if (!transDate) {
      return apiError("请选择日期", 1001);
    }
    if (note && note.length > 200) {
      return apiError("备注最长 200 字符", 1001);
    }

    const transactionAmount = new Prisma.Decimal(amount);
    const dateStr =
      typeof transDate === "string" ? transDate.split("T")[0] : transDate;
    const dateObj = new Date(dateStr);

    // 验证：日期不能是未来
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj > today) {
      return apiError("交易日期不能是未来日期", 1001);
    }

    // 验证账户和分类存在
    const [account, category] = await Promise.all([
      prisma.account.findFirst({
        where: { id: accountId, userId: user.userId },
      }),
      prisma.category.findFirst({
        where: {
          id: categoryId,
          OR: [{ isPreset: true }, { userId: user.userId }],
        },
      }),
    ]);

    if (!account) {
      return apiError("账户不存在", 1001);
    }
    if (!category) {
      return apiError("分类不存在", 1001);
    }

    // 事务：创建记录 + 更新余额
    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          userId: user.userId,
          accountId,
          categoryId,
          type,
          amount: transactionAmount,
          transDate: dateObj,
          note: note ?? null,
        },
      });

      // 更新账户余额
      const balanceChange =
        type === "income"
          ? { increment: transactionAmount }
          : { decrement: transactionAmount };
      await tx.account.update({
        where: { id: accountId },
        data: { balance: balanceChange },
      });

      return t;
    });

    // 清除相关缓存
    const cacheKeys = await redis.keys(`cache:statistics:*:${user.userId}`);
    if (cacheKeys.length > 0) {
      await redis.del(...cacheKeys);
    }

    return apiResponse(
      {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount.toString(),
        categoryId: transaction.categoryId,
        accountId: transaction.accountId,
        transDate: transaction.transDate.toISOString().split("T")[0],
        note: transaction.note,
        createdAt: transaction.createdAt.toISOString(),
      },
      "创建成功"
    );
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
