import { z } from "zod";
import { AccountStatus, AccountType } from "@prisma/client";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

const querySchema = z.object({ type: z.nativeEnum(AccountType).optional(), status: z.nativeEnum(AccountStatus).optional(), q: z.string().trim().max(80).optional() });

export async function GET(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: "账户筛选参数无效。" }, { status: 400 });
  try {
    const accounts = await db.account.findMany({ where: { ...(parsed.data.type ? { type: parsed.data.type } : {}), ...(parsed.data.status ? { status: parsed.data.status } : {}), ...(parsed.data.q ? { loginIdentifier: { contains: parsed.data.q, mode: "insensitive" } } : {}) }, select: { id: true, loginIdentifier: true, status: true, profile: { select: { displayName: true } } }, orderBy: { updatedAt: "desc" }, take: 200 });
    return Response.json({ accounts: accounts.map((account) => ({ id: account.id, loginIdentifier: account.loginIdentifier, displayName: account.profile?.displayName ?? null, status: account.status })) });
  } catch { return internalError(); }
}
