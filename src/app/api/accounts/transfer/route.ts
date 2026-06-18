import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * POST /api/accounts/transfer — 账户间转账
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return apiError("请先登录", 1002, 401);
    }

    const { fromAccountId, toAccountId, amount, note } =
      await request.json();

    if (!fromAccountId || !toAccountId) {
      return apiError("请指定源账户和目标账户", 1001);
    }
    if (fromAccountId === toAccountId) {
      return apiError("源账户和目标账户不能相同", 1001);
    }
    if (!amount || Number(amount) <= 0) {
      return apiError("转账金额必须大于 0", 1001);
    }

    const transferAmount = new Prisma.Decimal(amount);

    // 验证两个账户都存在且属于当前用户
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({
        where: { id: fromAccountId, userId: user.userId },
      }),
      prisma.account.findFirst({
        where: { id: toAccountId, userId: user.userId },
      }),
    ]);

    if (!fromAccount) {
      return apiError("源账户不存在", 1004, 404);
    }
    if (!toAccount) {
      return apiError("目标账户不存在", 1004, 404);
    }

    // 找到"转账"分类或"其他"分类
    let transferCategory = await prisma.category.findFirst({
      where: { userId: user.userId, name: "转账" },
    });
    if (!transferCategory) {
      transferCategory = await prisma.category.findFirst({
        where: { isPreset: true, name: "其他" },
      });
    }
    if (!transferCategory) {
      return apiError("未找到可用分类", 9999, 500);
    }

    const today = new Date();

    // 交互式事务
    const [fromTx, toTx] = await prisma.$transaction(async (tx) => {
      // 创建源账户支出记录
      const from = await tx.transaction.create({
        data: {
          userId: user.userId,
          accountId: fromAccountId,
          categoryId: transferCategory!.id,
          type: "expense",
          amount: transferAmount,
          note: note ?? `转账至 ${toAccount.name}`,
          transDate: today,
        },
      });

      // 创建目标账户收入记录
      const to = await tx.transaction.create({
        data: {
          userId: user.userId,
          accountId: toAccountId,
          categoryId: transferCategory!.id,
          type: "income",
          amount: transferAmount,
          note: note ?? `来自 ${fromAccount.name} 的转账`,
          transDate: today,
        },
      });

      // 更新源账户余额
      await tx.account.update({
        where: { id: fromAccountId },
        data: {
          balance: { decrement: transferAmount },
        },
      });

      // 更新目标账户余额
      await tx.account.update({
        where: { id: toAccountId },
        data: {
          balance: { increment: transferAmount },
        },
      });

      return [from, to];
    });

    return apiResponse(
      {
        fromTransactionId: fromTx.id,
        toTransactionId: toTx.id,
      },
      "转账成功"
    );
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
