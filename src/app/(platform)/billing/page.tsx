import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BillingWorkspaceReal } from "@/components/clinic/billing-workspace-real";
import { requireClinicSession } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { getGridMoney } from "@/lib/money/grid-money";
import { listBillingTruthWorkspace } from "@/lib/repositories/billing-truth-repository";
import { listPaymentWorkspace } from "@/lib/repositories/payment-repository";
import styles from "./billing-black-label.module.css";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const session = await requireClinicSession();
  if (!canAccessWorkspace(session.role, "billing")) return notFound();
  const [billing, payments, grid] = await Promise.all([
    listBillingTruthWorkspace(session),
    listPaymentWorkspace(session.organizationId),
    getGridMoney(session),
  ]);

  return (
    <div className={styles.stage} data-billing-stage="revenue-integrity">
      <BillingWorkspaceReal billing={billing} grid={grid} payments={payments} />
    </div>
  );
}
