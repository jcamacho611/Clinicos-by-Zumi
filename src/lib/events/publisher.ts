import "server-only";

import { db } from "@/lib/db";
import type { KlinikosEvent } from "@/lib/events/types";

export type PublishEventInput<TPayload extends Record<string, unknown>> = Omit<KlinikosEvent<TPayload>, "id" | "occurredAt" | "minimumNecessary"> & {
  id?: string;
  occurredAt?: string;
};

export async function publishDomainEvent<TPayload extends Record<string, unknown>>(input: PublishEventInput<TPayload>) {
  return db.$transaction(async (tx) => {
    const event = await tx.domainEvent.create({
      data: {
        id: input.id,
        eventType: input.type,
        sourceDomain: input.domain,
        sourceId: input.subjectId ?? input.producer,
        organizationId: input.organizationId ?? null,
        actorIdentityId: input.actorIdentityId ?? null,
        subjectIdentityId: input.subjectType === "identity" ? input.subjectId ?? null : null,
        containsPhi: input.containsPhi,
        purpose: input.producer,
        payload: {
          ...input.payload,
          producer: input.producer,
          subjectType: input.subjectType ?? null,
          subjectId: input.subjectId ?? null,
          correlationId: input.correlationId ?? null,
          causationId: input.causationId ?? null,
          minimumNecessary: true,
        },
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      },
    });

    const subscriptions = await tx.eventSubscription.findMany({
      where: { eventType: input.type, status: "active" },
    });

    if (subscriptions.length > 0) {
      await tx.eventDelivery.createMany({
        data: subscriptions.map((subscription) => ({
          eventId: event.id,
          subscriptionId: subscription.id,
          consumerKey: subscription.consumerKey,
          status: "pending",
        })),
      });
    }

    return event;
  });
}

export async function registerEventSubscription(input: {
  eventType: string;
  consumerKey: string;
  targetDomain: string;
  endpointKey?: string | null;
  phiPermitted?: boolean;
}) {
  return db.eventSubscription.upsert({
    where: { eventType_consumerKey: { eventType: input.eventType, consumerKey: input.consumerKey } },
    create: {
      eventType: input.eventType,
      consumerKey: input.consumerKey,
      targetDomain: input.targetDomain,
      endpointKey: input.endpointKey ?? null,
      phiPermitted: input.phiPermitted ?? false,
      status: "active",
    },
    update: {
      targetDomain: input.targetDomain,
      endpointKey: input.endpointKey ?? null,
      phiPermitted: input.phiPermitted ?? false,
      status: "active",
    },
  });
}
