import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PhoneCall } from "lucide-react";
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
  return <>
    <div className="border-b border-[#d8ddd4] bg-[#f8f6f0]">
      <div className="mx-auto flex max-w-7xl items-center justify-end px-5 py-2 sm:px-8">
        <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d8ddd4] bg-white px-4 text-xs font-extrabold text-[#173c34] transition hover:bg-[#f3f0e8]" href="/portal/verify-phone"><PhoneCall className="size-4" aria-hidden="true" />Verify phone</Link>
      </div>
    </div>
    <PortalDashboard data={data} organizationName={session.organizationName} />
  </>;
}
