/**
 * Zumi admission policy.
 *
 * The single decision point for "may this call happen at all". Pure and synchronous
 * so every branch is testable without a database, a session, or a provider.
 *
 * Order matters and is deliberate:
 *   1. prohibition   — before anything else, so a forbidden capability is refused
 *                      even in a deployment where nothing is configured and even for
 *                      an owner. It is not a configuration question.
 *   2. catalog       — an undeclared capability cannot be invoked.
 *   3. tenant        — the organization on the request must match the session.
 *   4. permission    — baseline `ai:read`, then the capability's own requirement.
 *   5. entitlement   — what the clinic bought.
 *   6. PHI egress    — whether this provider may receive clinic content at all.
 *   7. availability  — whether a provider is actually connected.
 *
 * Availability is last on purpose. A denial should tell the truth about *why*, and
 * "not connected" is a weaker, more forgivable answer than "you may not do this" —
 * reporting it first would hide the real reason behind an outage. PHI egress sits
 * immediately before it for the same reason inverted: a deployment that is connected
 * but not approved must not be described as disconnected, because an operator would
 * then go looking for an outage that does not exist.
 */

import { can } from "@/lib/auth/rbac";
import type { ClinicRole } from "@/lib/auth/rbac";
import {
  getZumiCapability,
  isProhibitedZumiCapability,
  ZUMI_BASELINE_PERMISSION,
  type RiskTier,
  type ZumiCapability,
} from "@/features/zumi/schemas";

export type ZumiAdmissionInput = {
  capability: string;
  role: ClinicRole;
  /** Organization the session belongs to. */
  sessionOrganizationId: string;
  /**
   * Organization the request claims to act on. Passed separately from the session so
   * the mismatch is checked rather than assumed; the constitution is explicit that a
   * client-supplied organization id is not trusted.
   */
  requestedOrganizationId: string;
  /** Entitlement keys resolved server-side. Never read from the request body. */
  entitlements: readonly string[];
  /**
   * Whether the selected provider may receive clinic content in this deployment.
   *
   * Named `phiEgressPermitted` rather than something softer because that is exactly
   * what it decides. Passed in rather than read here so the policy stays pure, and
   * required rather than optional so a new caller cannot omit it and default it open.
   */
  phiEgressPermitted: boolean;
  phiEgressDetail?: string;
  providerAvailable: boolean;
  providerDetail?: string;
};

export type ZumiAdmissionDenial = {
  allowed: false;
  reason:
    | "prohibited"
    | "unknown_capability"
    | "tenant_mismatch"
    | "permission_denied"
    | "entitlement_required"
    | "phi_egress_not_permitted"
    | "provider_unavailable";
  /** Safe to show a user. Says what happened without leaking what exists. */
  message: string;
  /** HTTP status a route should return, so callers do not each invent one. */
  status: 400 | 402 | 403 | 503;
};

export type ZumiAdmissionGrant = {
  allowed: true;
  capability: ZumiCapability;
  tier: RiskTier;
  /**
   * Whether the produced output must be held for a human.
   *
   * Derived from the tier, not accepted from the caller. Anything above LOW is a
   * suggestion a person confirms.
   */
  requiresHumanReview: boolean;
};

export type ZumiAdmissionDecision = ZumiAdmissionGrant | ZumiAdmissionDenial;

export function requiresHumanReviewForTier(tier: RiskTier) {
  return tier !== "LOW";
}

export function admitZumiRequest(input: ZumiAdmissionInput): ZumiAdmissionDecision {
  if (isProhibitedZumiCapability(input.capability)) {
    return {
      allowed: false,
      reason: "prohibited",
      status: 403,
      message:
        "Zumi does not diagnose, prescribe, decide treatment, interpret results as final, or act on records, claims, credentials, or care without a person. This is a product boundary, not a setting.",
    };
  }

  const capability = getZumiCapability(input.capability);
  if (!capability) {
    return {
      allowed: false,
      reason: "unknown_capability",
      status: 400,
      message: "That Zumi capability is not declared. Capabilities are enumerated so their risk tier and permissions are decided deliberately.",
    };
  }

  if (input.requestedOrganizationId !== input.sessionOrganizationId) {
    return {
      allowed: false,
      reason: "tenant_mismatch",
      status: 403,
      message: "This request names a different organization than the signed-in session.",
    };
  }

  if (!can(input.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return { allowed: false, reason: "permission_denied", status: 403, message: "This role does not have access to Zumi." };
  }

  const required = capability.requiresPermission;
  if (required && !can(input.role, required.resource, required.action)) {
    return {
      allowed: false,
      reason: "permission_denied",
      status: 403,
      // Zumi never widens what a role can already see. If you cannot open the record,
      // you cannot ask Zumi to read it to you.
      message: `This role cannot ${required.action} ${required.resource.replace(/_/g, " ")}, so Zumi cannot do it on their behalf.`,
    };
  }

  if (capability.requiresEntitlement && !input.entitlements.includes(capability.requiresEntitlement)) {
    return {
      allowed: false,
      reason: "entitlement_required",
      status: 402,
      message: `${capability.label} is part of an access level this organization does not currently hold.`,
    };
  }

  // Nothing built from a clinic's records may reach a provider that is not approved to
  // receive it. Redaction runs later and removes identifier *shapes* — it does not
  // recognise a patient's name, a chief complaint written in prose, or any of the
  // ordinary clinical language every one of these capabilities operates on. Treating a
  // scrubbing pass as permission is the specific mistake this check exists to prevent.
  // Guarded on availability so a deployment with nothing connected is told that, rather
  // than being told it lacks an approval for a provider it does not have.
  if (input.providerAvailable && !input.phiEgressPermitted) {
    return {
      allowed: false,
      reason: "phi_egress_not_permitted",
      status: 403,
      message:
        input.phiEgressDetail ??
        "Zumi will not send clinic content to a model provider that is not covered by a Business Associate Agreement and approved for this deployment.",
    };
  }

  if (!input.providerAvailable) {
    return {
      allowed: false,
      reason: "provider_unavailable",
      status: 503,
      message: input.providerDetail ?? "Zumi is not connected to a model provider in this deployment. It reports Pending Connection rather than guessing.",
    };
  }

  return {
    allowed: true,
    capability,
    tier: capability.tier,
    requiresHumanReview: requiresHumanReviewForTier(capability.tier),
  };
}
