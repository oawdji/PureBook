import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { verifyAuth } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";

const CACHE_KEY_CATEGORIES = "categories:list";

/**
 * PUT /api/categories/[id] — 编辑分类
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

    const categoryId = parseInt(params.id, 10);
    if (isNaN(categoryId)) {
      return apiError("无效的分类 ID", 1001);
    }

    // 查找分类
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return apiError("分类不存在", 1004, 404);
    }

    // 只能编辑自己的分类或系统预设分类
    if (category.userId !== null && category.userId !== user.userId) {
      return apiError("无权编辑此分类", 1003, 403);
    }

    const { name, color } = await request.json();

    const updateData: Record<string, string> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length > 30) {
        return apiError("分类名称须为 1-30 个字符", 1001);
      }
      updateData.name = name.trim();
      // 图标自动设为名称首字
      updateData.icon = name.trim().charAt(0);
    }
    if (color !== undefined) updateData.color = color;

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        isPreset: true,
      },
    });

    // 失效缓存
    await redis.del(`${CACHE_KEY_CATEGORIES}:${user.userId}`);

    return apiResponse(updated, "更新成功");
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}

/**
 * DELETE /api/categories/[id] — 删除分类（带迁移）
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

    const categoryId = parseInt(params.id, 10);
    if (isNaN(categoryId)) {
      return apiError("无效的分类 ID", 1001);
    }

    // 查找分类
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return apiError("分类不存在", 1004, 404);
    }

    // 只能删除自己的分类或系统预设分类
    if (category.userId !== null && category.userId !== user.userId) {
      return apiError("无权删除此分类", 1003, 403);
    }

    // 获取迁移目标分类 ID
    const migrateToId = parseInt(
      request.nextUrl.searchParams.get("migrateToId") ?? "",
      10
    );
    if (isNaN(migrateToId)) {
      return apiError("请指定迁移目标分类", 1001);
    }

    // 验证目标分类存在
    const targetCategory = await prisma.category.findFirst({
      where: {
        id: migrateToId,
        OR: [{ isPreset: true }, { userId: user.userId }],
      },
    });
    if (!targetCategory) {
      return apiError("迁移目标分类不存在", 1001);
    }

    // 事务：迁移记录 → 删除分类
    const [migrateResult] = await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { categoryId, userId: user.userId },
        data: { categoryId: migrateToId },
      }),
      prisma.category.delete({ where: { id: categoryId } }),
    ]);

    const migratedCount = migrateResult.count;

    // 失效缓存
    await redis.del(`${CACHE_KEY_CATEGORIES}:${user.userId}`);

    return apiResponse(
      { migratedCount },
      migratedCount > 0
        ? `删除成功，${migratedCount} 条记录已迁移至「${targetCategory.name}」`
        : `删除成功`
    );
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
