export type CareerClaimState = "claimed" | "human_confirmed";
export type CareerEvidenceVerificationState = "unverified" | "verified" | "rejected" | "expired" | "unknown";

export type CareerEducationClaim = {
  id: string;
  school: string;
  program: string | null;
  completionState: CareerClaimState;
  evidenceReference: string | null;
  evidenceVerificationState: CareerEvidenceVerificationState;
};

export type CareerExperienceClaim = {
  id: string;
  employer: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  completionState: CareerClaimState;
  evidenceReference: string | null;
  evidenceVerificationState: CareerEvidenceVerificationState;
};

export type CareerSkillClaim = {
  id: string;
  name: string;
  completionState: CareerClaimState;
  evidenceReference: string | null;
  evidenceVerificationState: CareerEvidenceVerificationState;
};

export type CareerParserProvenance = {
  assisted: boolean;
  provider: string | null;
  model: string | null;
  runReference: string | null;
  confidence: number | null;
};

export type CareerArtifact = {
  id: string;
  personId: string;
  artifactType: "resume" | "manual" | "import";
  sourceType: string;
  sourceReference: string | null;
  version: number;
  status: "active" | "superseded" | "archived";
  supersedesArtifactId: string | null;
  claimState: CareerClaimState;
  educationClaims: CareerEducationClaim[];
  experienceClaims: CareerExperienceClaim[];
  skillClaims: CareerSkillClaim[];
  careerGoals: string[];
  roleInterests: string[];
  locationPreferences: string[];
  availabilityPreferences: string[];
  parserProvenance: CareerParserProvenance | null;
  humanConfirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

type CareerArtifactVersionPatch = Partial<
  Pick<
    CareerArtifact,
    | "artifactType"
    | "sourceType"
    | "sourceReference"
    | "claimState"
    | "educationClaims"
    | "experienceClaims"
    | "skillClaims"
    | "careerGoals"
    | "roleInterests"
    | "locationPreferences"
    | "availabilityPreferences"
    | "parserProvenance"
    | "humanConfirmedAt"
    | "effectiveFrom"
    | "effectiveTo"
  >
> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

function cloneArtifactClaims(artifact: CareerArtifact) {
  return {
    educationClaims: artifact.educationClaims.map((claim) => ({ ...claim })),
    experienceClaims: artifact.experienceClaims.map((claim) => ({ ...claim })),
    skillClaims: artifact.skillClaims.map((claim) => ({ ...claim })),
    careerGoals: [...artifact.careerGoals],
    roleInterests: [...artifact.roleInterests],
    locationPreferences: [...artifact.locationPreferences],
    availabilityPreferences: [...artifact.availabilityPreferences],
    parserProvenance: artifact.parserProvenance ? { ...artifact.parserProvenance } : null,
  };
}

export function createCareerArtifactVersion(
  previous: CareerArtifact,
  patch: CareerArtifactVersionPatch,
): CareerArtifact {
  const cloned = cloneArtifactClaims(previous);
  const next: CareerArtifact = {
    ...previous,
    ...cloned,
    ...patch,
    personId: previous.personId,
    version: previous.version + 1,
    status: "active",
    supersedesArtifactId: previous.id,
    educationClaims: patch.educationClaims?.map((claim) => ({ ...claim })) ?? cloned.educationClaims,
    experienceClaims: patch.experienceClaims?.map((claim) => ({ ...claim })) ?? cloned.experienceClaims,
    skillClaims: patch.skillClaims?.map((claim) => ({ ...claim })) ?? cloned.skillClaims,
    careerGoals: patch.careerGoals ? [...patch.careerGoals] : cloned.careerGoals,
    roleInterests: patch.roleInterests ? [...patch.roleInterests] : cloned.roleInterests,
    locationPreferences: patch.locationPreferences
      ? [...patch.locationPreferences]
      : cloned.locationPreferences,
    availabilityPreferences: patch.availabilityPreferences
      ? [...patch.availabilityPreferences]
      : cloned.availabilityPreferences,
    parserProvenance:
      patch.parserProvenance === undefined
        ? cloned.parserProvenance
        : patch.parserProvenance
          ? { ...patch.parserProvenance }
          : null,
    effectiveFrom: patch.effectiveFrom ?? patch.createdAt,
    effectiveTo: patch.effectiveTo ?? null,
  };

  return next;
}

export type CareerArtifactMatchingProjection = {
  personId: string;
  artifactId: string;
  artifactVersion: number;
  roleInterests: string[];
  careerGoals: string[];
  locationPreferences: string[];
  availabilityPreferences: string[];
  skillClaims: Array<{
    name: string;
    claimState: CareerClaimState;
    evidenceVerificationState: CareerEvidenceVerificationState;
  }>;
  educationClaims: Array<{
    school: string;
    program: string | null;
    claimState: CareerClaimState;
    evidenceVerificationState: CareerEvidenceVerificationState;
  }>;
  experienceClaims: Array<{
    employer: string;
    title: string;
    claimState: CareerClaimState;
    evidenceVerificationState: CareerEvidenceVerificationState;
  }>;
  professionalEligibilitySatisfied: false;
  inferredAuthority: {
    professional: false;
    clinical: false;
    billing: false;
    organizationBinding: false;
    placementApproval: false;
  };
};

export function projectCareerArtifactForMatching(
  artifact: CareerArtifact,
): CareerArtifactMatchingProjection {
  return {
    personId: artifact.personId,
    artifactId: artifact.id,
    artifactVersion: artifact.version,
    roleInterests: [...artifact.roleInterests],
    careerGoals: [...artifact.careerGoals],
    locationPreferences: [...artifact.locationPreferences],
    availabilityPreferences: [...artifact.availabilityPreferences],
    skillClaims: artifact.skillClaims.map((claim) => ({
      name: claim.name,
      claimState: claim.completionState,
      evidenceVerificationState: claim.evidenceVerificationState,
    })),
    educationClaims: artifact.educationClaims.map((claim) => ({
      school: claim.school,
      program: claim.program,
      claimState: claim.completionState,
      evidenceVerificationState: claim.evidenceVerificationState,
    })),
    experienceClaims: artifact.experienceClaims.map((claim) => ({
      employer: claim.employer,
      title: claim.title,
      claimState: claim.completionState,
      evidenceVerificationState: claim.evidenceVerificationState,
    })),
    professionalEligibilitySatisfied: false,
    inferredAuthority: {
      professional: false,
      clinical: false,
      billing: false,
      organizationBinding: false,
      placementApproval: false,
    },
  };
}

export function projectPublicCareerProfile(_artifact: CareerArtifact): null {
  // A private CareerArtifact never becomes public simply because it exists or was parsed.
  // Public professional projection remains a separate, explicit, verification-gated flow.
  return null;
}
