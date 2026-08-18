import "server-only";

import type { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { summarizeAcquisitionLeads, type LatestTouch } from "@/lib/luxe-acquisition-analytics";
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
  if (leads.length) {
    const events = await db.leadEvent.findMany({
      where: { organizationId: session.organizationId, leadId: { in: leads.map((lead) => lead.id) } },
      select: { leadId: true, metadata: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 3000,
    });
    for (const event of events) {
      if (latestTouches.has(event.leadId)) continue;
      const touch = latestTouchFromMetadata(event.metadata, event.createdAt);
      if (touch) latestTouches.set(event.leadId, touch);
    }
  }

  const result = summarizeAcquisitionLeads(leads, {
    now: new Date(),
    slaMinutes: configuredSlaMinutes(),
    latestTouches,
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
        verifiedRevenueAvailable: false,
      },
    },
  });

  return result;
}
