import "server-only";

import { goDaddyPaymentConnector } from "@/lib/commercial/payment-connectors/godaddy";
import { whopPaymentConnector } from "@/lib/commercial/payment-connectors/whop";

const paymentConnectors = new Map([
  [whopPaymentConnector.key, whopPaymentConnector],
  [goDaddyPaymentConnector.key, goDaddyPaymentConnector],
]);

export type PaymentConnectorKey = "whop" | "godaddy";

export function getPaymentConnector(key: string | null | undefined) {
  if (!key) return null;
  return paymentConnectors.get(key) ?? null;
}

export function selectCheckoutConnector(env: NodeJS.ProcessEnv = process.env) {
  const preferred = env.KLINIKOS_CHECKOUT_PROVIDER?.trim().toLowerCase();
  if (preferred) {
    const connector = getPaymentConnector(preferred);
    if (!connector) return { ok: false as const, detail: `Unknown checkout provider: ${preferred}.` };
    const status = connector.status(env);
    if (!status.checkoutConfigured) return { ok: false as const, detail: `${preferred} checkout is pending connection.`, status };
    return { ok: true as const, connector, status };
  }

  for (const key of ["whop", "godaddy"] as const) {
    const connector = getPaymentConnector(key)!;
    const status = connector.status(env);
    if (status.checkoutConfigured) return { ok: true as const, connector, status };
  }

  return { ok: false as const, detail: "No Klinikos checkout provider is configured." };
}

export function listPaymentConnectorStatus(env: NodeJS.ProcessEnv = process.env) {
  return [...paymentConnectors.values()].map((connector) => connector.status(env));
}
