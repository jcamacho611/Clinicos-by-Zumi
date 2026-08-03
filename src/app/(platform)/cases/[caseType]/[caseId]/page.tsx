import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseRoom } from "@/components/clinic/case-room";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { caseTypeSchema } from "@/lib/case-rules";
import { getCaseRoom } from "@/lib/repositories/case-repository";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export const metadata: Metadata = { title: "Case room" };

export default async function CaseRoomPage({ params }: { params: Promise<{ caseType: string; caseId: string }> }) {
  const { caseType: rawCaseType, caseId } = await params;
  const session = await requireClinicSession();
  if (!can(session.role, "cases", "read")) notFound();
  const parsed = caseTypeSchema.safeParse(rawCaseType);
  if (!parsed.success) notFound();
  try {
    const room = await getCaseRoom(session, parsed.data, caseId);
    return <CaseRoom canManage={can(session.role, "cases", "manage")} canUpdate={can(session.role, "cases", "update")} room={room} />;
  } catch (error) {
    if (error instanceof NetworkAccessError && error.status === 404) notFound();
    throw error;
  }
}
