import { NextResponse } from "next/server";
import { z } from "zod";
import { getClinicSession } from "@/lib/auth/session";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { db } from "@/lib/db";
import { rankGridMatches } from "@/lib/grid/matching-engine";

const matchPreviewSchema = z.object({
  category: z.string().trim().min(2).max(100),
  serviceName: z.string().trim().min(2).max(140).optional().nullable(),
  requestedStartAt: z.string().datetime({ offset: true }),
  requestedEndAt: z.string().datetime({ offset: true }).optional().nullable(),
  locationType: z.string().trim().min(2).max(80).optional().nullable(),
  maxPriceCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  requiresClinicalEligibility: z.boolean().default(false),
}).refine((value) => !value.requestedEndAt || value.requestedEndAt > value.requestedStartAt, {
  path: ["requestedEndAt"],
  message: "End time must be after start time.",
});

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "grid", "read", { request });
  if (denied) return denied;

  try {
    const parsed = matchPreviewSchema.parse(await request.json());
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

    const matches = rankGridMatches(candidates, {
      category: parsed.category,
      serviceName: parsed.serviceName,
      requestedStartAt: new Date(parsed.requestedStartAt),
      requestedEndAt: parsed.requestedEndAt ? new Date(parsed.requestedEndAt) : null,
      locationType: parsed.locationType,
      maxPriceCents: parsed.maxPriceCents,
      requiresClinicalEligibility: parsed.requiresClinicalEligibility,
    });
    const serviceById = new Map(services.map((service) => [service.id, service]));

    return NextResponse.json({
      data: matches.slice(0, 25).map((match) => {
        const service = serviceById.get(match.serviceId);
        return {
          ...match,
          providerName: service?.provider.displayName ?? "Verified Grid professional",
          providerType: service?.provider.providerType ?? null,
          specialty: service?.provider.specialty ?? null,
          serviceName: service?.serviceName ?? "Grid service",
          category: service?.category ?? parsed.category,
          priceLowCents: service?.priceLowCents ?? null,
          priceHighCents: service?.priceHighCents ?? null,
          requiresDeposit: service?.requiresDeposit ?? false,
          requiresMedicalReview: service?.requiresMedicalReview ?? false,
          onCallNow: service?.provider.onCallNow ?? false,
        };
      }),
    });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
