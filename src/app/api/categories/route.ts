import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { verifyAuth } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";

const CACHE_KEY_CATEGORIES = "categories:list";

/**
 * GET /api/categories — 获取所有分类（系统预设 + 用户自定义）
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return apiError("请先登录", 1002, 401);
    }

    // 尝试从缓存获取
    const cacheKey = `${CACHE_KEY_CATEGORIES}:${user.userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return apiResponse(JSON.parse(cached));
    }

    // 查询数据库：系统预设 + 用户自定义
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ isPreset: true }, { userId: user.userId }],
      },
      orderBy: [{ isPreset: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        isPreset: true,
      },
    });

    // 缓存结果
    await redis.set(cacheKey, JSON.stringify(categories), "EX", 3600);

    return apiResponse(categories);
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}

/**
 * POST /api/categories — 创建自定义分类
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return apiError("请先登录", 1002, 401);
    }

    const { name, color } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length > 30) {
      return apiError("分类名称须为 1-30 个字符", 1001);
    }
    if (!color || typeof color !== "string") {
      return apiError("请选择分类颜色", 1001);
    }

    // 检查同名分类（不区分大小写）
    const existing = await prisma.category.findFirst({
      where: {
        userId: user.userId,
        name: { equals: name.trim(), mode: "insensitive" },
      },
    });
    if (existing) {
      return apiError("该分类名称已存在", 1005, 409);
    }

    const category = await prisma.category.create({
      data: {
        userId: user.userId,
        name: name.trim(),
        icon: name.trim().charAt(0),
        color,
        isPreset: false,
      },
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

    return apiResponse(category, "创建成功");
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
