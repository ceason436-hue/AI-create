import { AdminContentMediaPage } from "@/components/admin-content-media-page";
export default async function AdminContentMediaRoute({ params }: { params: Promise<{ contentType: string; itemId: string }> }) { const { contentType, itemId } = await params; return <AdminContentMediaPage contentType={contentType} itemId={itemId} />; }
