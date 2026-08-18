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
 * Whether the Klinikos AI Gateway is actually available.
 *
 * Delegates to the gateway's own registry rather than answering for it. EDU asked
 * this question before the gateway existed and hardcoded false; now that the gateway
 * is real, a second hardcoded answer here would be the thing that eventually
 * disagrees with the truth. It still reports false in every environment today,
 * because no provider is registered until an approved one is contracted.
 */
export function eduAiGatewayStatus() {
  return zumiGatewayStatus();
}

/**
 * Human review is authoritative for anything that assesses a student.
 * An AI suggestion is never a grade and never a competency determination.
 */
export const HUMAN_REVIEW_AUTHORITY =
  "Instructor review is authoritative. AI output in Klinikos EDU is a draft suggestion for a human to accept, edit, or reject; it never sets a grade, marks a competency achieved, or certifies readiness to practice.";

/**
 * Text that must never appear in generated or authored student-facing scenario
 * content, because it would represent the simulation as real care.
 */
export const FORBIDDEN_SCENARIO_ASSERTIONS = [
  "real patient",
  "actual patient",
  "live patient",
  "this is not a simulation",
  "submit this claim to the payer",
  "administer to the patient",
] as const;

/**
 * Screen authored or generated scenario text for language that would present the
 * simulation as real care. Case-insensitive, returns every match so an author can
 * fix them in one pass rather than one at a time.
 */
export function findForbiddenScenarioAssertions(text: string): string[] {
  const haystack = text.toLowerCase();
  return FORBIDDEN_SCENARIO_ASSERTIONS.filter((phrase) => haystack.includes(phrase));
}

/** Convenience wrapper for validation call sites. */
export function scenarioTextIsSafe(text: string) {
  return findForbiddenScenarioAssertions(text).length === 0;
}
