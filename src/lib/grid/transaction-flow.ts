import { z } from "zod";
import { gridDemandSchema } from "@/lib/grid/demand-contract";

export const gridDemandStatuses = ["draft", "open", "matched", "offered", "reserved", "fulfilled", "cancelled", "expired"] as const;
export const gridOfferStatuses = ["draft", "sent", "accepted", "countered", "declined", "expired", "withdrawn"] as const;

export const savedGridDemandSchema = gridDemandSchema.extend({
  status: z.enum(gridDemandStatuses).default("open"),
  visibility: z.enum(["private", "matched_only", "network", "public"]).default("matched_only"),
});

const offerTermsSchema = z.object({
  locationId: z.string().min(1).optional().nullable(),
  offeredStartAt: z.string().datetime({ offset: true }),
  offeredEndAt: z.string().datetime({ offset: true }).optional().nullable(),
  grossAmountCents: z.number().int().min(0).max(100_000_000),
  depositAmountCents: z.number().int().min(0).max(100_000_000).default(0),
  locationPayableCents: z.number().int().min(0).max(100_000_000).default(0),
  note: z.string().trim().min(4).max(1_000),
  expiresAt: z.string().datetime({ offset: true }),
}).superRefine((value, ctx) => {
  if (value.offeredEndAt && value.offeredEndAt <= value.offeredStartAt) {
    ctx.addIssue({ code: "custom", path: ["offeredEndAt"], message: "Offer end time must be after start time." });
  }
  if (value.depositAmountCents > value.grossAmountCents) {
    ctx.addIssue({ code: "custom", path: ["depositAmountCents"], message: "Deposit cannot exceed the gross offer amount." });
  }
  if (value.locationPayableCents > value.grossAmountCents) {
    ctx.addIssue({ code: "custom", path: ["locationPayableCents"], message: "Location payable cannot exceed the gross offer amount." });
  }
  if (new Date(value.expiresAt).getTime() <= Date.now()) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Offer expiration must be in the future." });
  }
});

export const gridOfferSchema = z.object({
  demandId: z.string().min(1),
  providerId: z.string().min(1).optional().nullable(),
  serviceListingId: z.string().min(1).optional().nullable(),
  recipientOrganizationId: z.string().min(1).optional().nullable(),
  resourceKind: z.string().trim().min(2).max(80).optional().nullable(),
  resourceReference: z.string().trim().min(1).max(200).optional().nullable(),
}).and(offerTermsSchema).superRefine((value, ctx) => {
  if (Boolean(value.providerId) !== Boolean(value.serviceListingId)) {
    ctx.addIssue({ code: "custom", path: ["serviceListingId"], message: "Provider and service listing must be selected together." });
  }
  if (!value.providerId && !value.locationId && !value.resourceReference) {
    ctx.addIssue({ code: "custom", path: ["resourceReference"], message: "Offer must identify at least one selected Grid resource." });
  }
  if (Boolean(value.resourceKind) !== Boolean(value.resourceReference)) {
    ctx.addIssue({ code: "custom", path: ["resourceReference"], message: "Generic resource kind and reference must be provided together." });
  }
  if (value.resourceReference && !value.providerId && !value.locationId && !value.recipientOrganizationId) {
    ctx.addIssue({ code: "custom", path: ["recipientOrganizationId"], message: "Generic resource offers require a recipient organization." });
  }
  if (value.locationPayableCents > 0 && !value.locationId) {
    ctx.addIssue({ code: "custom", path: ["locationPayableCents"], message: "Location compensation requires a selected Grid location." });
  }
});

export const gridOfferDecisionSchema = z.object({
  targetStatus: z.enum(["accepted", "countered", "declined", "withdrawn"]),
  note: z.string().trim().min(3).max(1_000),
  counterOffer: offerTermsSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.targetStatus === "countered" && !value.counterOffer) {
    ctx.addIssue({ code: "custom", path: ["counterOffer"], message: "Counteroffer terms are required." });
  }
  if (value.targetStatus !== "countered" && value.counterOffer) {
    ctx.addIssue({ code: "custom", path: ["counterOffer"], message: "Counteroffer terms are only valid for a counter decision." });
  }
});

export type SavedGridDemand = z.infer<typeof savedGridDemandSchema>;
export type GridOfferInput = z.infer<typeof gridOfferSchema>;
export type GridOfferDecision = z.infer<typeof gridOfferDecisionSchema>;

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
  countered: [],
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
