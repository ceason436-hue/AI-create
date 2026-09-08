import { ReferenceTools } from "@/components/reference-tools";
import { PublicShell } from "@/components/public-shell";
import { toolsPageContent } from "@/lib/public-page-contract";
import { loadPublishedPageSections } from "@/lib/site-pages";
import { getPublicAiTools, type PublicAiTool } from "@/lib/ai-tools";
import { loadPublicMediaSlots } from "@/lib/media-slots";

export default async function ToolsPage() {
  const [page, toolResult, media] = await Promise.all([
    loadPublishedPageSections("tools"),
    getPublicAiTools().then((tools) => ({ state: "ready" as const, tools })).catch(() => ({ state: "unavailable" as const, tools: undefined as PublicAiTool[] | undefined })),
    loadPublicMediaSlots(["tools-hero"]),
  ]);
  return <PublicShell><ReferenceTools content={toolsPageContent(page.sections)} contentState={page.state} publicTools={toolResult.tools} toolState={toolResult.state} heroMedia={media.slots["tools-hero"]} mediaState={media.state} /></PublicShell>;
}
