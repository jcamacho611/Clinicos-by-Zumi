import { AppShell } from "@/components/clinic/app-shell";
import { requireClinicSession } from "@/lib/auth/session";
import { PRIVATE_PAGE_METADATA } from "@/lib/seo/private-metadata";

export const metadata = PRIVATE_PAGE_METADATA;

/**
 * Legacy clinic-only routes still participate in the same authenticated product shell.
 * This prevents isolated private pages from losing the persistent Zumi control, while
 * keeping the exact same session/RBAC authority ceiling as every other clinic surface.
 */
export default async function ClinicPrivateLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClinicSession();
  return <AppShell session={session}>{children}</AppShell>;
}
