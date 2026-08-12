import "server-only";

import { KLINIKOS_GODADDY_PAYLINK } from "@/lib/commercial/klinikos-commercial";
import type { CommercialPaymentConnector } from "@/lib/commercial/payment-connectors/types";

/**
 * Current GoDaddy rail: real checkout, manual reconciliation.
 *
 * A browser return is never treated as payment proof because Klinikos currently has
 * no signed GoDaddy webhook or authoritative processor API wired for this checkout.
 */
export const goDaddyPaymentConnector: CommercialPaymentConnector = {
  key: "godaddy",
  status() {
    return {
      key: "godaddy",
      checkoutConfigured: Boolean(KLINIKOS_GODADDY_PAYLINK),
      webhookConfigured: false,
      processorVerification: false,
      missing: KLINIKOS_GODADDY_PAYLINK ? [] : ["KLINIKOS_GODADDY_PAYLINK"],
    };
  },
  async createCheckout() {
    if (!KLINIKOS_GODADDY_PAYLINK) throw new Error("GoDaddy checkout is not configured.");
    return {
      provider: "godaddy",
      checkoutUrl: KLINIKOS_GODADDY_PAYLINK,
      externalCheckoutId: null,
      processorVerificationAvailable: false,
    };
  },
};
