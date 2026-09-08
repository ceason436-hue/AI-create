import { AccountType } from "@prisma/client";

import { getCurrentAccount } from "@/lib/auth";
import { serviceUnavailable } from "@/lib/http";

export const dynamic = "force-dynamic";

function storageIdentity(accountType: AccountType | null) {
  if (accountType === AccountType.PERSONAL) return "PERSONAL" as const;
  if (accountType === AccountType.SCHOOL_SHARED) return "SCHOOL_SHARED" as const;
  // Administrators do not get a personal cloud-work identity by implication.
  return "ANONYMOUS" as const;
}

export async function GET() {
  try {
    const account = await getCurrentAccount();
    const accountType = account?.type ?? "ANONYMOUS";
    return Response.json(
      {
        account,
        authenticated: Boolean(account),
        accountType,
        storageIdentity: storageIdentity(account?.type ?? null),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch {
    return serviceUnavailable("当前会话暂时无法验证，请稍后重试。");
  }
}
