import "server-only";

import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { buildConsultationDocumentEvidence } from "@/lib/referral-consultation-evidence";
import { nextReferralStatus, transitionReferralSchema } from "@/lib/referral-rules";
import { requireActiveAccessConsent } from "@/lib/repositories/consent-repository";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import { requireActiveAgreement, requireActiveConnection } from "@/lib/repositories/network-access-repository";

const inboundVisibleStatuses = [
  "sent", "received", "accepted", "declined", "scheduled", "completed", "consultation_received", "closed",
];

export async function recordReferralConsultation(session: ClinicSession, referralId: string, rawInput: unknown) {
  if (!can(session.role, "referrals", "update")) {
    throw new NetworkAccessError("Referral update permission is required.", 403);
  }

  const input = transitionReferralSchema.parse(rawInput);
  if (input.action !== "consultation_received") {
    throw new NetworkAccessError("This transaction only records returned consultations.", 400);
  }

  const now = new Date();
  return db.$transaction(async (tx) => {
    const referral = await tx.referral.findFirst({
      where: {
        id: referralId,
        OR: [
          { organizationId: session.organizationId },
          { destinationOrganizationId: session.organizationId, status: { in: inboundVisibleStatuses } },
        ],
      },
    });
    if (!referral) throw new NetworkAccessError("Referral not found in this organization workspace.", 404);

    const direction = referral.organizationId === session.organizationId ? "outbound" as const : "inbound" as const;
    const nextStatus = nextReferralStatus({
      status: referral.status,
      deliveryStatus: referral.deliveryStatus,
      destinationType: referral.destinationType,
      direction,
    }, input.action);
    if (nextStatus !== "consultation_received") {
      throw new NetworkAccessError("That referral action is not allowed from the current state or organization.", 409);
    }

    if (direction === "inbound" && referral.destinationOrganizationId) {
      await requireActiveConnection(tx, referral.organizationId, referral.destinationOrganizationId, "treatment");
      await requireActiveAgreement(
        tx,
        referral.organizationId,
        referral.destinationOrganizationId,
        "treatment",
        ["demographics", "referrals"],
      );
      await requireActiveAccessConsent(tx, {
        sourceOrganizationId: referral.organizationId,
        patientId: referral.patientId,
        requestingOrganizationId: referral.destinationOrganizationId,
        requestingUserId: session.userId,
        purposeOfUse: "treatment",
        categories: ["demographics", "referrals"],
      });
    }

    let consultationDocumentId: string | null = null;
    if (input.consultationNoteDocumentId) {
      if (!can(session.role, "documents", "read") || !can(session.role, "documents", "update")) {
        throw new NetworkAccessError("Document read and update permission is required to attach consultation evidence.", 403);
      }

      const document = await tx.document.findFirst({
        where: {
          id: input.consultationNoteDocumentId,
          organizationId: session.organizationId,
          patientId: referral.patientId,
        },
        select: {
          id: true,
          organizationId: true,
          patientId: true,
          referralId: true,
          name: true,
          version: true,
          sourceType: true,
          status: true,
          reviewStatus: true,
          expiresAt: true,
        },
      });
      if (!document) {
        throw new NetworkAccessError("The consultation document is not available to this organization.", 400);
      }

      let evidence: ReturnType<typeof buildConsultationDocumentEvidence>;
      try {
        evidence = buildConsultationDocumentEvidence(document, {
          referralId: referral.id,
          patientId: referral.patientId,
          destinationOrganizationId: session.organizationId,
          now,
        });
      } catch (error) {
        throw new NetworkAccessError(
          error instanceof Error ? error.message : "The consultation document is not eligible for referral return.",
          409,
        );
      }

      const expectedReferralId = evidence.referralBinding === "bind_on_receipt" ? null : referral.id;
      const bound = await tx.document.updateMany({
        where: {
          id: document.id,
          organizationId: session.organizationId,
          patientId: referral.patientId,
          referralId: expectedReferralId,
          status: "active",
          reviewStatus: "approved",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: { referralId: referral.id },
      });
      if (bound.count !== 1) {
        throw new NetworkAccessError("Consultation document changed. Refresh and try again.", 409);
      }

      if (evidence.referralBinding === "bind_on_receipt") {
        await tx.documentEvent.create({
          data: {
            organizationId: session.organizationId,
            documentId: document.id,
            actorId: session.userId,
            eventType: "referral_linked",
            fromStatus: document.reviewStatus,
            toStatus: document.reviewStatus,
            metadata: { referralId: referral.id, purpose: "consultation_return" },
          },
        });
        await tx.auditLog.create({
          data: {
            organizationId: session.organizationId,
            actorId: session.userId,
            actorType: "user",
            action: "document.referral_linked",
            resourceType: "document",
            resourceId: document.id,
            patientId: referral.patientId,
            metadata: { referralId: referral.id, purpose: "consultation_return" },
          },
        });
      }

      consultationDocumentId = evidence.documentId;
    }

    const updated = await tx.referral.updateMany({
      where: {
        id: referral.id,
        status: referral.status,
        deliveryStatus: referral.deliveryStatus,
      },
      data: {
        status: "consultation_received",
        consultationNoteReceivedAt: now,
        consultationNoteDocumentId: consultationDocumentId,
        specialistResponse: input.specialistResponse,
      },
    });
    if (updated.count !== 1) throw new NetworkAccessError("The referral changed. Refresh and try again.", 409);

    if (referral.orderId) {
      await tx.clinicalOrder.updateMany({
        where: {
          id: referral.orderId,
          organizationId: referral.organizationId,
          patientId: referral.patientId,
        },
        data: { status: "result_received" },
      });
    }

    const auditOrganizationIds = referral.destinationOrganizationId
      ? [referral.organizationId, referral.destinationOrganizationId]
      : [referral.organizationId];

    await tx.referralEvent.createMany({
      data: auditOrganizationIds.map((organizationId) => ({
        organizationId,
        referralId: referral.id,
        actorId: session.userId,
        eventType: "consultation_received",
        fromStatus: referral.status,
        toStatus: "consultation_received",
        deliveryMethod: referral.deliveryMethod,
        note: input.note,
        metadata: {
          representedOrganizationId: session.organizationId,
          direction,
          consultationNoteDocumentId: consultationDocumentId,
          evidenceType: consultationDocumentId ? "reviewed_document" : "specialist_response",
        },
      })),
    });

    await tx.auditLog.createMany({
      data: auditOrganizationIds.map((organizationId) => ({
        organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "referral.consultation_received",
        resourceType: "referral",
        resourceId: referral.id,
        patientId: referral.patientId,
        changes: {
          status: { from: referral.status, to: "consultation_received" },
          deliveryStatus: { from: referral.deliveryStatus, action: "consultation_received" },
        },
        metadata: {
          representedOrganizationId: session.organizationId,
          direction,
          destinationType: referral.destinationType,
          deliveryMethod: referral.deliveryMethod,
          consultationNoteDocumentId: consultationDocumentId,
        },
      })),
    });

    return tx.referral.findUniqueOrThrow({ where: { id: referral.id } });
  });
}
