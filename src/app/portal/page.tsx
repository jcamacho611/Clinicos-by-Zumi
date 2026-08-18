import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PortalDashboard } from "@/components/portal/portal-dashboard";
import { PortalPhoneVerification } from "@/components/portal/portal-phone-verification";
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
  return (
    <div className="min-h-screen bg-[#f3f0e8]">
      <PortalDashboard data={data} organizationName={session.organizationName} />
      <div className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
        <PortalPhoneVerification />
      </div>
    </div>
  );
}
