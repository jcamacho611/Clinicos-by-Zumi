import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PortalDashboard } from "@/components/portal/portal-dashboard";
import { requirePortalSession } from "@/lib/auth/portal-session";
import { getPortalDashboardForPatient, recordPortalAccess } from "@/lib/repositories/portal-repository";

export const metadata: Metadata = { title: "My patient portal" };

export default async function PatientPortalPage() {
  const session = await requirePortalSession();
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  await recordPortalAccess({ accountId: session.accountId, patientId: session.patientId, organizationId: session.organizationId, ipAddress: forwardedFor || requestHeaders.get("x-real-ip") || undefined, userAgent: requestHeaders.get("user-agent") || undefined });
  const data = await getPortalDashboardForPatient(session.organizationId, session.patientId);
  if (!data) notFound();
  return <PortalDashboard data={data} organizationName={session.organizationName} />;
}
