import type { KlinikosRiskClass } from "@/lib/orchestration/contracts";

export type HumanReviewState = "pending" | "approved" | "rejected" | "needs_information" | "cancelled";

export type HumanReviewItem = {
  id: string;
  organizationId?: string | null;
  subjectType: string;
  subjectId: string;
  actionKey: string;
  riskClass: KlinikosRiskClass;
  requestedBy: string;
  assignedTo?: string | null;
  reason: string;
  state: HumanReviewState;
  evidenceRefs: string[];
  requestedAt: Date;
  decidedAt?: Date | null;
  decisionReason?: string | null;
};

export function requiresHumanReview(riskClass: KlinikosRiskClass) {
  return ["review", "regulated", "financial", "destructive", "phi"].includes(riskClass);
}

export function assignReview(item: HumanReviewItem, reviewerId: string) {
  if (item.state !== "pending" && item.state !== "needs_information") throw new Error("Only open review items can be assigned.");
  return { ...item, assignedTo: reviewerId };
}

export function decideReview(input: {
  item: HumanReviewItem;
  reviewerId: string;
  decision: "approved" | "rejected" | "needs_information";
  reason: string;
  now?: Date;
}) {
  if (input.item.state === "approved" || input.item.state === "rejected" || input.item.state === "cancelled") throw new Error("Closed review items cannot be decided again.");
  if (!input.reason.trim()) throw new Error("A human review decision requires a reason.");
  const now = input.now ?? new Date();
  return {
    ...input.item,
    assignedTo: input.reviewerId,
    state: input.decision,
    decidedAt: input.decision === "needs_information" ? null : now,
    decisionReason: input.reason.trim(),
  };
}

export function reviewQueue(items: readonly HumanReviewItem[]) {
  const riskWeight: Record<KlinikosRiskClass, number> = { low: 0, review: 20, regulated: 50, financial: 40, destructive: 60, phi: 45 };
  return items
    .filter((item) => item.state === "pending" || item.state === "needs_information")
    .slice()
    .sort((a, b) => {
      const risk = riskWeight[b.riskClass] - riskWeight[a.riskClass];
      if (risk !== 0) return risk;
      return a.requestedAt.getTime() - b.requestedAt.getTime();
    });
}
