import { redirect } from "next/navigation";
import { ClinicActivationDesk } from "@/components/commercial/clinic-activation-desk";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { clinicPlans } from "@/lib/commercial/klinikos-commercial";
import { goDaddyClinicPlanCheckoutStatus } from "@/lib/commercial/payment-connectors/godaddy";
import { listClinicPlanCheckouts } from "@/lib/commercial/clinic-provisioning";

export default async function CommercialActivationPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "sales", "read")) redirect("/dashboard");

  const [initialCheckouts, railStatus] = await Promise.all([
    listClinicPlanCheckouts(session),
    Promise.resolve(goDaddyClinicPlanCheckoutStatus()),
  ]);
  const configured = new Set(railStatus.configuredPlanKeys);
  const plans = [
    { key: "clinic_core", label: clinicPlans.core.name, priceLabel: clinicPlans.core.monthlyPriceLabel, checkoutConfigured: configured.has("clinic_core") },
    { key: "clinic_growth", label: clinicPlans.growth.name, priceLabel: clinicPlans.growth.monthlyPriceLabel, checkoutConfigured: configured.has("clinic_growth") },
    { key: "clinic_scale", label: clinicPlans.scale.name, priceLabel: clinicPlans.scale.monthlyPriceLabel, checkoutConfigured: configured.has("clinic_scale") },
  ];

  return (
    <ClinicActivationDesk
      initialCheckouts={initialCheckouts}
      plans={plans}
      railSummary={{ configuredPlanCount: railStatus.configuredPlanKeys.length, totalPlanCount: plans.length }}
    />
  );
}
