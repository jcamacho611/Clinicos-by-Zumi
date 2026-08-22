import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, RiskLevel } from "@prisma/client";
import { db } from "@/lib/db";
import { openLuxeAcquisitionJourney } from "@/lib/luxe-acquisition-journey-token";
import { configuredLuxeBookingReviewMinutes } from "@/lib/luxe-booking-config";
import type { NormalizedLuxeStripeDeposit } from "@/lib/luxe-stripe-deposit";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";
const TERMINAL_LEAD_STATUSES = new Set(["lost", "completed"]);

type PaymentEvidenceRow = {
  id: string;
  leadId: string;
  externalReference: string;
  amountCents: number;
  verificationMethod: string;
  processorVerified: boolean;
};

async function activeLuxeOrganization() {
  const organization = await db.organization.findUnique({
    where: { slug: LUXE_ORGANIZATION_SLUG },
    select: { id: true, status: true },
  });
  return organization?.status === "active" ? organization : null;
}

export async function resolveLuxeDepositCheckoutContext(leadId: string) {
  const organization = await activeLuxeOrganization();
  if (!organization) return null;
  const lead = await db.lead.findFirst({
    where: { id: leadId, organizationId: organization.id },
    select: {
      id: true,
      email: true,
      status: true,
      paymentStatus: true,
      serviceInterest: true,
    },
  });
  if (!lead || TERMINAL_LEAD_STATUSES.has(lead.status) || lead.paymentStatus === "processor_verified") return null;
  return {
    organizationId: organization.id,
    leadId: lead.id,
    email: lead.email,
    serviceInterest: lead.serviceInterest,
  };
}

async function findEvidenceByReference(
  tx: Prisma.TransactionClient,
  organizationId: string,
  reference: string | null,
) {
  if (!reference) return null;
  const rows = await tx.$queryRaw<PaymentEvidenceRow[]>(Prisma.sql`
    SELECT "id", "leadId", "externalReference", "amountCents", "verificationMethod", "processorVerified"
    FROM "luxe_lead_payment_evidence"
    WHERE "organizationId" = ${organizationId}
      AND "provider" = 'stripe'
      AND "externalReference" = ${reference}
    LIMIT 1
    FOR UPDATE
  `);
  return rows[0] ?? null;
}

function sameProcessorEvidence(evidence: PaymentEvidenceRow, leadId: string, amountCents: number) {
  return evidence.leadId === leadId && evidence.processorVerified && evidence.amountCents === amountCents;
}

export async function recordProcessorVerifiedLuxeStripeDeposit(input: NormalizedLuxeStripeDeposit) {
  if (input.outcome !== "succeeded") {
    return { recorded: false as const, outcome: input.outcome };
  }
  const journey = openLuxeAcquisitionJourney(input.journeyToken);
  if (!journey) throw new NetworkAccessError("Luxe payment correlation is invalid or expired.", 409);

  const organization = await activeLuxeOrganization();
  if (!organization) throw new NetworkAccessError("Luxe payment evidence is temporarily unavailable.", 503);

  return db.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id: journey.leadId, organizationId: organization.id },
      select: {
        id: true,
        name: true,
        status: true,
        paymentStatus: true,
        bookingStatus: true,
        assignedTo: true,
        followUpDueAt: true,
        serviceInterest: true,
      },
    });
    if (!lead) throw new NetworkAccessError("Luxe lead correlation could not be resolved.", 409);
    if (TERMINAL_LEAD_STATUSES.has(lead.status)) throw new NetworkAccessError("Closed Luxe leads cannot receive new deposit evidence automatically.", 409);

    let evidence = await findEvidenceByReference(tx, organization.id, input.externalReference);
    if (!evidence && input.alternateExternalReference) {
      evidence = await findEvidenceByReference(tx, organization.id, input.alternateExternalReference);
    }

    if (evidence && evidence.leadId !== lead.id) {
      throw new NetworkAccessError("This Stripe payment reference is already linked to a different Luxe lead.", 409);
    }
    if (evidence?.processorVerified) {
      if (!sameProcessorEvidence(evidence, lead.id, input.amountCents)) {
        throw new NetworkAccessError("Existing processor evidence does not match the signed Stripe payment.", 409);
      }
      return {
        recorded: true as const,
        idempotent: true as const,
        evidenceId: evidence.id,
        paymentStatus: lead.paymentStatus,
        bookingStatus: lead.bookingStatus,
      };
    }

    let upgradedManualEvidence = Boolean(evidence);
    let previousManualAmount = evidence?.amountCents ?? null;
    let evidenceId = evidence?.id ?? randomUUID();

    if (!evidence) {
      const inserted = await tx.$queryRaw<PaymentEvidenceRow[]>(Prisma.sql`
        INSERT INTO "luxe_lead_payment_evidence" (
          "id", "organizationId", "leadId", "provider", "externalReference", "amountCents", "currency",
          "paymentKind", "evidenceSource", "verificationMethod", "processorVerified", "receivedAt", "actorId", "note"
        ) VALUES (
          ${evidenceId}, ${organization.id}, ${lead.id}, 'stripe', ${input.externalReference}, ${input.amountCents}, 'USD',
          'deposit', 'stripe_webhook', 'processor_verification', true, ${input.receivedAt}, NULL,
          ${`Stripe signed webhook verified payment. Processor event ${input.eventId}.`}
        )
        ON CONFLICT ("organizationId", "provider", "externalReference") DO NOTHING
        RETURNING "id", "leadId", "externalReference", "amountCents", "verificationMethod", "processorVerified"
      `);

      if (inserted[0]) {
        evidence = inserted[0];
      } else {
        // Another webhook delivery may have won the unique-key race. Lock and
        // inspect the row rather than turning a valid Stripe retry into a failure.
        evidence = await findEvidenceByReference(tx, organization.id, input.externalReference);
        if (!evidence) throw new NetworkAccessError("Stripe payment evidence could not be resolved after a concurrent insert.", 409);
        if (evidence.leadId !== lead.id) {
          throw new NetworkAccessError("This Stripe payment reference is already linked to a different Luxe lead.", 409);
        }
        if (evidence.processorVerified) {
          if (!sameProcessorEvidence(evidence, lead.id, input.amountCents)) {
            throw new NetworkAccessError("Existing processor evidence does not match the signed Stripe payment.", 409);
          }
          return {
            recorded: true as const,
            idempotent: true as const,
            evidenceId: evidence.id,
            paymentStatus: lead.paymentStatus,
            bookingStatus: lead.bookingStatus,
          };
        }
        upgradedManualEvidence = true;
        previousManualAmount = evidence.amountCents;
        evidenceId = evidence.id;
      }
    }

    if (evidence && !evidence.processorVerified && upgradedManualEvidence) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "luxe_lead_payment_evidence"
        SET "amountCents" = ${input.amountCents},
            "currency" = 'USD',
            "paymentKind" = 'deposit',
            "evidenceSource" = 'stripe_webhook',
            "verificationMethod" = 'processor_verification',
            "processorVerified" = true,
            "receivedAt" = ${input.receivedAt},
            "actorId" = NULL,
            "note" = ${`Stripe signed webhook verified payment. Processor event ${input.eventId}. Manual reconciliation evidence was upgraded to processor verification.`}
        WHERE "id" = ${evidence.id}
      `);
    }

    const now = new Date();
    const reviewDueAt = new Date(now.getTime() + configuredLuxeBookingReviewMinutes() * 60 * 1000);
    const nextFollowUp = !lead.followUpDueAt || lead.followUpDueAt > reviewDueAt ? reviewDueAt : lead.followUpDueAt;
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        paymentStatus: "processor_verified",
        followUpDueAt: nextFollowUp,
      },
    });

    const openBookingTask = await tx.task.findFirst({
      where: {
        organizationId: organization.id,
        category: "lead_booking",
        status: { not: "completed" },
        details: { contains: `lead:${lead.id}` },
      },
      select: { id: true, dueAt: true },
    });
    let taskId = openBookingTask?.id ?? null;
    if (openBookingTask) {
      if (!openBookingTask.dueAt || openBookingTask.dueAt > reviewDueAt) {
        await tx.task.update({ where: { id: openBookingTask.id }, data: { dueAt: reviewDueAt, priority: "high" } });
      }
    } else {
      const task = await tx.task.create({
        data: {
          organizationId: organization.id,
          category: "lead_booking",
          title: `Confirm appointment after deposit for ${lead.name}`,
          details: `lead:${lead.id} Stripe verified a deposit for ${lead.serviceInterest ?? "a Luxe service"}. Payment evidence is authoritative for money only. Confirm the actual appointment/availability before marking this lead booked.`,
          ownerId: lead.assignedTo,
          priority: "high",
          riskLevel: RiskLevel.NEEDS_STAFF,
          dueAt: reviewDueAt,
          status: "open",
          createdBy: null,
        },
      });
      taskId = task.id;
    }

    const event = await tx.leadEvent.create({
      data: {
        organizationId: organization.id,
        leadId: lead.id,
        eventType: "payment_verified_processor",
        fromStatus: lead.paymentStatus,
        toStatus: "processor_verified",
        note: "Stripe signed webhook verified a deposit. Appointment confirmation remains separate.",
        metadata: {
          evidenceId,
          provider: "stripe",
          externalReference: input.externalReference,
          alternateExternalReference: input.alternateExternalReference,
          externalCheckoutId: input.externalCheckoutId,
          externalPaymentIntentId: input.externalPaymentIntentId,
          stripeEventId: input.eventId,
          amountCents: input.amountCents,
          currency: input.currency,
          paymentKind: "deposit",
          evidenceSource: "stripe_webhook",
          verificationMethod: "processor_verification",
          processorVerified: true,
          bookingVerified: false,
          bookingStatus: lead.bookingStatus,
          taskId,
          cardDataStored: false,
          upgradedManualEvidence,
          previousManualAmount,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        actorType: "system",
        action: "luxe.lead_payment_verified_processor",
        resourceType: "lead",
        resourceId: lead.id,
        metadata: {
          paymentEvidenceId: evidenceId,
          paymentEventId: event.id,
          provider: "stripe",
          externalReference: input.externalReference,
          alternateExternalReference: input.alternateExternalReference,
          stripeEventId: input.eventId,
          amountCents: input.amountCents,
          currency: input.currency,
          verificationMethod: "processor_verification",
          processorVerified: true,
          bookingVerified: false,
          taskId,
          upgradedManualEvidence,
          previousManualAmount,
        },
      },
    });

    return {
      recorded: true as const,
      idempotent: false as const,
      evidenceId,
      paymentStatus: "processor_verified" as const,
      bookingStatus: lead.bookingStatus,
      taskId,
    };
  });
}
