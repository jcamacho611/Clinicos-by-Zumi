import "server-only";

import { KLINIKOS_GODADDY_PAYLINK } from "@/lib/commercial/klinikos-commercial";
import type { CommercialPaymentConnector } from "@/lib/commercial/payment-connectors/types";
import type { CommercialProduct } from "@/lib/commercial/product-catalog";

const clinicPlanPaylinkEnv: Partial<Record<CommercialProduct["key"], string>> = {
  clinic_core: "KLINIKOS_GODADDY_CORE_PAYLINK",
  clinic_growth: "KLINIKOS_GODADDY_GROWTH_PAYLINK",
  clinic_scale: "KLINIKOS_GODADDY_SCALE_PAYLINK",
};

export function goDaddyCheckoutUrlForProduct(product: CommercialProduct, env: NodeJS.ProcessEnv = process.env) {
  if (product.key === "operational_audit") return KLINIKOS_GODADDY_PAYLINK || null;
  const variable = clinicPlanPaylinkEnv[product.key];
  if (!variable) return null;
  return env[variable]?.trim() || null;
}

export function goDaddyClinicPlanCheckoutStatus(env: NodeJS.ProcessEnv = process.env) {
  const required = Object.entries(clinicPlanPaylinkEnv).map(([productKey, variable]) => ({ productKey, variable, configured: Boolean(env[variable]?.trim()) }));
  return {
    configuredPlanKeys: required.filter((entry) => entry.configured).map((entry) => entry.productKey),
    missing: required.filter((entry) => !entry.configured).map((entry) => entry.variable),
    allConfigured: required.every((entry) => entry.configured),
  };
}

/**
 * Current GoDaddy checkout rail.
 *
 * It is intentionally represented as checkout-only. Klinikos has no signed server
 * webhook or authoritative processor API wired for this rail today, so a successful
 * browser return never becomes automatic access. Staff reconcile real payment evidence
 * into the same provider-neutral commercial ledger used by connected processors.
 *
 * Subscription plans require their own exact-value paylinks. The $500 Operational
 * Audit paylink is never reused as a fallback for Core, Growth, or Scale.
 */
export const goDaddyPaymentConnector: CommercialPaymentConnector = {
  key: "godaddy",
  status() {
    const plans = goDaddyClinicPlanCheckoutStatus();
    const checkoutConfigured = Boolean(KLINIKOS_GODADDY_PAYLINK) || plans.configuredPlanKeys.length > 0;
    return {
      key: "godaddy",
      checkoutConfigured,
      webhookConfigured: false,
      processorVerification: false,
      missing: checkoutConfigured ? [] : ["KLINIKOS_GODADDY_PAYLINK", ...plans.missing],
    };
  },
  async createCheckout(request) {
    const checkoutUrl = goDaddyCheckoutUrlForProduct(request.product);
    if (!checkoutUrl) {
      const requiredVariable = clinicPlanPaylinkEnv[request.product.key];
      throw new Error(requiredVariable
        ? `GoDaddy checkout is not configured for ${request.product.label}. Configure ${requiredVariable}.`
        : `GoDaddy checkout is not configured for ${request.product.label}.`);
    }
    return {
      provider: "godaddy",
      checkoutUrl,
      externalCheckoutId: null,
      processorVerificationAvailable: false,
    };
  },
};
