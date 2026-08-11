import { redirect } from "next/navigation";
import { CommandCenter } from "@/components/clinic/command-center";
import { requireClinicSession } from "@/lib/auth/session";
import { loadCommandCenter } from "@/lib/operations/command-center";
import { runFollowUpSweep } from "@/lib/operations/followup-service";
import { can } from "@/lib/auth/rbac";

/**
 * The owner command centre.
 *
 * Landing here runs the follow-up sweep first, so the page reflects the clinic as it
 * is right now rather than as it was when someone last triggered a job. The sweep is
 * idempotent, so arriving twice changes nothing.
 *
 * A sweep failure does not fail the page. The owner still needs to see their clinic,
 * and a detection pass that could take the dashboard down would be worse than a
 * detection pass that is briefly stale.
 */

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireClinicSession();
  if (session.role === "contractor") redirect("/grid");

  if (process.env.DATABASE_URL && can(session.role, "tasks", "read")) {
    await runFollowUpSweep(session.organizationId).catch(() => undefined);
  }

  const data = await loadCommandCenter(session.organizationId);
  return <CommandCenter data={data} userName={session.name} />;
}
