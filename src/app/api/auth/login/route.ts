import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { signToken, TOKEN_NAME } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60; // 15 分钟

async function getLoginAttempts(username: string): Promise<number> {
  const key = `login_attempts:${username}`;
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}

async function incrementLoginAttempts(username: string): Promise<void> {
  const key = `login_attempts:${username}`;
  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, LOCK_DURATION);
  await multi.exec();
}

async function clearLoginAttempts(username: string): Promise<void> {
  await redis.del(`login_attempts:${username}`);
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return apiError("请输入用户名和密码", 1001);
    }

    const normalizedUsername = username.toLowerCase().trim();

    // 检查是否被锁定
    const attempts = await getLoginAttempts(normalizedUsername);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      return apiError(
        `密码错误次数过多，请 ${LOCK_DURATION / 60} 分钟后再试`,
        1002,
        401
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (!user) {
      return apiError("用户名或密码错误", 1002, 401);
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await incrementLoginAttempts(normalizedUsername);
      const remaining = MAX_LOGIN_ATTEMPTS - attempts - 1;
      return apiError(
        remaining > 0
          ? `用户名或密码错误，还剩 ${remaining} 次尝试机会`
          : "密码错误次数过多，请 15 分钟后再试",
        1002,
        401
      );
    }

    // 登录成功，清除错误计数
    await clearLoginAttempts(normalizedUsername);

    // 签发 JWT
    const token = await signToken({
      userId: user.id,
      username: user.username,
    });

    // 设置 Cookie
    const response = apiResponse(
      { id: user.id, username: user.username },
      "登录成功"
    );
    response.headers.set(
      "Set-Cookie",
      `${TOKEN_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch {
    return apiError("服务器内部错误", 9999, 500);
  }
}
