import type { DomainEvent, KlinikosEventSeverity } from "@/lib/orchestration/contracts";

export type NotificationChannel = "in_app" | "email" | "sms" | "voice";
export type NotificationState = "pending" | "sent" | "failed" | "read" | "dismissed";

export type NotificationIntent = {
  id: string;
  recipientId: string;
  organizationId?: string | null;
  channel: NotificationChannel;
  title: string;
  body: string;
  severity: KlinikosEventSeverity;
  sourceEventId?: string | null;
  state: NotificationState;
  requiresPhiApprovedChannel: boolean;
  createdAt: Date;
};

export function notificationFromEvent(input: {
  event: DomainEvent;
  recipientId: string;
  channel?: NotificationChannel;
  containsPhi?: boolean;
}): NotificationIntent {
  const title = typeof input.event.payload.label === "string" ? input.event.payload.label : input.event.type.replaceAll("_", " ");
  const body = typeof input.event.payload.detail === "string" ? input.event.payload.detail : "A Klinikos workflow changed.";
  return {
    id: `notification:${input.event.id}:${input.recipientId}`,
    recipientId: input.recipientId,
    organizationId: input.event.organizationId ?? null,
    channel: input.channel ?? "in_app",
    title,
    body,
    severity: input.event.severity,
    sourceEventId: input.event.id,
    state: "pending",
    requiresPhiApprovedChannel: Boolean(input.containsPhi),
    createdAt: input.event.occurredAt,
  };
}

export function canDispatchNotification(input: {
  notification: NotificationIntent;
  phiApprovedChannels?: readonly NotificationChannel[];
}) {
  if (!input.notification.requiresPhiApprovedChannel) return { allowed: true, reason: "No PHI channel gate required." };
  const approved = new Set(input.phiApprovedChannels ?? []);
  if (approved.has(input.notification.channel)) return { allowed: true, reason: "Channel approved for this governed PHI workflow." };
  return { allowed: false, reason: `${input.notification.channel} is not approved for PHI-bearing notification delivery.` };
}

export function notificationTimeline(notifications: readonly NotificationIntent[]) {
  return notifications.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
