export const KLINIKOS_EVENT_TYPES = [
  "AppointmentScheduled",
  "AppointmentConfirmed",
  "AppointmentCanceled",
  "AppointmentNoShow",
  "LeadCreated",
  "LeadContacted",
  "LeadConverted",
  "FormRequested",
  "FormCompleted",
  "DocumentUploaded",
  "TaskCreated",
  "TaskCompleted",
  "ReferralCreated",
  "ReferralCompleted",
  "ResultReceived",
  "ResultReviewed",
  "EncounterSigned",
  "BillingPacketReady",
  "EligibilityChecked",
  "ClaimSubmitted",
  "ClaimAccepted",
  "ClaimRejected",
  "ClaimPaid",
  "PaymentReceived",
  "ProviderCredentialExpiring",
  "ProviderCredentialVerified",
  "CapacityPublished",
  "GRIDBookingRequested",
  "GRIDBookingAccepted",
  "CourseCompleted",
] as const;

export type KlinikosEventType = (typeof KLINIKOS_EVENT_TYPES)[number];

export type KlinikosEventPayload = Record<string, unknown>;

export type KlinikosDomainEvent<TPayload extends KlinikosEventPayload = KlinikosEventPayload> = {
  eventId: string;
  eventType: KlinikosEventType;
  eventVersion: number;
  occurredAt: string;
  tenantId: string;
  locationId?: string | null;
  actorId?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
  payload: TPayload;
  metadata?: Record<string, unknown>;
};

export function createKlinikosEvent<TPayload extends KlinikosEventPayload>(input: {
  eventType: KlinikosEventType;
  tenantId: string;
  payload: TPayload;
  eventId?: string;
  eventVersion?: number;
  occurredAt?: Date;
  locationId?: string | null;
  actorId?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
  metadata?: Record<string, unknown>;
}): KlinikosDomainEvent<TPayload> {
  return {
    eventId: input.eventId ?? crypto.randomUUID(),
    eventType: input.eventType,
    eventVersion: input.eventVersion ?? 1,
    occurredAt: (input.occurredAt ?? new Date()).toISOString(),
    tenantId: input.tenantId,
    locationId: input.locationId ?? null,
    actorId: input.actorId ?? null,
    subjectType: input.subjectType ?? null,
    subjectId: input.subjectId ?? null,
    correlationId: input.correlationId ?? null,
    causationId: input.causationId ?? null,
    payload: input.payload,
    metadata: input.metadata ?? {},
  };
}

export function assertEventTenant(event: KlinikosDomainEvent, tenantId: string) {
  if (event.tenantId !== tenantId) {
    throw new Error("Cross-tenant event access denied");
  }
}
