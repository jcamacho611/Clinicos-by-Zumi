import type { KlinikosEventDomain } from "@/lib/events/types";

export type KlinikosEventDefinition = {
  type: string;
  domain: KlinikosEventDomain;
  description: string;
  containsPhiByDefault: boolean;
};

export const klinikosEventCatalog: KlinikosEventDefinition[] = [
  { type: "identity.created", domain: "identity", description: "A universal Klinikos identity was created.", containsPhiByDefault: false },
  { type: "membership.activated", domain: "identity", description: "An identity gained an active organization membership.", containsPhiByDefault: false },
  { type: "membership.role_assigned", domain: "identity", description: "A role was assigned inside a membership context.", containsPhiByDefault: false },
  { type: "appointment.created", domain: "clinic", description: "An appointment was created.", containsPhiByDefault: true },
  { type: "appointment.cancelled", domain: "clinic", description: "An appointment was cancelled and capacity may have opened.", containsPhiByDefault: true },
  { type: "appointment.no_show", domain: "clinic", description: "An appointment became a no-show and recovery may be required.", containsPhiByDefault: true },
  { type: "patient.waitlisted", domain: "patient", description: "A patient or client requested an earlier or alternate opening.", containsPhiByDefault: true },
  { type: "provider.available", domain: "provider", description: "A provider published availability.", containsPhiByDefault: false },
  { type: "provider.unavailable", domain: "provider", description: "A provider availability window was withdrawn.", containsPhiByDefault: false },
  { type: "credential.expiring", domain: "provider", description: "A credential is approaching expiration.", containsPhiByDefault: false },
  { type: "credential.expired", domain: "provider", description: "A credential expired and related eligibility must be re-evaluated.", containsPhiByDefault: false },
  { type: "grid.shift_posted", domain: "grid", description: "An organization posted a shift or work opportunity.", containsPhiByDefault: false },
  { type: "grid.shift_cancelled", domain: "grid", description: "A scheduled Grid shift was cancelled and may need replacement coverage.", containsPhiByDefault: false },
  { type: "grid.provider_matched", domain: "grid", description: "A qualified provider was matched to an opportunity.", containsPhiByDefault: false },
  { type: "grid.space_available", domain: "grid", description: "A room, chair, or approved facility capacity became available.", containsPhiByDefault: false },
  { type: "education.student_enrolled", domain: "education", description: "A student joined a Klinikos educational program or course.", containsPhiByDefault: false },
  { type: "education.student_graduated", domain: "education", description: "A learner completed a program and may become eligible for downstream Grid workflows.", containsPhiByDefault: false },
  { type: "education.competency_completed", domain: "education", description: "A learner completed a competency or simulation milestone.", containsPhiByDefault: false },
  { type: "payment.authorized", domain: "finance", description: "An external processor authorized a payment.", containsPhiByDefault: false },
  { type: "payment.failed", domain: "finance", description: "A payment failed and follow-up may be required.", containsPhiByDefault: false },
  { type: "payout.completed", domain: "finance", description: "A provider, facility, or partner payout completed through an external processor.", containsPhiByDefault: false },
  { type: "claim.denied", domain: "finance", description: "A claim was denied and revenue-cycle follow-up may be required.", containsPhiByDefault: true },
  { type: "communication.failed", domain: "communications", description: "A message delivery failed and a fallback may be required.", containsPhiByDefault: true },
  { type: "ai.connection_created", domain: "intelligence", description: "An identity or organization configured an Artificial Intelligence provider connection.", containsPhiByDefault: false },
  { type: "ai.connection_revoked", domain: "intelligence", description: "An Artificial Intelligence provider connection was revoked.", containsPhiByDefault: false },
  { type: "integration.connected", domain: "integration", description: "An external system connection became active.", containsPhiByDefault: false },
  { type: "integration.sync_failed", domain: "integration", description: "An external system synchronization failed.", containsPhiByDefault: false },
  { type: "security.access_denied", domain: "security", description: "A protected action was denied by policy.", containsPhiByDefault: false },
];

export function eventDefinition(type: string) {
  return klinikosEventCatalog.find((event) => event.type === type) ?? null;
}
