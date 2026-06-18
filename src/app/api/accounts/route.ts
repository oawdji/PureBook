import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { apiResponse, apiError, formatDate } from "@/lib/utils";

/**
 * GET /api/accounts — 获取所有账户及其余额
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return apiError("请先登录", 1002, 401);
    }

    const accounts = await prisma.account.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        createdAt: true,
      },
    });

    // 余额为 Decimal 类型，转为字符串
    const result = accounts.map((a) => ({
      ...a,
      balance: a.balance.toString(),
      createdAt: formatDate(a.createdAt),
    }));

    return apiResponse(result);
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}

/**
 * POST /api/accounts — 创建账户
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return apiError("请先登录", 1002, 401);
    }

    const { name, type, initialBalance } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length > 50) {
      return apiError("账户名称须为 1-50 个字符", 1001);
    }
    const validTypes = ["cash", "bank", "credit"];
    if (!validTypes.includes(type)) {
      return apiError("账户类型无效，可选：cash / bank / credit", 1001);
    }

    const balance = initialBalance ? Number(initialBalance) : 0;

    // 事务：创建账户 + 如果有初始余额则创建初始收入记录
    const account = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.create({
        data: {
          userId: user.userId,
          name: name.trim(),
          type,
          balance,
        },
      });

      if (balance > 0) {
        // 找到"其他"分类作为默认
        const defaultCategory = await tx.category.findFirst({
          where: { name: "其他", isPreset: true },
        });

        if (defaultCategory) {
          await tx.transaction.create({
            data: {
              userId: user.userId,
              accountId: acc.id,
              categoryId: defaultCategory.id,
              type: "income",
              amount: balance,
              transDate: new Date(),
              note: "初始余额",
            },
          });
        }
      }

      return acc;
    });

    return apiResponse(
      {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
      },
      "创建成功"
    );
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
