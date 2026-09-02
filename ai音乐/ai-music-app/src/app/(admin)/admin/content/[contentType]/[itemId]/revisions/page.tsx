import { AdminContentRevisionsPage } from "@/components/admin-content-revisions-page";

export default async function AdminContentRevisionRoute({ params }: { params: Promise<{ contentType: string; itemId: string }> }) {
  const { contentType, itemId } = await params;
  return <AdminContentRevisionsPage contentType={contentType} itemId={itemId} />;
}
