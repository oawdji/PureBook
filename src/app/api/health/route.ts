import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/health — 服务健康检查
 */
export async function GET() {
  try {
    const checks = { database: "disconnected", redis: "disconnected" };

    // 检查数据库
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "connected";
    } catch {
      // ignored
    }

    // 检查 Redis
    try {
      await redis.ping();
      checks.redis = "connected";
    } catch {
      // ignored
    }

    const isHealthy =
      checks.database === "connected" && checks.redis === "connected";

    return apiResponse({
      status: isHealthy ? "healthy" : "degraded",
      uptime: Math.floor(process.uptime()),
      checks,
    });
  } catch {
    return apiError("服务不可用", 9999, 500);
  }
}
