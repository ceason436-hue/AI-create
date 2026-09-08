import { ReferenceHome } from "@/components/reference-home";
import { PublicShell } from "@/components/public-shell";
import { homePageContent } from "@/lib/public-page-contract";
import { loadPublishedPageSections } from "@/lib/site-pages";
import { loadPublicMediaSlots } from "@/lib/media-slots";

export default async function LandingPage() {
  const [page, media] = await Promise.all([loadPublishedPageSections("home"), loadPublicMediaSlots(["home-hero"])]);
  return <PublicShell><ReferenceHome content={homePageContent(page.sections)} contentState={page.state} heroMedia={media.slots["home-hero"]} mediaState={media.state} /></PublicShell>;
}
