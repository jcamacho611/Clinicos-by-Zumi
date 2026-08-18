import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZumiBrowserWorkspace } from "@/components/clinic/zumi-browser-workspace";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Zumi | Klinikos",
  description: "Expanded Zumi conversation for guided Klinikos work.",
};

export default async function ZumiPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "ai", "read")) return notFound();

  return <ZumiBrowserWorkspace userName={session.name} />;
}
