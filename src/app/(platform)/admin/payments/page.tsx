import { redirect } from "next/navigation";
import { AccessPaymentsWorkspace, type AccessPaymentRow } from "@/components/commerce/access-payments-workspace";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { listAccessPayments } from "@/lib/commerce/access-payment-service";

/**
 * Administrator worklist for marketplace access payments.
 *
 * Gated on the same sales-manage permission the verification API enforces, so the
 * page cannot show a queue whose actions the API would reject.
 */

export const dynamic = "force-dynamic";

export default async function AccessPaymentsAdminPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "sales", "manage")) redirect("/dashboard");

  const rows = process.env.DATABASE_URL ? await listAccessPayments(session) : [];
  const serialized = JSON.parse(JSON.stringify(rows)) as AccessPaymentRow[];
  return <AccessPaymentsWorkspace initialRows={serialized} />;
}
