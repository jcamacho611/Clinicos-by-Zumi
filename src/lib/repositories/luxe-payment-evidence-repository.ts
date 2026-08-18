import "server-only";

import type { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { LUXE_MANUAL_PAYMENT_EVENT, manualLuxePaymentEvidenceSchema } from "@/lib/luxe-payment-evidence-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";

function objectValue(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : null;
}

function stringValue(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" ? value : null;
}

function numberValue(value: Prisma.JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function recordManualLuxePaymentEvidence(session: ClinicSession, leadId: string, rawInput: unknown) {
  const input = manualLuxePaymentEvidenceSchema.parse(rawInput);
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { id: true, slug: true, status: true },
  });
  if (!organization || organization.status !== "active" || organization.slug !== LUXE_ORGANIZATION_SLUG) {
    throw new NetworkAccessError("Luxe payment reconciliation is not available for this organization.", 404);
  }

  return db.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id: leadId, organizationId: session.organizationId },
      select: { id: true, paymentStatus: true, name: true },
    });
    if (!lead) throw new NetworkAccessError("Lead not found for this organization.", 404);

    const recentPaymentEvents = await tx.leadEvent.findMany({
      where: {
        organizationId: session.organizationId,
        eventType: { in: [LUXE_MANUAL_PAYMENT_EVENT, "payment_verified_processor"] },
      },
      select: { id: true, leadId: true, eventType: true, metadata: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    const matchingReference = recentPaymentEvents.find((event) => {
      const metadata = objectValue(event.metadata);
      return stringValue(metadata?.provider) === input.provider && stringValue(metadata?.externalReference) === input.externalReference;
    });

    if (matchingReference) {
      const metadata = objectValue(matchingReference.metadata);
      const amountCents = numberValue(metadata?.amountCents);
      if (matchingReference.leadId !== lead.id || amountCents !== input.amountCents) {
        throw new NetworkAccessError("This payment reference is already linked to different evidence.", 409);
      }
      return { eventId: matchingReference.id, inserted: false, paymentStatus: lead.paymentStatus };
    }

    const event = await tx.leadEvent.create({
      data: {
        organizationId: session.organizationId,
        leadId: lead.id,
        actorId: session.userId,
        eventType: LUXE_MANUAL_PAYMENT_EVENT,
        fromStatus: lead.paymentStatus,
        toStatus: "manual_reconciled",
        note: input.note,
        metadata: {
          provider: input.provider,
          externalReference: input.externalReference,
          amountCents: input.amountCents,
          currency: input.currency,
          paymentKind: input.paymentKind,
          evidenceSource: input.evidenceSource,
          receivedAt: input.receivedAt,
          verificationMethod: "manual_reconciliation",
          processorVerified: false,
          cardDataStored: false,
        },
      },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: { paymentStatus: "manual_reconciled" },
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "luxe.lead_payment_reconciled_manual",
        resourceType: "lead",
        resourceId: lead.id,
        metadata: {
          paymentEventId: event.id,
          provider: input.provider,
          externalReference: input.externalReference,
          amountCents: input.amountCents,
          currency: input.currency,
          evidenceSource: input.evidenceSource,
          processorVerified: false,
        },
      },
    });

    return { eventId: event.id, inserted: true, paymentStatus: "manual_reconciled" as const };
  });
}
