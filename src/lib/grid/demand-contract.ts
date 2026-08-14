import { z } from "zod";

export const gridDemandKinds = [
  "work",
  "provider",
  "space",
  "product",
  "equipment",
  "service",
  "network",
  "education",
  "organization",
  "referral",
] as const;

export const gridDemandSchema = z.object({
  kind: z.enum(gridDemandKinds),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(8).max(2000),
  category: z.string().trim().min(2).max(100),
  serviceName: z.string().trim().min(2).max(140).optional().nullable(),
  requestedStartAt: z.string().datetime({ offset: true }).optional().nullable(),
  requestedEndAt: z.string().datetime({ offset: true }).optional().nullable(),
  locationType: z.string().trim().min(2).max(80).optional().nullable(),
  city: z.string().trim().min(2).max(100).optional().nullable(),
  state: z.string().trim().min(2).max(40).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  radiusMiles: z.number().int().min(0).max(500).optional().nullable(),
  maxPriceCents: z.number().int().min(0).max(100_000_000).optional().nullable(),
  quantity: z.number().int().min(1).max(100_000).default(1),
  requiresClinicalEligibility: z.boolean().default(false),
  requirements: z.array(z.string().trim().min(1).max(160)).max(40).default([]),
}).superRefine((value, ctx) => {
  if (value.requestedEndAt && value.requestedStartAt && value.requestedEndAt <= value.requestedStartAt) {
    ctx.addIssue({ code: "custom", path: ["requestedEndAt"], message: "End time must be after start time." });
  }
  if ((value.latitude == null) !== (value.longitude == null)) {
    ctx.addIssue({ code: "custom", path: ["latitude"], message: "Latitude and longitude must be supplied together." });
  }
});

export type GridDemand = z.infer<typeof gridDemandSchema>;

export function gridDemandToMatchInput(demand: GridDemand) {
  if (!demand.requestedStartAt) return null;
  return {
    category: demand.category,
    serviceName: demand.serviceName,
    requestedStartAt: new Date(demand.requestedStartAt),
    requestedEndAt: demand.requestedEndAt ? new Date(demand.requestedEndAt) : null,
    locationType: demand.locationType,
    maxPriceCents: demand.maxPriceCents,
    requiresClinicalEligibility: demand.requiresClinicalEligibility,
  };
}
