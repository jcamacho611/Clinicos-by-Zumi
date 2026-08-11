export const klinikosEventDomains = [
  "identity",
  "clinic",
  "patient",
  "provider",
  "grid",
  "education",
  "network",
  "finance",
  "communications",
  "intelligence",
  "integration",
  "security",
] as const;

export type KlinikosEventDomain = (typeof klinikosEventDomains)[number];

export type KlinikosEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  type: string;
  domain: KlinikosEventDomain;
  occurredAt: string;
  producer: string;
  actorIdentityId?: string;
  organizationId?: string;
  subjectType?: string;
  subjectId?: string;
  correlationId?: string;
  causationId?: string;
  payload: TPayload;
  containsPhi: boolean;
  minimumNecessary: true;
};

export type EventHandler<TEvent extends KlinikosEvent = KlinikosEvent> = (
  event: TEvent,
) => Promise<void> | void;
