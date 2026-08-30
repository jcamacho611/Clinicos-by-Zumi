import { gridDemandSchema, type GridDemand } from "@/lib/grid/demand-contract";

export type CareerWorkDemandInput = {
  personId: string;
  desiredRole: string;
  preferredSpecialties?: string[];
  city?: string | null;
  state?: string | null;
};

export type CareerWorkDemand = {
  personId: string;
  demand: GridDemand;
  gate: {
    canMatch: false;
    reason: "opportunity_eligibility_required";
  };
  grantsAuthority: false;
};

function optionalTrimmed(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizedSpecialties(values: string[] | undefined) {
  const normalized = (values ?? []).map((value) => value.trim()).filter(Boolean);
  return [...new Set(normalized)];
}

/**
 * Translate a person's explicit career intent into the existing universal Grid demand
 * contract.
 *
 * This function intentionally stops before matching. A resume, career goal, completed
 * course, profile label, or this demand record cannot answer whether the person may
 * perform a particular healthcare activity. Grid's activity-specific eligibility engine
 * still evaluates the concrete opportunity's activity, jurisdiction, facility,
 * credentials, malpractice coverage, privilege, and time window before any match.
 */
export function buildCareerWorkDemand(input: CareerWorkDemandInput): CareerWorkDemand {
  const personId = input.personId.trim();
  if (!personId) throw new Error("personId is required");

  const desiredRole = input.desiredRole.trim();
  if (!desiredRole) throw new Error("desiredRole is required");

  const specialties = normalizedSpecialties(input.preferredSpecialties);
  const requirements = [
    `role:${desiredRole}`,
    ...specialties.map((specialty) => `specialty:${specialty}`),
  ];

  const demand = gridDemandSchema.parse({
    kind: "work",
    title: `Work wanted: ${desiredRole}`,
    description: `Career intent for ${desiredRole} healthcare work. Eligibility must be evaluated against each specific opportunity before matching.`,
    category: "healthcare-work",
    city: optionalTrimmed(input.city),
    state: optionalTrimmed(input.state),
    requiresClinicalEligibility: true,
    requirements,
  });

  return {
    personId,
    demand,
    gate: {
      canMatch: false,
      reason: "opportunity_eligibility_required",
    },
    grantsAuthority: false,
  };
}
