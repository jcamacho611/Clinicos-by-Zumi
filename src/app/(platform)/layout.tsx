import { AppShell } from "@/components/clinic/app-shell";
import { requireClinicSession } from "@/lib/auth/session";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClinicSession();
  return <AppShell session={session}>{children}</AppShell>;
}
