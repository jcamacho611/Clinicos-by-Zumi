import "server-only";

import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import { rankGridMatches } from "@/lib/grid/matching-engine";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type DemandRow = {
  id: string;
  organizationId: string;
  kind: string;
  title: string;
  description: string;
  category: string;
  serviceName: string | null;
  requestedStartAt: Date | null;
  requestedEndAt: Date | null;
  locationType: string | null;
  city: string | null;
  state: string | null;
  radiusMiles: number | null;
  maxPriceCents: number | null;
  quantity: number;
  requiresClinicalEligibility: boolean;
  requirements: Prisma.JsonValue;
  status: string;
};

type ResourceRow = {
  id: string;
  organizationId: string;
  createdBy: string;
  resourceType: string;
  subtype: string | null;
  title: string;
  description: string;
  policyClass: string;
  visibility: string;
  status: string;
  city: string | null;
  state: string | null;
  pricingModel: string;
  priceCents: number | null;
  capacity: number;
  reviewStatus: string;
  metadata: Prisma.JsonValue | null;
};

type AvailabilityRow = {
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  status: string;
};

const resourceKinds: Record<string, readonly string[]> = {
  space: ["space"],
  product: ["product"],
  equipment: ["equipment"],
  service: ["service"],
  network: ["organization_capacity", "referral"],
  education: ["education"],
  organization: ["organization_capacity"],
  referral: ["referral"],
};

function list(value: Prisma.JsonValue | null | undefined, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const candidate = (value as Record<string, unknown>)[key];
  return Array.isArray(candidate) ? candidate.filter((item): item is string => typeof item === "string") : [];
}

function overlaps(demand: DemandRow, slots: AvailabilityRow[]) {
  if (!demand.requestedStartAt) return slots.length > 0;
  return slots.some((slot) => {
    if (slot.status !== "active" || slot.endsAt <= demand.requestedStartAt!) return false;
    if (demand.requestedEndAt && slot.startsAt >= demand.requestedEndAt) return false;
    return slot.capacity >= demand.quantity;
  });
}

function textFit(demand: DemandRow, resource: ResourceRow) {
  const haystack = `${resource.title} ${resource.description} ${resource.subtype ?? ""}`.toLowerCase();
  const terms = [demand.category, demand.serviceName ?? ""]
    .flatMap((value) => value.toLowerCase().split(/[^a-z0-9]+/))
    .filter((value) => value.length >= 3);
  return terms.length === 0 || terms.some((term) => haystack.includes(term));
}

function resourceDiscovery(demand: DemandRow, resource: ResourceRow, slots: AvailabilityRow[]) {
  const reasons: string[] = [];
  let score = 50;

  if (resource.status !== "active" || resource.reviewStatus !== "approved") return null;
  if (!resourceKinds[demand.kind]?.includes(resource.resourceType)) return null;

  const sameOrganization = resource.organizationId === demand.organizationId;
  const purposeBoundMatch = resource.visibility === "matched_only";
  if (!sameOrganization && resource.visibility !== "public" && !purposeBoundMatch) return null;
  if (demand.state && resource.state && demand.state.toLowerCase() !== resource.state.toLowerCase()) return null;
  if (demand.maxPriceCents != null && resource.priceCents != null && resource.priceCents > demand.maxPriceCents) return null;
  if (resource.capacity < demand.quantity) return null;

  const capacityClass = ["healthcare_space", "equipment_capacity", "education_capacity", "referral_capacity"].includes(resource.policyClass);
  if (capacityClass && !overlaps(demand, slots)) return null;

  if (purposeBoundMatch && !sameOrganization) {
    score += 5;
    reasons.push("This resource is match-only and is being disclosed only because it fits this authenticated saved need.");
  }
  if (demand.city && resource.city && demand.city.toLowerCase() === resource.city.toLowerCase()) {
    score += 15;
    reasons.push("Same city as the saved need.");
  } else if (demand.state && resource.state && demand.state.toLowerCase() === resource.state.toLowerCase()) {
    score += 8;
    reasons.push("Same state as the saved need.");
  }
  if (capacityClass && slots.length) {
    score += 15;
    reasons.push("Reviewed availability overlaps the requested capacity window.");
  }
  if (demand.maxPriceCents != null && resource.priceCents != null && resource.priceCents <= demand.maxPriceCents) {
    score += 10;
    reasons.push("Listed price is within the saved budget ceiling.");
  }
  if (textFit(demand, resource)) {
    score += 10;
    reasons.push("Listing text aligns with the requested category or service.");
  }

  const unresolvedRequirements = Array.isArray(demand.requirements)
    ? demand.requirements.filter((item): item is string => typeof item === "string")
    : [];

  return {
    candidateKind: "resource" as const,
    id: resource.id,
    organizationId: resource.organizationId,
    resourceType: resource.resourceType,
    policyClass: resource.policyClass,
    title: resource.title,
    description: resource.description,
    city: resource.city,
    state: resource.state,
    pricingModel: resource.pricingModel,
    priceCents: resource.priceCents,
    capacity: resource.capacity,
    score,
    reasons,
    reviewStatus: resource.reviewStatus,
    credentialRequirements: list(resource.metadata, "credentialRequirements"),
    insuranceRequirements: list(resource.metadata, "insuranceRequirements"),
    operatorRequirements: list(resource.metadata, "operatorRequirements"),
    usageRestrictions: list(resource.metadata, "usageRestrictions"),
    unresolvedRequirements,
    transactionEligible: false,
    nextGate: "Offer creation must re-check authorization, availability, policy, and any unresolved requirements.",
  };
}

async function findDemand(session: ClinicSession, demandId: string) {
  const rows = await db.$queryRaw<DemandRow[]>(Prisma.sql`
    SELECT * FROM "GridDemandRecord"
    WHERE "id" = ${demandId} AND "organizationId" = ${session.organizationId}
    LIMIT 1
  `);
  const demand = rows[0];
  if (!demand) throw new NetworkAccessError("Grid need not found.", 404);
  if (!["open", "matched", "offered"].includes(demand.status)) {
    throw new NetworkAccessError("This Grid need is not currently discoverable.", 409);
  }
  return demand;
}

async function discoverProfessionalCandidates(demand: DemandRow) {
  if (!demand.requestedStartAt) return [];
  const services = await db.gridServiceListing.findMany({
    where: {
      status: "active",
      provider: { status: "active", verificationStatus: "verified" },
    },
    include: {
      provider: {
        include: {
          availability: {
            where: { status: "active" },
            orderBy: [{ weekday: "asc" }, { startsAt: "asc" }],
          },
        },
      },
    },
    take: 250,
  });

  const candidates = services.map((service) => ({
    provider: {
      id: service.provider.id,
      verificationStatus: service.provider.verificationStatus,
      malpracticeVerificationStatus: service.provider.malpracticeVerificationStatus,
      travelRadiusMiles: service.provider.travelRadiusMiles,
      onCallNow: service.provider.onCallNow,
      servicesOffered: service.provider.servicesOffered,
      serviceLocations: service.provider.serviceLocations,
    },
    service: {
      id: service.id,
      serviceName: service.serviceName,
      category: service.category,
      priceLowCents: service.priceLowCents,
      priceHighCents: service.priceHighCents,
      requiresMedicalReview: service.requiresMedicalReview,
    },
    availability: service.provider.availability.map((slot) => ({
      weekday: slot.weekday,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      locationType: slot.locationType,
      status: slot.status,
    })),
  }));

  const ranked = rankGridMatches(candidates, {
    category: demand.category,
    serviceName: demand.serviceName,
    requestedStartAt: demand.requestedStartAt,
    requestedEndAt: demand.requestedEndAt,
    locationType: demand.locationType,
    maxPriceCents: demand.maxPriceCents,
    requiresClinicalEligibility: demand.requiresClinicalEligibility,
  });
  const serviceById = new Map(services.map((service) => [service.id, service]));

  return ranked.slice(0, 25).map((match) => {
    const service = serviceById.get(match.serviceId);
    return {
      candidateKind: "professional" as const,
      id: match.providerId,
      providerId: match.providerId,
      serviceListingId: match.serviceId,
      providerName: service?.provider.displayName ?? "Verified Grid professional",
      providerType: service?.provider.providerType ?? null,
      specialty: service?.provider.specialty ?? null,
      serviceName: service?.serviceName ?? demand.serviceName ?? demand.category,
      category: service?.category ?? demand.category,
      priceLowCents: service?.priceLowCents ?? null,
      priceHighCents: service?.priceHighCents ?? null,
      onCallNow: service?.provider.onCallNow ?? false,
      score: match.score,
      reasons: ["Verified professional profile.", "Availability, service, budget, and required malpractice gates passed the deterministic match engine."],
      transactionEligible: false,
      nextGate: "Offer creation re-checks eligibility and reservation requirements against current authoritative state.",
    };
  });
}

export async function discoverGridCandidatesForSavedNeed(session: ClinicSession, demandId: string) {
  const demand = await findDemand(session, demandId);

  if (["work", "provider"].includes(demand.kind)) {
    return {
      demand: {
        ...demand,
        requirements: Array.isArray(demand.requirements) ? demand.requirements : [],
        requestedStartAt: demand.requestedStartAt?.toISOString() ?? null,
        requestedEndAt: demand.requestedEndAt?.toISOString() ?? null,
      },
      candidates: await discoverProfessionalCandidates(demand),
      mode: "verified_professional" as const,
    };
  }

  const resourceTypes = resourceKinds[demand.kind] ?? [];
  if (!resourceTypes.length) {
    return {
      demand: {
        ...demand,
        requirements: Array.isArray(demand.requirements) ? demand.requirements : [],
        requestedStartAt: demand.requestedStartAt?.toISOString() ?? null,
        requestedEndAt: demand.requestedEndAt?.toISOString() ?? null,
      },
      candidates: [],
      mode: "unavailable" as const,
    };
  }

  const resources = await db.$queryRaw<ResourceRow[]>(Prisma.sql`
    SELECT * FROM "GridResourceRecord"
    WHERE "status" = 'active'
      AND "reviewStatus" = 'approved'
      AND "resourceType" IN (${Prisma.join(resourceTypes)})
    ORDER BY "updatedAt" DESC
    LIMIT 500
  `);
  const ids = resources.map((resource) => resource.id);
  const availability = ids.length
    ? await db.$queryRaw<AvailabilityRow[]>(Prisma.sql`
        SELECT "resourceId", "startsAt", "endsAt", "capacity", "status"
        FROM "GridResourceAvailabilityRecord"
        WHERE "resourceId" IN (${Prisma.join(ids)})
          AND "status" = 'active'
          AND "endsAt" > CURRENT_TIMESTAMP
        ORDER BY "startsAt"
      `)
    : [];
  const slotsByResource = new Map<string, AvailabilityRow[]>();
  for (const slot of availability) slotsByResource.set(slot.resourceId, [...(slotsByResource.get(slot.resourceId) ?? []), slot]);

  const candidates = resources
    .map((resource) => resourceDiscovery(demand, resource, slotsByResource.get(resource.id) ?? []))
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 50);

  return {
    demand: {
      ...demand,
      requirements: Array.isArray(demand.requirements) ? demand.requirements : [],
      requestedStartAt: demand.requestedStartAt?.toISOString() ?? null,
      requestedEndAt: demand.requestedEndAt?.toISOString() ?? null,
    },
    candidates,
    mode: "reviewed_resource" as const,
  };
}

export type GridSavedNeedDiscovery = Awaited<ReturnType<typeof discoverGridCandidatesForSavedNeed>>;
