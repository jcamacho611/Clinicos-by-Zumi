import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FrontDeskWorkspaceReal } from "@/components/clinic/front-desk-workspace-real";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { requireClinicSession } from "@/lib/auth/session";
import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";
import { listCareCoordinationWorkspace } from "@/lib/repositories/care-coordination-repository";
import styles from "./front-desk-black-label.module.css";

export const metadata: Metadata = { title: "Front desk" };

export default async function FrontDeskPage() {
  const session = await requireClinicSession();
  if (!canAccessWorkspace(session.role, "front-desk")) return notFound();
  const [appointments, coordination] = await Promise.all([
    listAppointmentsForOrganization(session.organizationId),
    listCareCoordinationWorkspace(session.organizationId, session.userId, session.role),
  ]);
  return <div className={styles.stage}><FrontDeskWorkspaceReal appointments={appointments} coordination={coordination} currentUserId={session.userId} /></div>;
}
