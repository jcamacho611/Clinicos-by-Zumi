/**
 * Klinikos EDU safety boundaries.
 *
 * Single source of truth for the labels, disclaimers, and AI capability limits that
 * govern every EDU surface. Rendering these from one module is deliberate: a
 * disclaimer that is retyped per page drifts, and a drifted disclaimer is the one
 * that ends up making a claim nobody intended.
 *
 * No database, no network. Reads deployment configuration only through the Zumi
 * gateway's status helper, so EDU and the rest of the product answer "is AI
 * connected" from the same place.
 */

import { zumiGatewayStatus } from "@/features/zumi/providers";

/** Required on every scenario surface, in the interface and in every export. */
export const SYNTHETIC_DATA_LABELS = [
  "SYNTHETIC TRAINING DATA",
  "EDUCATIONAL SIMULATION",
  "NOT FOR REAL PATIENT CARE",
] as const;

export const SYNTHETIC_DATA_NOTICE =
  "Every patient, appointment, result, claim, and message in this simulation is synthetic training data generated for education. It does not describe a real person and must never be used for real patient care.";

/**
 * Attached to every certificate, credential page, and credential export.
 * Not configurable, and not removable by a caller.
 */
export const CREDENTIAL_DISCLAIMER =
  "This is private educational evidence issued by Klinikos EDU. It is not professional licensure, board certification, clinical credentialing, authorization to practice medicine or nursing, clinical privileges, employment eligibility, or scope-of-practice approval. It does not qualify the holder to treat patients and does not create automatic Klinikos Grid eligibility. Regulated opportunities require separate authoritative credential, jurisdiction, insurance, organization, and policy verification.";

export const NOT_A_CREDENTIAL_CLAIMS = [
  "professional licensure",
  "board certification",
  "clinical credentialing",
  "authorization to practice medicine or nursing",
  "clinical privileges",
  "employment eligibility",
  "scope-of-practice approval",
  "automatic Klinikos Grid eligibility",
] as const;

/** What EDU AI is permitted to produce. Everything produced is a draft for review. */
export const EDU_AI_ALLOWED_CAPABILITIES = [
  "draft_scenario",
  "generate_scenario_variation",
  "educational_feedback",
  "explain_missed_step",
  "draft_instructor_material",
  "classify_student_evidence",
] as const;

export type EduAiCapability = (typeof EDU_AI_ALLOWED_CAPABILITIES)[number];

/**
 * What EDU AI is never permitted to do.
 *
 * Enumerated rather than implied so the prohibition is testable and so a new
 * capability cannot be added without consciously stepping past this list.
 */
export const EDU_AI_PROHIBITED_CAPABILITIES = [
  "diagnose",
  "prescribe",
  "certify_clinical_competency",
  "grant_scope_of_practice",
  "grant_licensure",
  "submit_real_claim",
  "authorize_real_care",
  "assert_student_is_qualified_to_treat",
] as const;

export type EduAiProhibitedCapability = (typeof EDU_AI_PROHIBITED_CAPABILITIES)[number];

export function isAllowedEduAiCapability(capability: string): capability is EduAiCapability {
  return (EDU_AI_ALLOWED_CAPABILITIES as readonly string[]).includes(capability);
}

export function isProhibitedEduAiCapability(capability: string): capability is EduAiProhibitedCapability {
  return (EDU_AI_PROHIBITED_CAPABILITIES as readonly string[]).includes(capability);
}

export type EduAiGateDecision =
  | { allowed: true; capability: EduAiCapability; requiresHumanReview: true }
  | { allowed: false; reason: "prohibited" | "unknown_capability" | "gateway_unavailable"; message: string };

/**
 * Gate every EDU AI request.
 *
 * Fails closed in three ways, in priority order:
 *  1. An explicitly prohibited capability is refused regardless of gateway state.
 *  2. An unrecognised capability is refused rather than passed through.
 *  3. A capability with no configured gateway is refused, not silently downgraded
 *     to a direct provider call.
 *
 * Prohibition is checked before availability on purpose: "the gateway is down" must
 * never be the reason a diagnosis request was declined, because that phrasing
 * implies it would be permitted once the gateway is up.
 */
export function evaluateEduAiRequest(input: { capability: string; gatewayAvailable: boolean }): EduAiGateDecision {
  if (isProhibitedEduAiCapability(input.capability)) {
    return {
      allowed: false,
      reason: "prohibited",
      message:
        "Klinikos EDU AI cannot perform this action. Diagnosis, prescribing, competency certification, scope of practice, licensure, real claim submission, and authorization of real care are outside what any AI in this product may do.",
    };
  }

  if (!isAllowedEduAiCapability(input.capability)) {
    return {
      allowed: false,
      reason: "unknown_capability",
      message: "That AI capability is not defined for Klinikos EDU.",
    };
  }

  if (!input.gatewayAvailable) {
    return {
      allowed: false,
      reason: "gateway_unavailable",
      message: "Klinikos AI Gateway is Pending Connection. AI scenario drafting and feedback are unavailable until an approved provider is configured.",
    };
  }

  return { allowed: true, capability: input.capability, requiresHumanReview: true };
}

/**
 * Snapshot used by the EDU dashboard. `available` means technically configured,
 * not approved for real clinical data and not autonomous authority.
 */
export function eduAiStatus() {
  const gateway = zumiGatewayStatus();
  return {
    available: gateway.available,
    status: gateway.available ? "available_for_synthetic_drafts" : "pending_connection",
    provider: gateway.provider,
    message: gateway.available
      ? "Klinikos Intelligence may assist with synthetic EDU drafts. Human instructor review remains required."
      : "Klinikos Intelligence is Pending Connection for EDU. Core learning workflows remain available without it.",
  } as const;
}
