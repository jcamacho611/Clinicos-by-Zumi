import type { Metadata } from "next";
import { AccountPreferences } from "@/components/clinic/account-preferences";
import { requireClinicSession } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage Klinikos account context, appearance, security, and sign out.",
};

export default async function SettingsPage() {
  const session = await requireClinicSession();
  return <AccountPreferences userName={session.name} organizationName={session.organizationName} role={roleLabel(session.role)} />;
}
