import { AccountType, EntitlementSource, OrderChannel, OrderStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { conflict, internalError } from "@/lib/http";

const manualOrderSchema = z.object({
  accountId: z.string().cuid(),
  planId: z.string().cuid(),
  amountCents: z.number().int().min(0).max(100_000_000),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  operatorNote: z.string().trim().min(1).max(1_000),
  idempotencyKey: z.string().trim().min(8).max(128),
}).superRefine(({ startsAt, endsAt }, context) => {
  if (new Date(startsAt) >= new Date(endsAt)) context.addIssue({ code: z.ZodIssueCode.custom, message: "权益结束时间必须晚于开始时间。" });
});

export async function GET() {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const orders = await db.order.findMany({ include: { account: { select: { loginIdentifier: true } }, plan: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return Response.json({ orders: orders.map((order) => ({ ...order, plan: order.plan ? { id: order.plan.id, code: order.plan.code, version: order.plan.version, name: order.plan.name } : null })) });
}

export async function POST(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const parsed = manualOrderSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "人工订单信息无效。" }, { status: 400 });
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { idempotencyKey: parsed.data.idempotencyKey } });
      if (existing) throw new Error("ORDER_EXISTS");
      const [account, plan] = await Promise.all([tx.account.findUnique({ where: { id: parsed.data.accountId } }), tx.plan.findUnique({ where: { id: parsed.data.planId } })]);
      if (!account || account.type !== AccountType.PERSONAL || !plan || plan.status !== "ACTIVE") throw new Error("INVALID_ORDER_TARGET");
      const order = await tx.order.create({
        data: { accountId: account.id, planId: plan.id, channel: OrderChannel.MANUAL, status: OrderStatus.PAID, amountCents: parsed.data.amountCents, operatorNote: parsed.data.operatorNote, idempotencyKey: parsed.data.idempotencyKey },
      });
      const entitlement = await tx.entitlement.create({ data: { accountId: account.id, source: EntitlementSource.PAID_PLAN, planId: plan.id, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt), metadata: { orderId: order.id } } });
      await tx.creditWallet.upsert({ where: { accountId: account.id }, update: { balance: { increment: plan.monthlyCredits } }, create: { accountId: account.id, balance: plan.monthlyCredits } });
      if (plan.monthlyCredits > 0) await tx.creditLedger.create({ data: { accountId: account.id, delta: plan.monthlyCredits, reason: "MANUAL_ORDER_GRANTED", referenceType: "ORDER", referenceId: order.id } });
      await tx.auditLog.create({ data: { actorId: access.account.id, action: "MANUAL_ORDER_PAID", targetType: "ORDER", targetId: order.id, result: "SUCCEEDED", after: { accountId: account.id, planId: plan.id, entitlementId: entitlement.id, amountCents: order.amountCents } } });
      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json({ order: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_EXISTS") return conflict("相同幂等键的人工订单已经处理。" );
    if (error instanceof Error && error.message === "INVALID_ORDER_TARGET") return Response.json({ error: "个人账户或权益模板不可用。" }, { status: 400 });
    return internalError();
  }
}
