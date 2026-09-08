import { AdminCmsPage } from "@/components/admin-cms-page";
export default async function AdminContentPage({ params }: { params: Promise<{ contentType: string }> }) { return <AdminCmsPage mode="content" contentType={(await params).contentType} />; }
