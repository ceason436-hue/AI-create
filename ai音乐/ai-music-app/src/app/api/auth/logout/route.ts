import { revokeCurrentSession } from "@/lib/auth";
import { internalError } from "@/lib/http";
import { cookies } from "next/headers";

export async function POST() {
  try {
    await revokeCurrentSession();
    const response = Response.json({ ok: true });
    (await cookies()).delete("krt_account_type");
    return response;
  } catch {
    return internalError();
  }
}
