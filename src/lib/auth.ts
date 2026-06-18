import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "default-secret-change-me"
);

const TOKEN_NAME = "token";
const TOKEN_EXPIRES = "7d";

export interface JWTPayload {
  userId: number;
  username: string;
}

/**
 * 签发 JWT Token
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRES)
    .sign(JWT_SECRET);
}

/**
 * 验证 JWT Token，返回 payload 或 null
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * 从 Cookie 中获取当前用户信息（用于 Server Component）
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * 从 NextRequest 中验证用户身份（用于 API Route）
 * 返回用户信息，如果未认证则返回 null
 */
export async function verifyAuth(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { TOKEN_NAME, TOKEN_EXPIRES };
