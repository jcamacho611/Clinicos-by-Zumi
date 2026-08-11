import type { KlinikosDomainEvent } from "@/lib/platform-events";

export type RevenueRecoveryAction = {
  key: string;
  title: string;
  reason: string;
  priority: "low" | "medium" | "high";
  requiresHumanApproval: boolean;
  subjectType?: string | null;
  subjectId?: string | null;
  estimatedValueCents?: number | null;
};

function money(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
}

export function deriveRevenueRecoveryActions(
  event: KlinikosDomainEvent,
): RevenueRecoveryAction[] {
  const estimatedValueCents = money(event.payload.estimatedValueCents);

  switch (event.eventType) {
    case "AppointmentCanceled":
      return [
        {
          key: "recover-canceled-slot",
          title: "Recover canceled appointment capacity",
          reason: "A scheduled slot became available and may be recoverable through rebooking or waitlist outreach.",
          priority: "high",
          requiresHumanApproval: true,
          subjectType: event.subjectType,
          subjectId: event.subjectId,
          estimatedValueCents,
        },
      ];

    case "AppointmentNoShow":
      return [
        {
          key: "recover-no-show",
          title: "Start no-show recovery",
          reason: "The appointment produced no completed visit and should enter the recovery queue.",
          priority: "high",
          requiresHumanApproval: true,
          subjectType: event.subjectType,
          subjectId: event.subjectId,
          estimatedValueCents,
        },
      ];

    case "LeadCreated":
      return [
        {
          key: "contact-new-lead",
          title: "Assign first lead contact",
          reason: "New demand should receive an owner and a measurable follow-up deadline.",
          priority: "medium",
          requiresHumanApproval: false,
          subjectType: event.subjectType,
          subjectId: event.subjectId,
          estimatedValueCents,
        },
      ];

    default:
      return [];
  }
}
