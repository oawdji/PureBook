import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, TOKEN_NAME } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 参数校验
    if (!username || typeof username !== "string") {
      return apiError("请输入用户名", 1001);
    }
    if (username.length < 3 || username.length > 50) {
      return apiError("用户名长度须为 3-50 个字符", 1001);
    }
    if (!password || typeof password !== "string") {
      return apiError("请输入密码", 1001);
    }
    if (password.length < 6 || password.length > 100) {
      return apiError("密码长度须为 6-100 个字符", 1001);
    }

    const normalizedUsername = username.toLowerCase().trim();

    // 检查用户名是否已存在
    const existing = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existing) {
      return apiError("用户名已存在", 1005, 409);
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        passwordHash,
      },
    });

    // 签发 JWT
    const token = await signToken({ userId: user.id, username: user.username });

    // 设置 Cookie 并返回
    const response = apiResponse(
      { id: user.id, username: user.username },
      "注册成功"
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
