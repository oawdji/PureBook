import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * PUT /api/accounts/[id] — 编辑账户
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return apiError("请先登录", 1002, 401);
    }

    const accountId = parseInt(params.id, 10);
    if (isNaN(accountId)) {
      return apiError("无效的账户 ID", 1001);
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      return apiError("账户不存在", 1004, 404);
    }
    if (account.userId !== user.userId) {
      return apiError("无权操作此账户", 1003, 403);
    }

    const { name, type } = await request.json();

    const updateData: Record<string, string> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length > 50) {
        return apiError("账户名称须为 1-50 个字符", 1001);
      }
      updateData.name = name.trim();
    }
    if (type !== undefined) {
      const validTypes = ["cash", "bank", "credit"];
      if (!validTypes.includes(type)) {
        return apiError("账户类型无效", 1001);
      }
      updateData.type = type;
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: updateData,
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
      },
    });

    return apiResponse(
      {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        balance: updated.balance.toString(),
      },
      "更新成功"
    );
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}

/**
 * DELETE /api/accounts/[id] — 删除账户（带迁移）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return apiError("请先登录", 1002, 401);
    }

    const accountId = parseInt(params.id, 10);
    if (isNaN(accountId)) {
      return apiError("无效的账户 ID", 1001);
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      return apiError("账户不存在", 1004, 404);
    }
    if (account.userId !== user.userId) {
      return apiError("无权操作此账户", 1003, 403);
    }

    // 检查是否有关联记录
    const transactionCount = await prisma.transaction.count({
      where: { accountId, userId: user.userId },
    });

    if (transactionCount > 0) {
      // 需要迁移目标
      const migrateToId = parseInt(
        request.nextUrl.searchParams.get("migrateToId") ?? "",
        10
      );
      if (isNaN(migrateToId)) {
        return apiError("该账户下存在收支记录，请指定迁移目标账户", 1001);
      }

      // 至少保留一个账户
      const accountCount = await prisma.account.count({
        where: { userId: user.userId },
      });
      if (accountCount <= 1) {
        return apiError("至少保留一个账户", 1001);
      }

      const targetAccount = await prisma.account.findFirst({
        where: { id: migrateToId, userId: user.userId },
      });
      if (!targetAccount) {
        return apiError("迁移目标账户不存在", 1001);
      }

      // 事务：迁移记录 → 重新计算余额 → 删除账户
      const [migrateResult] = await prisma.$transaction([
        prisma.transaction.updateMany({
          where: { accountId, userId: user.userId },
          data: { accountId: migrateToId },
        }),
        prisma.account.delete({ where: { id: accountId } }),
      ]);

      // 重新计算目标账户余额
      const agg = await prisma.transaction.aggregate({
        where: { accountId: migrateToId, userId: user.userId },
        _sum: { amount: true },
      });
      await prisma.account.update({
        where: { id: migrateToId },
        data: { balance: agg._sum.amount ?? 0 },
      });

      return apiResponse(
        { migratedCount: migrateResult.count },
        `删除成功，${migrateResult.count} 条记录已迁移至「${targetAccount.name}」`
      );
    }

    // 无关联记录直接删除
    const accountCount = await prisma.account.count({
      where: { userId: user.userId },
    });
    if (accountCount <= 1) {
      return apiError("至少保留一个账户", 1001);
    }

    await prisma.account.delete({ where: { id: accountId } });

    return apiResponse(null, "删除成功");
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
