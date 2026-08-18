import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BillingWorkspaceReal } from "@/components/clinic/billing-workspace-real";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { requireClinicSession } from "@/lib/auth/session";
import { listBillingTruthWorkspace } from "@/lib/repositories/billing-truth-repository";
import { listPaymentWorkspace } from "@/lib/repositories/payment-repository";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const session = await requireClinicSession();
  if (!canAccessWorkspace(session.role, "billing")) return notFound();
  const [billing, payments] = await Promise.all([
    listBillingTruthWorkspace(session),
    listPaymentWorkspace(session.organizationId),
  ]);
  return <BillingWorkspaceReal billing={billing} payments={payments} />;
}
