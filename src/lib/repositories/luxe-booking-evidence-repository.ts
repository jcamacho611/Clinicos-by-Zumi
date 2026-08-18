import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import {
  LUXE_BOOKING_VERIFIED_MANUAL_EVENT,
  luxeBookingEvidenceRequiredForOrganization,
  manualLuxeBookingEvidenceSchema,
} from "@/lib/luxe-booking-evidence-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const TERMINAL_LEAD_STATUSES = new Set(["lost", "completed"]);
const VERIFIED_BOOKING_STATUSES = new Set(["booked", "completed"]);

type BookingEvidenceRow = {
  id: string;
  leadId: string;
  scheduledAt: Date;
  evidenceSource: string;
  verificationMethod: string;
  sourceVerified: boolean;
};

async function findEvidence(
  tx: Prisma.TransactionClient,
  organizationId: string,
  provider: string,
  externalReference: string,
) {
  const rows = await tx.$queryRaw<BookingEvidenceRow[]>(Prisma.sql`
    SELECT "id", "leadId", "scheduledAt", "evidenceSource", "verificationMethod", "sourceVerified"
    FROM "luxe_lead_booking_evidence"
    WHERE "organizationId" = ${organizationId}
      AND "provider" = ${provider}
      AND "externalReference" = ${externalReference}
    LIMIT 1
    FOR UPDATE
  `);
  return rows[0] ?? null;
}

function sameManualEvidence(
  evidence: BookingEvidenceRow,
  leadId: string,
  scheduledAt: Date,
  evidenceSource: string,
) {
  return evidence.leadId === leadId
    && evidence.scheduledAt.getTime() === scheduledAt.getTime()
    && evidence.evidenceSource === evidenceSource
    && evidence.verificationMethod === "manual_reconciliation"
    && evidence.sourceVerified;
}

export async function recordManualLuxeBookingEvidence(
  session: ClinicSession,
  leadId: string,
  rawInput: unknown,
) {
  const input = manualLuxeBookingEvidenceSchema.parse(rawInput);
  if (!luxeBookingEvidenceRequiredForOrganization(session.organizationSlug)) {
    throw new NetworkAccessError("Luxe booking verification is not available for this organization.", 404);
  }

  const scheduledAt = new Date(input.scheduledAt);
  const receivedAt = new Date(input.receivedAt);

  return db.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id: leadId, organizationId: session.organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        pipelineStage: true,
        bookingStatus: true,
        paymentStatus: true,
        assignedTo: true,
      },
    });
    if (!lead) throw new NetworkAccessError("Lead not found for this organization.", 404);
    if (TERMINAL_LEAD_STATUSES.has(lead.status)) {
      throw new NetworkAccessError("A closed Luxe lead cannot be newly verified as booked.", 409);
    }

    const existing = await findEvidence(tx, session.organizationId, input.provider, input.externalReference);
    if (existing) {
      if (!sameManualEvidence(existing, lead.id, scheduledAt, input.evidenceSource)) {
        throw new NetworkAccessError("This booking reference is already linked to different evidence.", 409);
      }
      if (!VERIFIED_BOOKING_STATUSES.has(lead.bookingStatus) && lead.status !== "booked") {
        throw new NetworkAccessError("Existing booking evidence does not match the current lead state and needs review.", 409);
      }
      return {
        evidenceId: existing.id,
        eventId: null,
        inserted: false,
        bookingStatus: lead.bookingStatus,
        paymentStatus: lead.paymentStatus,
      };
    }

    if (VERIFIED_BOOKING_STATUSES.has(lead.bookingStatus) || lead.status === "booked") {
      throw new NetworkAccessError("This Luxe lead is already verified as booked.", 409);
    }

    const evidenceId = randomUUID();
    const inserted = await tx.$queryRaw<BookingEvidenceRow[]>(Prisma.sql`
      INSERT INTO "luxe_lead_booking_evidence" (
        "id", "organizationId", "leadId", "provider", "externalReference", "scheduledAt",
        "evidenceSource", "verificationMethod", "sourceVerified", "receivedAt", "actorId", "note"
      ) VALUES (
        ${evidenceId}, ${session.organizationId}, ${lead.id}, ${input.provider}, ${input.externalReference}, ${scheduledAt},
        ${input.evidenceSource}, 'manual_reconciliation', true, ${receivedAt}, ${session.userId}, ${input.note}
      )
      ON CONFLICT ("organizationId", "provider", "externalReference") DO NOTHING
      RETURNING "id", "leadId", "scheduledAt", "evidenceSource", "verificationMethod", "sourceVerified"
    `);

    let evidence = inserted[0] ?? null;
    if (!evidence) {
      evidence = await findEvidence(tx, session.organizationId, input.provider, input.externalReference);
      if (!evidence || !sameManualEvidence(evidence, lead.id, scheduledAt, input.evidenceSource)) {
        throw new NetworkAccessError("This booking reference is already linked to different evidence.", 409);
      }
      return {
        evidenceId: evidence.id,
        eventId: null,
        inserted: false,
        bookingStatus: lead.bookingStatus,
        paymentStatus: lead.paymentStatus,
      };
    }

    const now = new Date();
    const updated = await tx.lead.update({
      where: { id: lead.id },
      data: {
        status: "booked",
        pipelineStage: "booked",
        bookingStatus: "booked",
        followUpDueAt: null,
      },
      select: { status: true, pipelineStage: true, bookingStatus: true, paymentStatus: true },
    });

    await tx.task.updateMany({
      where: {
        organizationId: session.organizationId,
        category: { in: ["lead_follow_up", "lead_reactivation", "lead_booking"] },
        details: { contains: `lead:${lead.id}` },
        status: { not: "completed" },
      },
      data: { status: "completed", completedAt: now },
    });

    const event = await tx.leadEvent.create({
      data: {
        organizationId: session.organizationId,
        leadId: lead.id,
        actorId: session.userId,
        eventType: LUXE_BOOKING_VERIFIED_MANUAL_EVENT,
        fromStatus: lead.bookingStatus,
        toStatus: "booked",
        note: input.note,
        metadata: {
          evidenceId: evidence.id,
          provider: input.provider,
          externalReference: input.externalReference,
          scheduledAt: input.scheduledAt,
          evidenceSource: input.evidenceSource,
          receivedAt: input.receivedAt,
          verificationMethod: "manual_reconciliation",
          sourceVerified: true,
          bookingVerified: true,
          paymentStatus: lead.paymentStatus,
          paymentVerified: ["manual_reconciled", "processor_verified"].includes(lead.paymentStatus),
          treatmentEligibilityVerified: false,
          fulfillmentVerified: false,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "luxe.lead_booking_verified_manual",
        resourceType: "lead",
        resourceId: lead.id,
        changes: {
          status: { from: lead.status, to: updated.status },
          pipelineStage: { from: lead.pipelineStage, to: updated.pipelineStage },
          bookingStatus: { from: lead.bookingStatus, to: updated.bookingStatus },
        },
        metadata: {
          bookingEvidenceId: evidence.id,
          bookingEventId: event.id,
          provider: input.provider,
          externalReference: input.externalReference,
          scheduledAt: input.scheduledAt,
          evidenceSource: input.evidenceSource,
          verificationMethod: "manual_reconciliation",
          sourceVerified: true,
          paymentStatus: lead.paymentStatus,
          paymentChanged: false,
        },
      },
    });

    return {
      evidenceId: evidence.id,
      eventId: event.id,
      inserted: true,
      bookingStatus: updated.bookingStatus,
      paymentStatus: updated.paymentStatus,
    };
  });
}
