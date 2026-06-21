import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 全局认证中间件
 * - 未登录用户自动跳转到 /login
 * - 已登录用户访问 /login 时自动跳转到首页
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 允许访问的路径（无需登录）
  const publicPaths = [
    "/login",
    "/api/auth/login",
    "/api/auth/register",
    "/api/health",
    "/_next",
    "/favicon.ico",
  ];

  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (!token && !isPublic) {
    // 未登录 → 跳转到登录页
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname === "/login") {
    // 已登录 → 跳转到首页
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/**
 * 排除中间件不匹配的路径
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static（静态文件）
     * - _next/image（图片优化）
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
