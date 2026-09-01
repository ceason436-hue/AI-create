import { requireAdminResponse } from "@/lib/admin-access";
import { db } from "@/lib/db";
import { internalError } from "@/lib/http";

export async function GET(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  const status = new URL(request.url).searchParams.get("status");
  try {
    const inquiries = await db.inquiry.findMany({ where: status && status !== "ALL" ? { status } : undefined, orderBy: { createdAt: "desc" }, take: 200 });
    return Response.json({ inquiries }, { headers: { "Cache-Control": "no-store" } });
  } catch { return internalError(); }
}
