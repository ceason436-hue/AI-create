import { requireAdminResponse } from "@/lib/admin-access";
import { previewEnrollmentImport } from "@/lib/enrollment-import";
import { internalError } from "@/lib/http";

export async function POST(request: Request) {
  const access = await requireAdminResponse();
  if ("response" in access) return access.response;
  try {
    const body = await request.json().catch(() => null);
    const totalRows = Array.isArray(body?.rows) ? body.rows.length : 0;
    const preview = await previewEnrollmentImport(body?.rows);
    return Response.json({ preview: { validRows: Math.max(0, totalRows - new Set(preview.issues.map((issue) => issue.rowNumber)).size), totalRows, issues: preview.issues } });
  } catch { return internalError(); }
}
