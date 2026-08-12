import { z } from "zod";

export const gridFeePolicySchema = z.object({
  scopeKind: z.enum(["default", "demand_kind", "resource_kind"]),
  scopeValue: z.string().trim().min(1).max(80).optional().nullable(),
  platformFeeBps: z.number().int().min(0).max(10_000),
  platformFeeFlatCents: z.number().int().min(0).max(100_000_000).default(0),
}).superRefine((value, ctx) => {
  if (value.scopeKind === "default" && value.scopeValue) {
    ctx.addIssue({ code: "custom", path: ["scopeValue"], message: "Default fee policy cannot have a scope value." });
  }
  if (value.scopeKind !== "default" && !value.scopeValue) {
    ctx.addIssue({ code: "custom", path: ["scopeValue"], message: "Scoped fee policy requires a scope value." });
  }
});

export const gridObligationTransitionSchema = z.object({
  targetStatus: z.enum(["held", "payable", "processing", "settled", "failed", "reversed", "disputed"]),
  note: z.string().trim().min(8).max(1_000),
  externalReference: z.string().trim().min(2).max(200).optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.targetStatus === "settled" && !value.externalReference) {
    ctx.addIssue({ code: "custom", path: ["externalReference"], message: "Settlement requires a real external reference." });
  }
});

export function computePlatformFeeCents(input: {
  grossAmountCents: number;
  platformFeeBps: number;
  platformFeeFlatCents: number;
}) {
  const { grossAmountCents, platformFeeBps, platformFeeFlatCents } = input;
  if (!Number.isInteger(grossAmountCents) || grossAmountCents < 0) throw new Error("Gross amount must be a non-negative integer.");
  if (!Number.isInteger(platformFeeBps) || platformFeeBps < 0 || platformFeeBps > 10_000) throw new Error("Platform fee basis points must be between 0 and 10,000.");
  if (!Number.isInteger(platformFeeFlatCents) || platformFeeFlatCents < 0) throw new Error("Platform flat fee must be a non-negative integer.");
  const percentageFee = Math.floor((grossAmountCents * platformFeeBps) / 10_000);
  return Math.min(grossAmountCents, percentageFee + platformFeeFlatCents);
}

export type GridFeePolicyInput = z.infer<typeof gridFeePolicySchema>;
export type GridObligationTransition = z.infer<typeof gridObligationTransitionSchema>;
