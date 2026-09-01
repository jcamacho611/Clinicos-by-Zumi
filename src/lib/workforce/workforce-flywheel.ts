import {
  evaluateGridComposition,
  gridCompositionTemplates,
  type GridCompositionComponent,
} from "@/lib/grid/composition-engine";
import type { GridEligibilityDecision } from "@/lib/grid/eligibility";
import type { GridSettlementState } from "@/lib/grid/transaction-state";
import {
  projectPublicProfessionalIdentity,
  type PersonIdentity,
  type PersonRelationship,
  type PublicProfessionalProjection,
} from "@/lib/identity/person-context";

/**
 * Workforce flywheel bridge.
 *
 * This module does not replace EDU, Grid, credentialing, Person identity, or Financial
 * OS. It connects their existing decisions into one explainable journey:
 *
 *   resume claims -> placement -> externally verified professional -> Grid work
 *   -> fulfillment evidence -> existing Financial OS allocation/payout lifecycle.
 *
 * The safety rule is deliberately repetitive: evidence may help the next governed
 * decision, but no upstream artifact silently creates downstream authority.
 */

export type ResumeCareerArtifactInput = {
  personId: string;
  sourceId: string;
  education?: readonly string[];
  experience?: readonly string[];
  skills?: readonly string[];
  goals?: readonly string[];
};

export type ResumeCareerArtifact = {
  personId: string;
  sourceType: "resume";
  sourceId: string;
  verificationState: "claimed";
  grantsAuthority: false;
  claims: {
    education: string[];
    experience: string[];
    skills: string[];
    goals: string[];
  };
};

function normalizedClaims(values: readonly string[] | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

export function createResumeCareerArtifact(input: ResumeCareerArtifactInput): ResumeCareerArtifact {
  const personId = input.personId.trim();
  const sourceId = input.sourceId.trim();
  if (!personId) throw new Error("Resume career evidence requires a Person.");
  if (!sourceId) throw new Error("Resume career evidence requires a source artifact.");

  return {
    personId,
    sourceType: "resume",
    sourceId,
    verificationState: "claimed",
    grantsAuthority: false,
    claims: {
      education: normalizedClaims(input.education),
      experience: normalizedClaims(input.experience),
      skills: normalizedClaims(input.skills),
      goals: normalizedClaims(input.goals),
    },
  };
}

export type PlacementApprovalState = {
  school: boolean;
  site: boolean;
  preceptor: boolean;
};

export type PlacementProgressInput = {
  components: readonly GridCompositionComponent[];
  approvals: PlacementApprovalState;
  requiredHours: number;
  completedHours: number;
  humanEvaluationRecorded: boolean;
};

export type PlacementBlocker =
  | "placement_composition_not_ready"
  | "school_approval_required"
  | "site_approval_required"
  | "preceptor_approval_required"
  | "placement_hours_remaining"
  | "human_evaluation_required";

export type PlacementProgress = {
  compositionReady: boolean;
  approved: boolean;
  completed: boolean;
  requiredHours: number;
  completedHours: number;
  blockers: PlacementBlocker[];
  professionalAuthorityGranted: false;
  requiresExternalProfessionalVerification: true;
};

export function evaluatePlacementProgress(input: PlacementProgressInput): PlacementProgress {
  if (!Number.isInteger(input.requiredHours) || input.requiredHours <= 0) {
    throw new Error("Placement required hours must be a positive integer.");
  }
  if (!Number.isInteger(input.completedHours) || input.completedHours < 0) {
    throw new Error("Placement completed hours must be a non-negative integer.");
  }

  const composition = evaluateGridComposition(
    gridCompositionTemplates.clinicalPlacement,
    [...input.components],
  );
  const blockers: PlacementBlocker[] = [];

  if (!composition.readyForOffer) blockers.push("placement_composition_not_ready");
  if (!input.approvals.school) blockers.push("school_approval_required");
  if (!input.approvals.site) blockers.push("site_approval_required");
  if (!input.approvals.preceptor) blockers.push("preceptor_approval_required");

  const approved =
    composition.readyForOffer &&
    input.approvals.school &&
    input.approvals.site &&
    input.approvals.preceptor;

  if (approved && input.completedHours < input.requiredHours) blockers.push("placement_hours_remaining");
  if (approved && input.completedHours >= input.requiredHours && !input.humanEvaluationRecorded) {
    blockers.push("human_evaluation_required");
  }

  const completed =
    approved &&
    input.completedHours >= input.requiredHours &&
    input.humanEvaluationRecorded;

  return {
    compositionReady: composition.readyForOffer,
    approved,
    completed,
    requiredHours: input.requiredHours,
    completedHours: input.completedHours,
    blockers,
    professionalAuthorityGranted: false,
    requiresExternalProfessionalVerification: true,
  };
}

export type ProfessionalWorkTransitionInput = {
  person: PersonIdentity;
  professionalRelationship: PersonRelationship | undefined;
  eligibility: GridEligibilityDecision;
  placement: PlacementProgress;
  publicFields: {
    displayName: string;
    headline: string;
  };
};

export type ProfessionalWorkTransition = {
  placementCompleted: boolean;
  professionalVerified: boolean;
  gridEligible: boolean;
  publicProfessionalProfile: PublicProfessionalProjection | null;
  placementGrantsAuthority: false;
  paymentGrantsAuthority: false;
};

export function evaluateProfessionalWorkTransition(
  input: ProfessionalWorkTransitionInput,
): ProfessionalWorkTransition {
  const relationship = input.professionalRelationship;
  const professionalVerified = Boolean(
    relationship &&
      relationship.personId === input.person.id &&
      relationship.status === "active" &&
      relationship.verificationState === "verified",
  );
  const gridEligible = professionalVerified && input.eligibility.eligible;

  const publicProfessionalProfile = gridEligible
    ? projectPublicProfessionalIdentity({
        person: input.person,
        relationship,
        eligibility: { verified: true, eligible: true },
        publicFields: input.publicFields,
      })
    : null;

  return {
    placementCompleted: input.placement.completed,
    professionalVerified,
    gridEligible,
    publicProfessionalProfile,
    placementGrantsAuthority: false,
    paymentGrantsAuthority: false,
  };
}

export type PaidGridWorkInput = {
  professionalReady: boolean;
  demandStatus: "draft" | "open" | "matched" | "offered" | "reserved" | "fulfilled" | "cancelled" | "expired";
  offerStatus: "draft" | "sent" | "accepted" | "countered" | "declined" | "expired" | "withdrawn";
  grossAmountCents: number;
  fulfillmentEvidenceIds: readonly string[];
  financialObligationStatus: GridSettlementState | null;
};

export type PaidGridWorkProgress = {
  financialObligationReady: boolean;
  payoutReady: boolean;
  nextFinancialAction:
    | "none"
    | "allocate_existing_grid_financial_obligations"
    | "review_existing_grid_financial_obligations"
    | "process_existing_grid_payout"
    | "reconcile_existing_grid_payout";
  paymentGrantsAuthority: false;
};

/**
 * Determine when a completed workforce transaction may cross into the existing Grid
 * Financial OS. This does not allocate money itself. The authoritative server-side
 * allocator still re-checks fulfillment, disputes, supply organization, fee policy,
 * monetization legality, and reconciliation before creating obligations.
 */
export function evaluatePaidGridWorkProgress(input: PaidGridWorkInput): PaidGridWorkProgress {
  const evidenceIds = normalizedClaims(input.fulfillmentEvidenceIds);
  const validGross = Number.isInteger(input.grossAmountCents) && input.grossAmountCents > 0;
  const financialObligationReady =
    input.professionalReady &&
    input.demandStatus === "fulfilled" &&
    input.offerStatus === "accepted" &&
    evidenceIds.length > 0 &&
    validGross;

  let nextFinancialAction: PaidGridWorkProgress["nextFinancialAction"] = "none";
  if (financialObligationReady) {
    if (input.financialObligationStatus === null) {
      nextFinancialAction = "allocate_existing_grid_financial_obligations";
    } else if (input.financialObligationStatus === "payable") {
      nextFinancialAction = "process_existing_grid_payout";
    } else if (input.financialObligationStatus === "processing" || input.financialObligationStatus === "settled") {
      nextFinancialAction = "reconcile_existing_grid_payout";
    } else {
      nextFinancialAction = "review_existing_grid_financial_obligations";
    }
  }

  return {
    financialObligationReady,
    payoutReady: financialObligationReady && input.financialObligationStatus === "payable",
    nextFinancialAction,
    paymentGrantsAuthority: false,
  };
}
