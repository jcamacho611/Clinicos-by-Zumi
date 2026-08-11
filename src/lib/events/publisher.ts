import "server-only";

import { db } from "@/lib/db";
import type { KlinikosDomainEvent } from "@/lib/events/types";

export type PublishEventInput<TPayload extends Record<string, unknown>> = Omit<KlinikosDomainEvent<TPayload>, "id" | "occurredAt"> & {
  id?: string;
  occurredAt?: Date;
};

/**
 * Persist a Klinikos domain event and its intended deliveries in one database transaction.
 *
 * This is the durable outbox boundary. Callers publish facts; asynchronous workers
 * can deliver them later without coupling Clinic, Grid, Education, Finance, or other
 * domains directly to one another.
 */
export async function publishDomainEvent<TPayload extends Record<string, unknown>>(input: PublishEventInput<TPayload>) {
  return db.$transaction(async (tx) => {
    const event = await tx.domainEvent.create({
      data: {
        id: input.id,
        eventType: input.eventType,
        sourceDomain: input.sourceDomain,
        sourceId: input.sourceId,
        organizationId: input.organizationId ?? null,
        actorIdentityId: input.actorIdentityId ?? null,
        subjectIdentityId: input.subjectIdentityId ?? null,
        containsPhi: input.containsPhi,
        purpose: input.purpose,
        payload: input.payload,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });

    const subscriptions = await tx.eventSubscription.findMany({
      where: { eventType: input.eventType, status: "active" },
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
