import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <><PublicHeader />{children}<PublicFooter /></>;
}
