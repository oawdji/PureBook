import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { apiError } from "@/lib/utils";

/**
 * GET /api/transactions/export — 导出 CSV
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return apiError("请先登录", 1002, 401);

    const { searchParams } = request.nextUrl;

    // 解析日期范围，默认本月
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date();

    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : defaultStart;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : defaultEnd;
    const type = searchParams.get("type");

    // 查询记录
    const where: Record<string, unknown> = {
      userId: user.userId,
      transDate: { gte: startDate, lte: endDate },
    };
    if (type === "income" || type === "expense") {
      where.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { transDate: "desc" },
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } },
      },
    });

    // 构建 CSV（UTF-8 BOM 确保 Excel 兼容中文）
    const BOM = "﻿";
    const headers = ["类型", "金额", "分类", "账户", "日期", "备注"];
    const typeLabels: Record<string, string> = { income: "收入", expense: "支出" };

    const rows = transactions.map((t) =>
      [
        typeLabels[t.type] ?? t.type,
        t.amount.toString(),
        t.category.name,
        t.account.name,
        t.transDate.toISOString().split("T")[0],
        `"${(t.note ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    );

    const csv = BOM + headers.join(",") + "\n" + rows.join("\n");

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];
    const filename = `PureBook_${startStr}_${endStr}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
