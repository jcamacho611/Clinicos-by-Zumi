export type CareerVerificationState = "claimed" | "verified" | "rejected" | "unknown";

export type CareerArtifactSource = {
  type: "resume";
  reference: string;
  capturedAt: Date;
  version: number;
};

export type CareerEducationClaim = {
  id: string;
  school: string;
  program?: string | null;
  graduationDate?: string | null;
  verificationState: CareerVerificationState;
};

export type CareerExperienceClaim = {
  id: string;
  organization: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  summary?: string | null;
  verificationState: CareerVerificationState;
};

export type CareerSkillClaim = {
  id: string;
  label: string;
  verificationState: CareerVerificationState;
};

export type CareerEduEvidence = {
  id: string;
  kind: "competency" | "course_completion" | "assessment" | "other";
  label: string;
  verificationState: CareerVerificationState;
};

export type CareerPreferences = {
  roleInterests?: string[];
  locationText?: string;
  availabilityText?: string;
};

export type CareerArtifactInput = {
  artifactId: string;
  personId: string;
  source: CareerArtifactSource;
  education: CareerEducationClaim[];
  experience: CareerExperienceClaim[];
  skills: CareerSkillClaim[];
  preferences: CareerPreferences;
  eduEvidence?: CareerEduEvidence[];
  privateNotes?: string;
};

export type CareerArtifact = CareerArtifactInput & {
  eduEvidence: CareerEduEvidence[];
  authorityEffect: {
    professional: false;
    clinical: false;
    billing: false;
    organizationBinding: false;
  };
};

const NO_AUTHORITY = {
  professional: false,
  clinical: false,
  billing: false,
  organizationBinding: false,
} as const;

function normalizeResumeClaimState(state: CareerVerificationState): CareerVerificationState {
  // A resume is a claim source, not a verification authority. A caller cannot make a
  // resume fact verified merely by labeling it that way. Separate governed evidence
  // may later verify the same fact through the appropriate domain workflow.
  return state === "verified" ? "claimed" : state;
}

/**
 * Creates a private, versioned career evidence object.
 *
 * This function deliberately does not verify or infer anything. It preserves only
 * the facts supplied to it and carries an explicit no-authority result so callers
 * cannot mistake resume/EDU material for permission to practise, bill, bind an
 * organization, or access clinical information.
 */
export function createCareerArtifact(input: CareerArtifactInput): CareerArtifact {
  return {
    ...input,
    source: { ...input.source },
    education: input.education.map((claim) => ({
      ...claim,
      verificationState: normalizeResumeClaimState(claim.verificationState),
    })),
    experience: input.experience.map((claim) => ({
      ...claim,
      verificationState: normalizeResumeClaimState(claim.verificationState),
    })),
    skills: input.skills.map((claim) => ({
      ...claim,
      verificationState: normalizeResumeClaimState(claim.verificationState),
    })),
    preferences: {
      ...(input.preferences.roleInterests ? { roleInterests: [...input.preferences.roleInterests] } : {}),
      ...(input.preferences.locationText ? { locationText: input.preferences.locationText } : {}),
      ...(input.preferences.availabilityText ? { availabilityText: input.preferences.availabilityText } : {}),
    },
    eduEvidence: (input.eduEvidence ?? []).map((evidence) => ({ ...evidence })),
    ...(input.privateNotes === undefined ? {} : { privateNotes: input.privateNotes }),
    authorityEffect: NO_AUTHORITY,
  };
}

function normalizeClaim(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export type CareerTruthCheckInput = {
  sourceFacts: string[];
  proposedClaims: string[];
};

export type CareerTruthCheckResult = {
  acceptedClaims: string[];
  unsupportedClaims: string[];
  safeToPublish: boolean;
};

/**
 * Conservative truth gate for AI-assisted resume language.
 *
 * A proposed factual claim is accepted only when the same factual statement exists
 * in the supplied source facts after harmless whitespace/case normalization. More
 * sophisticated rewriting can be introduced later only with evidence-aware tests;
 * this baseline intentionally prefers omission over fabrication.
 */
export function truthCheckCareerDraft(input: CareerTruthCheckInput): CareerTruthCheckResult {
  const source = new Set(input.sourceFacts.map(normalizeClaim));
  const acceptedClaims: string[] = [];
  const unsupportedClaims: string[] = [];

  for (const claim of input.proposedClaims) {
    if (source.has(normalizeClaim(claim))) acceptedClaims.push(claim);
    else unsupportedClaims.push(claim);
  }

  return {
    acceptedClaims,
    unsupportedClaims,
    safeToPublish: unsupportedClaims.length === 0,
  };
}

export type PublicCareerProfileProjection = {
  personId: string;
  roleInterests: string[];
  skills: string[];
  locationText?: string;
};

/**
 * Explicit privacy-safe projection. Private source references, notes, employers,
 * school records, dates and availability details remain inside the private artifact.
 */
export function projectPublicCareerProfile(artifact: CareerArtifact): PublicCareerProfileProjection {
  return {
    personId: artifact.personId,
    roleInterests: [...(artifact.preferences.roleInterests ?? [])],
    skills: artifact.skills.map((skill) => skill.label),
    ...(artifact.preferences.locationText ? { locationText: artifact.preferences.locationText } : {}),
  };
}

export type PlacementDiscoveryProfile = {
  personId: string;
  roleInterests: string[];
  locationText?: string;
  availabilityText?: string;
  demonstratedCompetencies: string[];
  requiresClinicalEligibility: true;
  eligibilityVerified: false;
  schoolApprovalVerified: false;
  siteApprovalVerified: false;
  preceptorApprovalVerified: false;
};

/**
 * Gives the existing EDU/Grid placement flow useful preferences without manufacturing
 * any approval or eligibility. Grid and the education/site/preceptor authorities stay
 * responsible for those decisions.
 */
export function buildPlacementDiscoveryProfile(
  artifact: CareerArtifact,
  input: { demonstratedCompetencies: string[] },
): PlacementDiscoveryProfile {
  return {
    personId: artifact.personId,
    roleInterests: [...(artifact.preferences.roleInterests ?? [])],
    ...(artifact.preferences.locationText ? { locationText: artifact.preferences.locationText } : {}),
    ...(artifact.preferences.availabilityText ? { availabilityText: artifact.preferences.availabilityText } : {}),
    demonstratedCompetencies: [...input.demonstratedCompetencies],
    requiresClinicalEligibility: true,
    eligibilityVerified: false,
    schoolApprovalVerified: false,
    siteApprovalVerified: false,
    preceptorApprovalVerified: false,
  };
}
