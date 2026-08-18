import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZumiPresence } from "@/components/clinic/zumi-presence";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Zumi | Klinikos",
  description: "Expanded Zumi conversation for guided Klinikos work.",
};

export default async function ZumiPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "ai", "read")) return notFound();

  return <ZumiPresence userName={session.name} />;
}
