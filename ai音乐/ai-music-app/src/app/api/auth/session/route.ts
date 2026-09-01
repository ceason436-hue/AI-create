import { getCurrentAccount } from "@/lib/auth";
import { internalError } from "@/lib/http";

export async function GET() {
  try {
    const account = await getCurrentAccount();
    return Response.json({ account });
  } catch {
    return internalError();
  }
}
