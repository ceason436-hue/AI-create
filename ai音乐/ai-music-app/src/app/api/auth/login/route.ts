import { compare } from "bcryptjs";
import { AccountStatus } from "@prisma/client";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { badRequest, forbidden, internalError, serviceUnavailable, tooManyRequests } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { accountTypeCookieMaxAge } from "@/lib/session-policy";

const inputSchema = z.object({
  loginIdentifier: z.string().trim().min(3).max(64).transform((value) => value.toUpperCase()),
  password: z.string().min(6).max(128),
});

export async function POST(request: Request) {
  try {
    if (!await enforceRateLimit(request, "login", 10, 60)) return tooManyRequests("登录尝试过于频繁，请稍后重试。");
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest("请输入正确的账号和密码。");

    const account = await db.account.findUnique({
      where: { loginIdentifier: parsed.data.loginIdentifier },
    });
    if (!account || !(await compare(parsed.data.password, account.passwordHash))) {
      return forbidden("账号或密码错误。");
    }
    if (account.status !== AccountStatus.ACTIVE) {
      return forbidden("该账号当前不可用，请联系管理员。");
    }

    await Promise.all([
      createSession(account),
      db.account.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } }),
    ]);
    const response = Response.json({ account: { type: account.type, loginIdentifier: account.loginIdentifier } });
    const cookieStore = await cookies();
    cookieStore.set("krt_account_type", account.type, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: accountTypeCookieMaxAge(account.type),
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT_UNAVAILABLE") return serviceUnavailable("登录保护服务暂不可用，请稍后重试。");
    return internalError();
  }
}
