import { gridDemandSchema, type GridDemand } from "@/lib/grid/demand-contract";

export type PlacementApprovalKey = "school" | "site" | "preceptor";

export type ClinicalPlacementDemandInput = {
  personId: string;
  programName: string;
  requiredHours: number;
  preferredSpecialties?: string[];
  city?: string | null;
  state?: string | null;
  learnerEligibility: {
    relationshipVerified: boolean;
    prerequisitesComplete: boolean;
  };
  approvals: {
    school: boolean;
    site: boolean;
    preceptor: boolean;
  };
};

export type ClinicalPlacementDemand = {
  personId: string;
  demand: GridDemand;
  gate: {
    canMatch: boolean;
    canAssign: boolean;
    missingApprovals: PlacementApprovalKey[];
  };
  grantsAuthority: false;
};

const approvalKeys: PlacementApprovalKey[] = ["school", "site", "preceptor"];

function normalizedOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

/**
 * Translate an explicit learner placement need into the existing universal Grid demand
 * contract. Discovery readiness and placement assignment remain separate truths.
 *
 * A verified learner relationship plus completed prerequisites may allow discovery, but
 * a Grid match cannot create school/site/preceptor approval, placement assignment,
 * licensure, professional eligibility or clinical authority.
 */
export function buildClinicalPlacementDemand(input: ClinicalPlacementDemandInput): ClinicalPlacementDemand {
  const personId = input.personId.trim();
  if (!personId) throw new Error("personId is required");

  const programName = input.programName.trim();
  if (!programName) throw new Error("programName is required");
  if (!Number.isInteger(input.requiredHours) || input.requiredHours <= 0) {
    throw new Error("requiredHours must be a positive integer");
  }

  const preferredSpecialties = [...new Set(
    (input.preferredSpecialties ?? []).map((specialty) => specialty.trim()).filter(Boolean),
  )];

  const canMatch =
    input.learnerEligibility.relationshipVerified &&
    input.learnerEligibility.prerequisitesComplete;

  const missingApprovals = approvalKeys.filter((key) => !input.approvals[key]);
  const canAssign = canMatch && missingApprovals.length === 0;

  const demand = gridDemandSchema.parse({
    kind: "education",
    title: `Clinical placement: ${programName}`,
    description: `${programName} learner needs ${input.requiredHours} supervised clinical hours.`,
    category: "clinical-placement",
    city: normalizedOptional(input.city),
    state: normalizedOptional(input.state),
    quantity: 1,
    requiresClinicalEligibility: true,
    requirements: [
      `program:${programName}`,
      `required-hours:${input.requiredHours}`,
      ...preferredSpecialties.map((specialty) => `specialty:${specialty}`),
    ],
  });

  return {
    personId,
    demand,
    gate: {
      canMatch,
      canAssign,
      missingApprovals,
    },
    grantsAuthority: false,
  };
}
