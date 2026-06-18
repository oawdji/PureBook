import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { verifyAuth } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/transactions/[id] — 获取单条记录详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) return apiError("请先登录", 1002, 401);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) return apiError("无效的记录 ID", 1001);

    const transaction = await prisma.transaction.findUnique({
      where: { id },
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
        account: { select: { id: true, name: true } },
      },
    });

    if (!transaction || transaction.id !== id) {
      // 校验归属（通过 userId 在查询中已隐含，但为了安全再检查）
      const belongs = await prisma.transaction.findFirst({
        where: { id, userId: user.userId },
      });
      if (!belongs) return apiError("记录不存在", 1004, 404);
    }

    return apiResponse({
      ...transaction,
      amount: transaction!.amount.toString(),
      transDate: transaction!.transDate.toISOString().split("T")[0],
      createdAt: transaction!.createdAt.toISOString(),
      updatedAt: transaction!.updatedAt.toISOString(),
    });
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}

/**
 * PUT /api/transactions/[id] — 更新收支记录
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) return apiError("请先登录", 1002, 401);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) return apiError("无效的记录 ID", 1001);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.userId },
      include: { account: true, category: true },
    });
    if (!existing) return apiError("记录不存在", 1004, 404);

    const { type, amount, categoryId, accountId, transDate, note } =
      await request.json();

    if (note && note.length > 200) {
      return apiError("备注最长 200 字符", 1001);
    }

    const newAmount = amount ? new Prisma.Decimal(amount) : undefined;
    const newType = type ?? existing.type;
    const newAccountId = accountId ?? existing.accountId;
    const newDate = transDate ? new Date(transDate.split("T")[0]) : undefined;

    // 验证新账户和分类
    if (accountId && accountId !== existing.accountId) {
      const newAccount = await prisma.account.findFirst({
        where: { id: accountId, userId: user.userId },
      });
      if (!newAccount) return apiError("账户不存在", 1001);
    }
    if (categoryId) {
      const newCategory = await prisma.category.findFirst({
        where: {
          id: categoryId,
          OR: [{ isPreset: true }, { userId: user.userId }],
        },
      });
      if (!newCategory) return apiError("分类不存在", 1001);
    }

    await prisma.$transaction(async (tx) => {
      // 1. 回滚旧余额（将旧记录的影响撤销）
      const oldEffect =
        existing.type === "income"
          ? { decrement: existing.amount }
          : { increment: existing.amount };
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: oldEffect },
      });

      // 2. 如果账户变了，新账户也要处理
      if (accountId && accountId !== existing.accountId) {
        const newEffect =
          newType === "income"
            ? { increment: newAmount ?? existing.amount }
            : { decrement: newAmount ?? existing.amount };
        await tx.account.update({
          where: { id: newAccountId },
          data: { balance: newEffect },
        });
      } else {
        // 同一账户，应用新效果
        const newEffect =
          newType === "income"
            ? { increment: newAmount ?? existing.amount }
            : { decrement: newAmount ?? existing.amount };
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balance: newEffect },
        });
      }

      // 3. 更新记录
      await tx.transaction.update({
        where: { id },
        data: {
          ...(type && { type }),
          ...(newAmount && { amount: newAmount }),
          ...(categoryId && { categoryId }),
          ...(accountId && { accountId: newAccountId }),
          ...(newDate && { transDate: newDate }),
          ...(note !== undefined && { note }),
        },
      });
    });

    // 清除缓存
    const cacheKeys = await redis.keys(`cache:statistics:*:${user.userId}`);
    if (cacheKeys.length > 0) await redis.del(...cacheKeys);

    // 返回更新后的记录
    const updated = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        amount: true,
        note: true,
        transDate: true,
        updatedAt: true,
      },
    });

    return apiResponse(
      {
        ...updated,
        amount: updated!.amount.toString(),
        transDate: updated!.transDate.toISOString().split("T")[0],
        updatedAt: updated!.updatedAt.toISOString(),
      },
      "更新成功"
    );
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}

/**
 * DELETE /api/transactions/[id] — 删除收支记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) return apiError("请先登录", 1002, 401);

    const id = parseInt(params.id, 10);
    if (isNaN(id)) return apiError("无效的记录 ID", 1001);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) return apiError("记录不存在", 1004, 404);

    await prisma.$transaction(async (tx) => {
      // 回滚余额
      const reverseEffect =
        existing.type === "income"
          ? { decrement: existing.amount }
          : { increment: existing.amount };
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: reverseEffect },
      });

      // 删除记录
      await tx.transaction.delete({ where: { id } });
    });

    // 清除缓存
    const cacheKeys = await redis.keys(`cache:statistics:*:${user.userId}`);
    if (cacheKeys.length > 0) await redis.del(...cacheKeys);

    return apiResponse(null, "删除成功");
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
