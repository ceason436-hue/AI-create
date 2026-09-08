import { getPublicAiTools } from "@/lib/ai-tools";

export async function GET() {
  try {
    return Response.json({ tools: await getPublicAiTools() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ tools: [], state: "unavailable" }, { headers: { "Cache-Control": "private, no-store" } });
  }
}
