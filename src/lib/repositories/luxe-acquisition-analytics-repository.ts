import "server-only";

import type { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { summarizeAcquisitionLeads, type LeadCollectedEvidence, type LatestTouch } from "@/lib/luxe-acquisition-analytics";
import { LUXE_MANUAL_PAYMENT_EVENT, LUXE_PROCESSOR_PAYMENT_EVENT } from "@/lib/luxe-payment-evidence-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";

function configuredSlaMinutes() {
  const parsed = Number.parseInt(process.env.LUXE_MEDI_LEAD_SLA_MINUTES ?? "15", 10);
  if (!Number.isFinite(parsed)) return 15;
  return Math.min(1440, Math.max(5, parsed));
}

function objectValue(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : null;
}

function stringValue(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: Prisma.JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value: Prisma.JsonValue | undefined) {
  return typeof value === "boolean" ? value : null;
}

function latestTouchFromMetadata(metadata: Prisma.JsonValue | null, occurredAt: Date): LatestTouch | null {
  const root = objectValue(metadata);
  const attribution = objectValue(root?.attribution);
  if (!attribution) return null;
  const source = stringValue(attribution.lastTouchSource) ?? stringValue(attribution.utmSource) ?? stringValue(attribution.firstTouchSource);
  const campaign = stringValue(attribution.utmCampaign) ?? stringValue(root?.campaignSource);
  const cta = stringValue(attribution.cta);
  if (!source && !campaign && !cta) return null;
  return { source, campaign, cta, occurredAt };
}

function addPaymentEvidence(
  map: Map<string, LeadCollectedEvidence>,
  event: { leadId: string; eventType: string; metadata: Prisma.JsonValue | null },
) {
  if (![LUXE_MANUAL_PAYMENT_EVENT, LUXE_PROCESSOR_PAYMENT_EVENT].includes(event.eventType)) return;
  const metadata = objectValue(event.metadata);
  const amountCents = numberValue(metadata?.amountCents);
  const verificationMethod = stringValue(metadata?.verificationMethod);
  const processorVerified = booleanValue(metadata?.processorVerified);
  if (!amountCents || amountCents <= 0) return;

  const current = map.get(event.leadId) ?? { manualReconciledCents: 0, processorVerifiedCents: 0 };
  if (event.eventType === LUXE_MANUAL_PAYMENT_EVENT && verificationMethod === "manual_reconciliation" && processorVerified === false) {
    current.manualReconciledCents += amountCents;
  }
  if (event.eventType === LUXE_PROCESSOR_PAYMENT_EVENT && verificationMethod === "processor_verification" && processorVerified === true) {
    current.processorVerifiedCents += amountCents;
  }
  map.set(event.leadId, current);
}

export async function getLuxeAcquisitionOperations(session: ClinicSession) {
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { id: true, slug: true, status: true },
  });
  if (!organization || organization.status !== "active" || organization.slug !== LUXE_ORGANIZATION_SLUG) {
    throw new NetworkAccessError("Luxe acquisition operations are not available for this organization.", 404);
  }

  const leads = await db.lead.findMany({
    where: { organizationId: session.organizationId },
    select: {
      id: true,
      name: true,
      source: true,
      campaignSource: true,
      serviceInterest: true,
      estimatedValueCents: true,
      status: true,
      pipelineStage: true,
      assignedTo: true,
      followUpDueAt: true,
      lastContactedAt: true,
      bookingStatus: true,
      paymentStatus: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });

  const latestTouches = new Map<string, LatestTouch>();
  const collectedEvidenceByLead = new Map<string, LeadCollectedEvidence>();
  if (leads.length) {
    const events = await db.leadEvent.findMany({
      where: { organizationId: session.organizationId, leadId: { in: leads.map((lead) => lead.id) } },
      select: { leadId: true, eventType: true, metadata: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    for (const event of events) {
      if (!latestTouches.has(event.leadId)) {
        const touch = latestTouchFromMetadata(event.metadata, event.createdAt);
        if (touch) latestTouches.set(event.leadId, touch);
      }
      addPaymentEvidence(collectedEvidenceByLead, event);
    }
  }

  const result = summarizeAcquisitionLeads(leads, {
    now: new Date(),
    slaMinutes: configuredSlaMinutes(),
    latestTouches,
    collectedEvidenceByLead,
  });

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "luxe.acquisition_operations_viewed",
      resourceType: "luxe_acquisition_operations",
      resourceId: session.organizationId,
      metadata: {
        leadCount: leads.length,
        openLeadCount: result.metrics.openLeads,
        atRiskLeadCount: result.metrics.atRiskLeads,
        manualReconciledRevenueCents: result.metrics.manualReconciledRevenueCents,
        processorVerifiedRevenueCents: result.metrics.processorVerifiedRevenueCents,
      },
    },
  });

  return result;
}
