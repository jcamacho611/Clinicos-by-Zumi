import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZumiBrowserWorkspace } from "@/components/clinic/zumi-browser-workspace";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Klinikos Browser | Klinikos",
  description: "Klinikos Intelligence browser for conversations, governed routes, and working contexts.",
};

export default async function ZumiPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "ai", "read")) return notFound();

  return <ZumiBrowserWorkspace userName={session.name} />;
}
