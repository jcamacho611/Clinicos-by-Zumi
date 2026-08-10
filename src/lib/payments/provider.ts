// Payment provider abstraction for Whop-first strategy

export type PaymentProvider = 'manual' | 'whop' | 'stripe_adapter_ready';

export type PaymentStatus =
  | 'created'
  | 'pending_verification'
  | 'verified_paid'
  | 'failed'
  | 'refunded'
  | 'disputed'
  | 'held'
  | 'manually_reconciled';

export type PortalAccessStatus = 'pending' | 'granted' | 'suspended' | 'revoked';

export interface PaymentRecord {
  id?: string; // internal UUID
  provider: PaymentProvider;
  productKey: string;
  roleTarget: string;
  externalCheckoutUrl?: string | null;
  externalPaymentReference?: string | null;
  buyerEmail?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  status: PaymentStatus;
  portalAccessStatus: PortalAccessStatus;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export const PROVIDERS: PaymentProvider[] = ['manual', 'whop', 'stripe_adapter_ready'];
