import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProviderWorkspaceReal } from "@/components/clinic/provider-workspace-real";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { requireClinicSession } from "@/lib/auth/session";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";
import { listEncountersForOrganization } from "@/lib/repositories/encounter-repository";

export const metadata: Metadata = { title: "Provider workspace" };

export default async function ProviderPage() {
  const session = await requireClinicSession();
  if (!canAccessWorkspace(session.role, "provider")) return notFound();
  const [appointments, encounters] = await Promise.all([
    listAppointmentsForOrganization(session.organizationId),
    listEncountersForOrganization(session.organizationId),
  ]);
  return <ProviderWorkspaceReal appointments={appointments} encounters={encounters} />;
}
