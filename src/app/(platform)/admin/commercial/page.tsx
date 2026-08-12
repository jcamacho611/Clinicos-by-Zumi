import { redirect } from "next/navigation";
import { ClinicActivationDesk } from "@/components/commercial/clinic-activation-desk";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { clinicPlans } from "@/lib/commercial/klinikos-commercial";
import { listClinicPlanCheckouts } from "@/lib/commercial/clinic-provisioning";

export default async function CommercialActivationPage() {
  const session = await requireClinicSession();
  if (!can(session.role, "sales", "read")) redirect("/dashboard");
  const initialCheckouts = await listClinicPlanCheckouts(session);
  const plans = [
    { key: "clinic_core", label: clinicPlans.core.name, priceLabel: clinicPlans.core.monthlyPriceLabel },
    { key: "clinic_growth", label: clinicPlans.growth.name, priceLabel: clinicPlans.growth.monthlyPriceLabel },
    { key: "clinic_scale", label: clinicPlans.scale.name, priceLabel: clinicPlans.scale.monthlyPriceLabel },
  ];
  return <ClinicActivationDesk initialCheckouts={initialCheckouts} plans={plans} />;
}
