import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { can } from "@/lib/auth/rbac";
import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import type { ExpertCapabilityDomain } from "@/lib/orchestration/expert-grid-engine";

/**
 * Requests for expertise a clinic does not have internally.
 *
 * This is the demand half of Expert Grid and nothing more. The eligibility, ranking and
 * staged-access engines exist, but there is no expert supply in this product — so
 * nothing is matched here, and the surface says so rather than implying a marketplace
 * that is not there. A request is captured, owned, and followed up by a person.
 *
 * The rule that matters most: submitting a request conveys no access to anything.
 * `dataAccessClass` records what the requester *believes* will eventually be needed, and
 * it is clamped to "none" on create. Access is a separate, later, explicitly authorized
 * decision made against `evaluateExpertEngagementReadiness`, which requires conflict
 * clearance, agreement evidence, a named purpose and a minimum-necessary field scope.
 * Letting a request set its own access class would quietly invert all of that.
 */

const capabilityDomains = [
  "quality", "revenue_cycle", "credentialing", "prior_authorization", "compliance",
  "privacy", "security", "interoperability", "clinical_informatics", "operations",
  "education", "billing", "coding", "patient_experience", "population_health",
] as const satisfies readonly ExpertCapabilityDomain[];

export const expertSupportRequestSchema = z.object({
  capabilityDomain: z.enum(capabilityDomains),
  /** What the clinic wants to be true when this is finished. */
  outcomeWanted: z.string().trim().min(10).max(2_000),
  urgency: z.enum(["routine", "priority", "urgent", "critical"]).default("routine"),
  jurisdictionKey: z.string().trim().max(80).nullable().default(null),
  remoteAllowed: z.boolean().default(true),
  neededBy: z.string().datetime({ offset: true }).nullable().default(null),
  sourceNeedKey: z.string().trim().max(200).nullable().default(null),
}).strict();

export type ExpertSupportRequestInput = z.infer<typeof expertSupportRequestSchema>;

export interface ExpertSupportRequestView {
  id: string;
  capabilityDomain: string;
  outcomeWanted: string;
  urgency: string;
  jurisdictionKey: string | null;
  remoteAllowed: boolean;
  neededBy: string | null;
  dataAccessClass: string;
  status: string;
  createdAt: string;
}

export interface ExpertSupportPicture {
  /** Null when the role may not see requests at all — not an empty list. */
  requests: readonly ExpertSupportRequestView[] | null;
  canRequest: boolean;
  /**
   * False for as long as there is no expert supply. The surface uses this to avoid
   * implying a match is coming automatically.
   */
  matchingAvailable: boolean;
}

function view(row: {
  id: string; capabilityDomain: string; outcomeWanted: string; urgency: string;
  jurisdictionKey: string | null; remoteAllowed: boolean; neededBy: Date | null;
  dataAccessClass: string; status: string; createdAt: Date;
}): ExpertSupportRequestView {
  return {
    id: row.id,
    capabilityDomain: row.capabilityDomain,
    outcomeWanted: row.outcomeWanted,
    urgency: row.urgency,
    jurisdictionKey: row.jurisdictionKey,
    remoteAllowed: row.remoteAllowed,
    neededBy: row.neededBy?.toISOString() ?? null,
    dataAccessClass: row.dataAccessClass,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Only the identity this actually needs, so callers need not fabricate a session. */
export interface ExpertSupportViewer {
  readonly organizationId: string;
  readonly role: ClinicRole;
}

export async function listExpertSupportRequests(session: ExpertSupportViewer): Promise<ExpertSupportPicture> {
  // Requesting outside help is an operational decision about the organization, so it
  // rides on network access rather than on any clinical permission.
  if (!can(session.role, "network", "read")) {
    return { requests: null, canRequest: false, matchingAvailable: false };
  }

  const rows = await db.expertSupportRequest.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    requests: rows.map(view),
    canRequest: can(session.role, "network", "create"),
    // There is no expert supply yet. Saying otherwise would be the fabricated
    // marketplace this product must not have.
    matchingAvailable: false,
  };
}

export type ExpertSupportCreateResult =
  | { ok: true; request: ExpertSupportRequestView }
  | { ok: false; reason: "not_authorized" | "invalid" };

export async function createExpertSupportRequest(
  session: ClinicSession,
  rawInput: unknown,
): Promise<ExpertSupportCreateResult> {
  if (!can(session.role, "network", "create")) return { ok: false, reason: "not_authorized" };

  const parsed = expertSupportRequestSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const input = parsed.data;

  const row = await db.expertSupportRequest.create({
    data: {
      organizationId: session.organizationId,
      requestedByUserId: session.userId,
      capabilityDomain: input.capabilityDomain,
      outcomeWanted: input.outcomeWanted,
      urgency: input.urgency,
      jurisdictionKey: input.jurisdictionKey,
      remoteAllowed: input.remoteAllowed,
      neededBy: input.neededBy ? new Date(input.neededBy) : null,
      sourceNeedKey: input.sourceNeedKey,
      // Not settable by the requester. Access is decided later, explicitly, against the
      // engagement readiness rules — never granted by the act of asking for help.
      dataAccessClass: "none",
      status: "submitted",
    },
  });

  return { ok: true, request: view(row) };
}
