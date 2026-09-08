import { AdminMediaCaptionsPage } from "@/components/admin-media-captions-page";

export default async function AdminMediaCaptionsRoute({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  return <AdminMediaCaptionsPage assetId={assetId} />;
}
