import "server-only";

import type { CareerArtifactView } from "@/lib/career/career-artifact-repository";

export type WorkforceRelationshipInput = {
  id: string;
  relationshipType: string;
  status: string;
  verificationState: string;
  domainKind: string | null;
  domainRecordId: string | null;
};

export type WorkforcePlacementInput = {
  status: string;
  approvals: {
    school: string;
    site: string;
    preceptor: string;
    learner: string;
  };
  requiredMinutes: number;
  acceptedMinutes: number;
  remainingMinutes: number;
  hoursComplete: boolean;
};

export type PersonWorkforceProjectionInput = {
  careerArtifact: CareerArtifactView | null;
  relationships: WorkforceRelationshipInput[];
  accountEmailVerified: boolean;
  placement: WorkforcePlacementInput | null;
};

export type PersonWorkforceProjection = {
  career:
    | {
        state: "missing";
        grantsAuthority: false;
      }
    | {
        state: "claimed" | "human_confirmed_claims";
        artifactVersion: number;
        educationClaimCount: number;
        experienceClaimCount: number;
        skillClaimCount: number;
        careerGoals: string[];
        grantsAuthority: false;
      };
  education: {
    relationshipState: "linked" | "not_linked";
    emailVerificationRequiredBeforeClaim: boolean;
    grantsAuthority: false;
  };
  placement: null | {
    state: string;
    approvals: WorkforcePlacementInput["approvals"];
    requiredMinutes: number;
    acceptedMinutes: number;
    remainingMinutes: number;
    hoursComplete: boolean;
    grantsProfessionalAuthority: false;
    grantsClinicalAuthority: false;
    grantsLicensure: false;
  };
  professional: {
    relationshipState: "not_verified" | "verified_relationship";
    professionalAuthorityEstablished: false;
    concreteEligibilityRequiredForMatch: true;
  };
  work: {
    state:
      | "career_profile_needed"
      | "placement_needed"
      | "placement_in_progress"
      | "professional_verification_required"
      | "grid_discovery_ready";
    canDiscover: boolean;
    canMatch: false;
    concreteEligibilityRequired: true;
  };
  nextAction: {
    pathId: "become-grid-ready" | "student-clinical-placement" | "find-extra-work";
    reason: string;
  };
};

function hasExplicitEducationRelationship(relationships: WorkforceRelationshipInput[]) {
  return relationships.some(
    (relationship) =>
      relationship.status === "active" &&
      relationship.domainKind === "education_enrollment" &&
      Boolean(relationship.domainRecordId),
  );
}

function hasVerifiedProfessionalRelationship(relationships: WorkforceRelationshipInput[]) {
  return relationships.some(
    (relationship) =>
      relationship.status === "active" &&
      relationship.relationshipType === "professional" &&
      relationship.verificationState === "verified" &&
      relationship.domainKind === "provider" &&
      Boolean(relationship.domainRecordId),
  );
}

/**
 * Browser-safe projection of Person-owned workforce state.
 *
 * This function intentionally removes CareerArtifact source/parser provenance and
 * carries no domain record IDs, private contact data, PHI, credential evidence or
 * deterministic eligibility internals. It is navigation/context only: resume claims,
 * EDU relationships, placements, subscriptions and payments never mint professional
 * or clinical authority here.
 */
export function buildPersonWorkforceProjection(
  input: PersonWorkforceProjectionInput,
): PersonWorkforceProjection {
  const educationLinked = hasExplicitEducationRelationship(input.relationships);
  const verifiedProfessionalRelationship = hasVerifiedProfessionalRelationship(input.relationships);

  const career: PersonWorkforceProjection["career"] = input.careerArtifact
    ? {
        state: input.careerArtifact.humanConfirmedAt ? "human_confirmed_claims" : "claimed",
        artifactVersion: input.careerArtifact.artifactVersion,
        educationClaimCount: input.careerArtifact.claims.education.length,
        experienceClaimCount: input.careerArtifact.claims.experience.length,
        skillClaimCount: input.careerArtifact.claims.skills.length,
        careerGoals: [...input.careerArtifact.claims.careerGoals],
        grantsAuthority: false,
      }
    : {
        state: "missing",
        grantsAuthority: false,
      };

  const education: PersonWorkforceProjection["education"] = {
    relationshipState: educationLinked ? "linked" : "not_linked",
    // Verification of the Account email is only a prerequisite for a later explicit
    // relationship-claim ceremony. It is not a relationship by itself.
    emailVerificationRequiredBeforeClaim: !educationLinked && !input.accountEmailVerified,
    grantsAuthority: false,
  };

  const placement: PersonWorkforceProjection["placement"] = input.placement
    ? {
        state: input.placement.status,
        approvals: { ...input.placement.approvals },
        requiredMinutes: input.placement.requiredMinutes,
        acceptedMinutes: input.placement.acceptedMinutes,
        remainingMinutes: input.placement.remainingMinutes,
        hoursComplete: input.placement.hoursComplete,
        grantsProfessionalAuthority: false,
        grantsClinicalAuthority: false,
        grantsLicensure: false,
      }
    : null;

  const professional: PersonWorkforceProjection["professional"] = {
    relationshipState: verifiedProfessionalRelationship ? "verified_relationship" : "not_verified",
    // A verified Person↔Provider relationship is evidence/context. The real Grid
    // eligibility engine must still evaluate credentials, scope, jurisdiction,
    // privileges, malpractice and opportunity context before a match.
    professionalAuthorityEstablished: false,
    concreteEligibilityRequiredForMatch: true,
  };

  let workState: PersonWorkforceProjection["work"]["state"];
  let canDiscover = false;
  let nextAction: PersonWorkforceProjection["nextAction"];

  if (!input.careerArtifact) {
    workState = "career_profile_needed";
    nextAction = {
      pathId: "become-grid-ready",
      reason: "Build or confirm career claims before workforce discovery.",
    };
  } else if (input.placement && !input.placement.hoursComplete) {
    workState = "placement_in_progress";
    nextAction = {
      pathId: "student-clinical-placement",
      reason: "Continue the governed placement lifecycle and accepted-hour evidence.",
    };
  } else if (verifiedProfessionalRelationship) {
    workState = "grid_discovery_ready";
    canDiscover = true;
    nextAction = {
      pathId: "find-extra-work",
      reason: "Professional relationship evidence exists; Grid may discover opportunities, but each match still requires concrete eligibility.",
    };
  } else if (input.placement?.hoursComplete) {
    workState = "professional_verification_required";
    nextAction = {
      pathId: "become-grid-ready",
      reason: "Placement completion does not create licensure or professional authority; external professional verification remains required.",
    };
  } else if (educationLinked) {
    workState = "placement_needed";
    nextAction = {
      pathId: "student-clinical-placement",
      reason: "An explicit EDU relationship exists; continue through the governed placement path when applicable.",
    };
  } else {
    workState = "professional_verification_required";
    nextAction = {
      pathId: "become-grid-ready",
      reason: "Career claims are present, but verified professional relationship and concrete eligibility remain separate requirements.",
    };
  }

  return {
    career,
    education,
    placement,
    professional,
    work: {
      state: workState,
      canDiscover,
      canMatch: false,
      concreteEligibilityRequired: true,
    },
    nextAction,
  };
}
