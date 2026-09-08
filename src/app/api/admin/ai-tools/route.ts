import { requireAdminResponse } from "@/lib/admin-access";
import { getAdminAiTools } from "@/lib/ai-tools";
import { internalError } from "@/lib/http";

export async function GET() {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    return Response.json({ tools: await getAdminAiTools() });
  } catch {
    return internalError();
  }
}
