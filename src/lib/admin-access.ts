import { requireSuperAdmin } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/http";

export async function requireAdminResponse() {
  try {
    return { account: await requireSuperAdmin() } as const;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return { response: unauthorized() } as const;
    return { response: forbidden() } as const;
  }
}
