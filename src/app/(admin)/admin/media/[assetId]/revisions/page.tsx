import { AdminMediaRevisionsPage } from "@/components/admin-media-revisions-page";
export default async function AdminMediaRevisionRoute({ params }: { params: Promise<{ assetId: string }> }) { return <AdminMediaRevisionsPage assetId={(await params).assetId} />; }
