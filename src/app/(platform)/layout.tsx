import { AppShell } from "@/components/clinic/app-shell";
import { requireClinicSession } from "@/lib/auth/session";
import { resolveTenantContext } from "@/lib/tenant-context";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClinicSession();
  const resolvedContext = await resolveTenantContext(session);
  return <AppShell session={session} resolvedContext={resolvedContext}>{children}</AppShell>;
}
