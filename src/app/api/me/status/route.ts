import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { internalError, unauthorized } from "@/lib/http";
import { usedStorageBytes } from "@/lib/works";

export async function GET() {
  try {
    const account = await getCurrentAccount();
    if (!account) return unauthorized();
    if (account.type !== "PERSONAL") return Response.json({ account: { type: account.type, loginIdentifier: account.loginIdentifier }, mode: "CLASSROOM" });
    const entitlement = await db.entitlement.findFirst({
      where: { accountId: account.id, status: "ACTIVE", startsAt: { lte: new Date() }, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
      include: { plan: true },
      orderBy: { startsAt: "desc" },
    });
    const wallet = await db.creditWallet.findUnique({ where: { accountId: account.id } });
    const usedBytes = await usedStorageBytes(account.id);
    return Response.json({
      account: { type: account.type, loginIdentifier: account.loginIdentifier },
      entitlement: entitlement ? { source: entitlement.source, endsAt: entitlement.endsAt, plan: entitlement.plan ? { code: entitlement.plan.code, name: entitlement.plan.name, storageLimitBytes: entitlement.plan.storageLimitBytes.toString() } : null } : null,
      wallet,
      storage: entitlement?.plan ? { usedBytes: usedBytes.toString(), limitBytes: entitlement.plan.storageLimitBytes.toString() } : null,
    });
  } catch {
    return internalError();
  }
}
