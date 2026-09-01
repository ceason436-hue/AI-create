import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { CourseToolContextBridge } from "@/components/course-tool-context-bridge";
import { Suspense } from "react";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <><PublicHeader /><Suspense fallback={null}><CourseToolContextBridge /></Suspense>{children}<PublicFooter /></>;
}
