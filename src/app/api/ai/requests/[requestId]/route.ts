import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const account = await getCurrentAccount();
  if (!account) return unauthorized();
  const { requestId } = await params;
  const record = await db.aiRequest.findFirst({
    where: { requestId, accountId: account.id },
    select: { requestId: true, tool: true, status: true, resultRef: true, errorCode: true, createdAt: true, startedAt: true, finishedAt: true, updatedAt: true },
  });
  if (!record) return Response.json({ error: "AI 请求不存在。" }, { status: 404 });
  return Response.json(record, { headers: { "Cache-Control": "private, no-store" } });
}
