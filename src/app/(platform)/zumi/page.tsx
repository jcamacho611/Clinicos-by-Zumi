import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Zumi | Klinikos",
  description: "Klinikos Intelligence conversation workspace.",
};

/**
 * The visible conversation surface is rendered by the persistent ZumiPresence mounted
 * in AppShell. Keeping that component at the shell boundary means client-side Klinikos
 * navigation does not destroy the active conversation when Zumi opens a trusted path.
 */
export default async function ZumiPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "ai", "read")) return notFound();

  return (
    <div aria-hidden="true" className="min-h-[calc(100vh-12rem)]" data-zumi-workspace-anchor />
  );
}
