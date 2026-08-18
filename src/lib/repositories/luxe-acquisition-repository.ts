import "server-only";

import { Prisma, RiskLevel } from "@prisma/client";
import { db } from "@/lib/db";
import {
  campaignSourceFromAttribution,
  leadResponsePriority,
  normalizeAttribution,
  normalizeLuxeEmail,
  normalizeLuxePhone,
  publicLuxeLeadSchema,
} from "@/lib/luxe-acquisition-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

const LUXE_ORGANIZATION_SLUG = process.env.LUXE_MEDI_ORGANIZATION_SLUG?.trim() || "luxe-medi";
const TERMINAL_LEAD_STATUSES = ["lost", "completed"];

function configuredFollowUpMinutes() {
  const parsed = Number.parseInt(process.env.LUXE_MEDI_LEAD_SLA_MINUTES ?? "15", 10);
  if (!Number.isFinite(parsed)) return 15;
  return Math.min(1440, Math.max(5, parsed));
}

async function findMatchingOpenLead(
  tx: Prisma.TransactionClient,
  organizationId: string,
  email: string | null,
  phone: string | null,
) {
  const candidateOr: Prisma.LeadWhereInput[] = [];
  if (email) candidateOr.push({ email: { equals: email, mode: "insensitive" } });
  if (phone) candidateOr.push({ phone: { not: null } });
  if (!candidateOr.length) return null;

  const candidates = await tx.lead.findMany({
    where: {
      organizationId,
      status: { notIn: TERMINAL_LEAD_STATUSES },
      OR: candidateOr,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return candidates.find((lead) => {
    const emailMatches = Boolean(email && normalizeLuxeEmail(lead.email) === email);
    const phoneMatches = Boolean(phone && normalizeLuxePhone(lead.phone) === phone);
    return emailMatches || phoneMatches;
  }) ?? null;
}

async function resolveService(tx: Prisma.TransactionClient, organizationId: string, serviceInterest?: string | null) {
  if (!serviceInterest) return null;
  return tx.luxeService.findFirst({
    where: {
      organizationId,
      status: "active",
      name: { equals: serviceInterest.trim(), mode: "insensitive" },
    },
    select: { id: true, name: true, priceCents: true },
  });
}

async function ensureLeadFollowUpTask(
  tx: Prisma.TransactionClient,
  organizationId: string,
  leadId: string,
  leadName: string,
  serviceName: string | null,
  dueAt: Date,
  priority: "high" | "normal",
) {
  const existing = await tx.task.findFirst({
    where: {
      organizationId,
      status: { not: "completed" },
      category: { in: ["luxe_lead_follow_up", "luxe_consultation", "lead_follow_up"] },
      details: { contains: `lead:${leadId}` },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const owner = await tx.user.findFirst({
    where: { organizationId, status: "active" },
    orderBy: [{ roleKey: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  if (!owner) return null;

  const task = await tx.task.create({
    data: {
      organizationId,
      category: "luxe_lead_follow_up",
      title: `Follow up with ${leadName}`,
      details: `lead:${leadId} ${serviceName ?? "Luxe website inquiry"}. Human follow-up is required; no appointment, payment, or treatment eligibility is implied.`,
      ownerId: owner.id,
      priority,
      riskLevel: priority === "high" ? RiskLevel.NEEDS_STAFF : RiskLevel.NORMAL,
      dueAt,
      status: "open",
      createdBy: owner.id,
    },
  });

  return task.id;
}

export async function ingestPublicLuxeLead(rawInput: unknown) {
  const input = publicLuxeLeadSchema.parse(rawInput);
  const email = normalizeLuxeEmail(input.email);
  const phone = normalizeLuxePhone(input.phone);
  if (input.phone && !phone) throw new NetworkAccessError("Phone number format is not valid.", 400);

  const attribution = normalizeAttribution(input.attribution);
  const campaignSource = campaignSourceFromAttribution(input.attribution);
  const dueAt = new Date(Date.now() + configuredFollowUpMinutes() * 60 * 1000);
  const priority = leadResponsePriority(input);

  return db.$transaction(async (tx) => {
    const organization = await tx.organization.findUnique({
      where: { slug: LUXE_ORGANIZATION_SLUG },
      select: { id: true, status: true },
    });
    if (!organization || organization.status !== "active") {
      throw new NetworkAccessError("Luxe lead intake is not available.", 503);
    }

    const service = await resolveService(tx, organization.id, input.serviceInterest);
    const serviceName = service?.name ?? input.serviceInterest ?? null;
    const existing = await findMatchingOpenLead(tx, organization.id, email, phone);

    if (existing) {
      const followUpDueAt = existing.followUpDueAt && existing.followUpDueAt < dueAt ? existing.followUpDueAt : dueAt;
      const lead = await tx.lead.update({
        where: { id: existing.id },
        data: {
          email: existing.email ?? email,
          phone: existing.phone ?? phone,
          campaignSource: existing.campaignSource ?? campaignSource,
          serviceInterest: existing.serviceInterest ?? serviceName,
          appointmentInterest: input.appointmentInterest ?? existing.appointmentInterest,
          followUpDueAt,
          notes: existing.notes ?? input.message ?? null,
        },
      });
      const taskId = await ensureLeadFollowUpTask(tx, organization.id, lead.id, lead.name, serviceName, followUpDueAt, priority);

      await tx.leadEvent.create({
        data: {
          organizationId: organization.id,
          leadId: lead.id,
          eventType: "luxe_website_touch",
          fromStatus: existing.status,
          toStatus: lead.status,
          note: "A returning Luxe website inquiry matched an existing open lead; first-touch attribution was preserved.",
          metadata: {
            attribution,
            latestServiceInterest: serviceName,
            preferredContactMethod: input.preferredContactMethod ?? null,
            preferredTiming: input.preferredTiming ?? null,
            contactConsent: input.contactConsent,
            marketingConsent: input.marketingConsent,
            duplicateOpenLead: true,
            taskId,
          },
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          actorType: "system",
          action: "luxe.public_lead_deduplicated",
          resourceType: "lead",
          resourceId: lead.id,
          metadata: { taskId, serviceMatched: Boolean(service), estimatedValueCents: lead.estimatedValueCents },
        },
      });

      return {
        leadId: lead.id,
        created: false,
        taskId,
        serviceMatched: Boolean(service),
        estimatedOpportunityCents: lead.estimatedValueCents,
        status: "captured" as const,
      };
    }

    const lead = await tx.lead.create({
      data: {
        organizationId: organization.id,
        name: input.name,
        email,
        phone,
        source: "luxe_website",
        campaignSource,
        serviceInterest: serviceName,
        appointmentInterest: input.appointmentInterest ?? input.preferredTiming ?? "Website inquiry",
        estimatedValueCents: service?.priceCents ?? 0,
        pipelineStage: "new",
        status: "new",
        followUpDueAt: dueAt,
        notes: input.message ?? null,
        consentStatus: "not_recorded",
      },
    });
    const taskId = await ensureLeadFollowUpTask(tx, organization.id, lead.id, lead.name, serviceName, dueAt, priority);

    await tx.leadEvent.create({
      data: {
        organizationId: organization.id,
        leadId: lead.id,
        eventType: "luxe_website_received",
        toStatus: lead.status,
        note: "Luxe website inquiry captured into the existing Klinikos CRM for human follow-up.",
        metadata: {
          attribution,
          preferredContactMethod: input.preferredContactMethod ?? null,
          preferredTiming: input.preferredTiming ?? null,
          contactConsent: input.contactConsent,
          marketingConsent: input.marketingConsent,
          serviceId: service?.id ?? null,
          serviceMatched: Boolean(service),
          taskId,
          noAppointmentConfirmation: true,
          noPaymentConfirmation: true,
          noClinicalEligibilityDecision: true,
        },
      },
    });
    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        actorType: "system",
        action: "luxe.public_lead_received",
        resourceType: "lead",
        resourceId: lead.id,
        metadata: {
          taskId,
          serviceMatched: Boolean(service),
          estimatedValueCents: lead.estimatedValueCents,
          attributionPresent: Object.keys(attribution).length > 0,
        },
      },
    });

    return {
      leadId: lead.id,
      created: true,
      taskId,
      serviceMatched: Boolean(service),
      estimatedOpportunityCents: lead.estimatedValueCents,
      status: "captured" as const,
    };
  });
}
