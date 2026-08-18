import { redirect } from "next/navigation";
import { ClinicActivationDesk } from "@/components/commercial/clinic-activation-desk";
import { requireClinicSession } from "@/lib/auth/session";
import { clinicPlans } from "@/lib/commercial/klinikos-commercial";
import { goDaddyClinicPlanCheckoutStatus } from "@/lib/commercial/payment-connectors/godaddy";
import { listClinicPlanCheckouts } from "@/lib/commercial/clinic-provisioning";
import { requirePlatformSalesWorkspace } from "@/lib/commercial/platform-sales-access";
import { stripeRecurringSubscriptionStatus } from "@/lib/commercial/stripe-clinic-subscriptions";

export default async function CommercialActivationPage() {
  const session = await requireClinicSession();
  try {
    await requirePlatformSalesWorkspace(session, "read");
  } catch {
    redirect("/dashboard");
  }

  const [initialCheckouts, goDaddyStatus, stripeStatus] = await Promise.all([
    listClinicPlanCheckouts(session),
    Promise.resolve(goDaddyClinicPlanCheckoutStatus()),
    Promise.resolve(stripeRecurringSubscriptionStatus()),
  ]);
  const goDaddyConfigured = new Set(goDaddyStatus.configuredPlanKeys);
  const stripeReady = stripeStatus.processorVerification;
  const plan = (key: "clinic_core" | "clinic_growth" | "clinic_scale", label: string, priceLabel: string) => {
    const goDaddyReady = goDaddyConfigured.has(key);
    return {
      key,
      label,
      priceLabel,
      checkoutConfigured: stripeReady || goDaddyReady,
      railProvider: stripeReady ? "stripe" as const : goDaddyReady ? "godaddy" as const : null,
    };
  };
  const plans = [
    plan("clinic_core", clinicPlans.core.name, clinicPlans.core.monthlyPriceLabel),
    plan("clinic_growth", clinicPlans.growth.name, clinicPlans.growth.monthlyPriceLabel),
    plan("clinic_scale", clinicPlans.scale.name, clinicPlans.scale.monthlyPriceLabel),
  ];

  return (
    <ClinicActivationDesk
      initialCheckouts={initialCheckouts}
      plans={plans}
      railSummary={{
        configuredPlanCount: plans.filter((item) => item.checkoutConfigured).length,
        totalPlanCount: plans.length,
        nativeStripeReady: stripeReady,
      }}
    />
  );
}
