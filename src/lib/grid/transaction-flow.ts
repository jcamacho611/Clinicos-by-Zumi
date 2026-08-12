import { z } from "zod";
import { gridDemandSchema } from "@/lib/grid/demand";

export const gridDemandStatuses = ["draft", "open", "matched", "offered", "reserved", "fulfilled", "cancelled", "expired"] as const;
export const gridOfferStatuses = ["draft", "sent", "accepted", "countered", "declined", "expired", "withdrawn"] as const;

export const savedGridDemandSchema = gridDemandSchema.extend({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(2_000),
  status: z.enum(gridDemandStatuses).default("open"),
  visibility: z.enum(["private", "matched_only", "network", "public"]).default("matched_only"),
});

export const gridOfferSchema = z.object({
  demandId: z.string().min(1),
  providerId: z.string().min(1).optional().nullable(),
  serviceListingId: z.string().min(1).optional().nullable(),
  locationId: z.string().min(1).optional().nullable(),
  offeredStartAt: z.string().datetime({ offset: true }),
  offeredEndAt: z.string().datetime({ offset: true }).optional().nullable(),
  grossAmountCents: z.number().int().min(0).max(100_000_000),
  depositAmountCents: z.number().int().min(0).max(100_000_000).default(0),
  note: z.string().trim().min(4).max(1_000),
  expiresAt: z.string().datetime({ offset: true }),
}).refine((value) => !value.offeredEndAt || value.offeredEndAt > value.offeredStartAt, {
  path: ["offeredEndAt"],
  message: "Offer end time must be after start time.",
});

export type SavedGridDemand = z.infer<typeof savedGridDemandSchema>;
export type GridOfferInput = z.infer<typeof gridOfferSchema>;

const demandTransitions: Record<(typeof gridDemandStatuses)[number], readonly (typeof gridDemandStatuses)[number][]> = {
  draft: ["open", "cancelled"],
  open: ["matched", "cancelled", "expired"],
  matched: ["offered", "open", "cancelled", "expired"],
  offered: ["reserved", "matched", "cancelled", "expired"],
  reserved: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
  expired: [],
};

const offerTransitions: Record<(typeof gridOfferStatuses)[number], readonly (typeof gridOfferStatuses)[number][]> = {
  draft: ["sent", "withdrawn"],
  sent: ["accepted", "countered", "declined", "expired", "withdrawn"],
  accepted: [],
  countered: ["accepted", "declined", "expired", "withdrawn"],
  declined: [],
  expired: [],
  withdrawn: [],
};

export function canTransitionGridDemand(from: string, to: string) {
  const parsedFrom = z.enum(gridDemandStatuses).safeParse(from);
  const parsedTo = z.enum(gridDemandStatuses).safeParse(to);
  return Boolean(parsedFrom.success && parsedTo.success && demandTransitions[parsedFrom.data].includes(parsedTo.data));
}

export function canTransitionGridOffer(from: string, to: string) {
  const parsedFrom = z.enum(gridOfferStatuses).safeParse(from);
  const parsedTo = z.enum(gridOfferStatuses).safeParse(to);
  return Boolean(parsedFrom.success && parsedTo.success && offerTransitions[parsedFrom.data].includes(parsedTo.data));
}
