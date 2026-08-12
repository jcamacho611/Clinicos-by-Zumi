import type { CommercialProduct } from "@/lib/commercial/product-catalog";

export type CommercialCheckoutRequest = {
  product: CommercialProduct;
  organizationId: string;
  email: string;
  state: string;
  returnUrl: string;
};

export type CommercialCheckoutResult = {
  provider: string;
  checkoutUrl: string;
  externalCheckoutId: string | null;
  processorVerificationAvailable: boolean;
};

export type NormalizedCommercialWebhook = {
  provider: string;
  eventId: string;
  eventType: string;
  payloadHash: string;
  payload: Record<string, unknown>;
  verified: true;
  verificationMethod: "webhook_signature" | "api_verification";
  processorVerified: true;
  productKey: string | null;
  organizationId: string | null;
  email: string | null;
  externalCustomerId: string | null;
  externalSubscriptionId: string | null;
  amountCents: number | null;
  currency: string | null;
  checkoutState: string | null;
  periodStartsAt: Date | null;
  periodEndsAt: Date | null;
};

export type PaymentConnectorStatus = {
  key: string;
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
  processorVerification: boolean;
  missing: string[];
};

export interface CommercialPaymentConnector {
  key: string;
  status(env?: NodeJS.ProcessEnv): PaymentConnectorStatus;
  createCheckout?(request: CommercialCheckoutRequest, env?: NodeJS.ProcessEnv): Promise<CommercialCheckoutResult>;
}
