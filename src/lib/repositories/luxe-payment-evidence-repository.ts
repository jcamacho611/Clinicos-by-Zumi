import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { LUXE_MANUAL_PAYMENT_EVENT, manualLuxePaymentEvidenceSchema } from "@/lib/luxe-payment-evidence-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";

type PaymentEvidenceRow = {
  id: string;
  leadId: string;
  amountCents: number;
  verificationMethod: string;
  processorVerified: boolean;
};

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
      select: { id: true, paymentStatus: true },
    });
    if (!lead) throw new NetworkAccessError("Lead not found for this organization.", 404);

    const evidenceId = randomUUID();
    const receivedAt = new Date(input.receivedAt);
    const inserted = await tx.$queryRaw<PaymentEvidenceRow[]>(Prisma.sql`
      INSERT INTO "luxe_lead_payment_evidence" (
        "id", "organizationId", "leadId", "provider", "externalReference", "amountCents", "currency",
        "paymentKind", "evidenceSource", "verificationMethod", "processorVerified", "receivedAt", "actorId", "note"
      ) VALUES (
        ${evidenceId}, ${session.organizationId}, ${lead.id}, ${input.provider}, ${input.externalReference}, ${input.amountCents}, ${input.currency},
        ${input.paymentKind}, ${input.evidenceSource}, 'manual_reconciliation', false, ${receivedAt}, ${session.userId}, ${input.note}
      )
      ON CONFLICT ("organizationId", "provider", "externalReference") DO NOTHING
      RETURNING "id", "leadId", "amountCents", "verificationMethod", "processorVerified"
    `);

    let evidence = inserted[0] ?? null;
    if (!evidence) {
      const existing = await tx.$queryRaw<PaymentEvidenceRow[]>(Prisma.sql`
        SELECT "id", "leadId", "amountCents", "verificationMethod", "processorVerified"
        FROM "luxe_lead_payment_evidence"
        WHERE "organizationId" = ${session.organizationId}
          AND "provider" = ${input.provider}
          AND "externalReference" = ${input.externalReference}
        LIMIT 1
        FOR UPDATE
      `);
      evidence = existing[0] ?? null;
      if (!evidence || evidence.leadId !== lead.id || evidence.amountCents !== input.amountCents || evidence.verificationMethod !== "manual_reconciliation" || evidence.processorVerified) {
        throw new NetworkAccessError("This payment reference is already linked to different evidence.", 409);
      }
      return { evidenceId: evidence.id, eventId: null, inserted: false, paymentStatus: lead.paymentStatus };
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
          evidenceId: evidence.id,
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
          paymentEvidenceId: evidence.id,
          paymentEventId: event.id,
          provider: input.provider,
          externalReference: input.externalReference,
          amountCents: input.amountCents,
          currency: input.currency,
          evidenceSource: input.evidenceSource,
          verificationMethod: "manual_reconciliation",
          processorVerified: false,
        },
      },
    });

    return { evidenceId: evidence.id, eventId: event.id, inserted: true, paymentStatus: "manual_reconciled" as const };
  });
}
