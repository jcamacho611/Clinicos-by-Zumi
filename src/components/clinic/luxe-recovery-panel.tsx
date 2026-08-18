import { LuxeRecoverySection } from "@/components/clinic/luxe-recovery-section";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { getLuxeRecoveryReview } from "@/lib/repositories/luxe-recovery-repository";

export async function LuxeRecoveryPanel() {
  const session = await requireClinicSession();
  if (!can(session.role, "luxe_medi", "read") || !can(session.role, "crm", "read")) return null;
  const recovery = await getLuxeRecoveryReview(session);
  const canReactivate = can(session.role, "luxe_medi", "update") && can(session.role, "crm", "update");
  return <LuxeRecoverySection canReactivate={canReactivate} recovery={recovery} />;
}
