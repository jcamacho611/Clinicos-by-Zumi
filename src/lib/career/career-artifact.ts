export const CAREER_CLAIM_KINDS = [
  "education",
  "experience",
  "skill",
  "career_goal",
  "availability",
  "professional_credential",
] as const;

export type CareerClaimKind = (typeof CAREER_CLAIM_KINDS)[number];
export type CareerVerificationState = "claimed" | "verified" | "rejected" | "expired" | "unknown";

export type CareerArtifactSource = {
  kind: "resume" | "profile" | "user_statement" | "institution_record" | "other";
  label: string;
  capturedAt: Date;
};

export type CareerClaimInput = {
  kind: CareerClaimKind;
  label: string;
  value: string;
  /** Exact supporting text or explicit source statement for this structured claim. */
  sourceText: string;
};

export type CareerArtifactInput = {
  subjectPersonId: string;
  source: CareerArtifactSource;
  claims: CareerClaimInput[];
};

export type CareerClaim = CareerClaimInput & {
  verificationState: "claimed";
  grantsAuthority: false;
};

export type CareerArtifact = {
  subjectPersonId: string;
  source: CareerArtifactSource;
  claims: CareerClaim[];
  authority: {
    professional: false;
    clinical: false;
    billing: false;
    placementApproval: false;
    employmentEligibility: false;
  };
};

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} requires source-backed text.`);
  return normalized;
}

/**
 * Build a non-authoritative career artifact from facts the user or a source supplied.
 *
 * This function does not parse missing facts, infer credentials, verify licenses, or
 * decide eligibility. Even a line that looks like a professional credential enters as
 * a claim. A separate authoritative verification flow must resolve it before any
 * regulated-work eligibility decision may rely on it.
 */
export function buildCareerArtifact(input: CareerArtifactInput): CareerArtifact {
  const subjectPersonId = requireText(input.subjectPersonId, "subjectPersonId");
  const source: CareerArtifactSource = {
    ...input.source,
    label: requireText(input.source.label, "source label"),
  };

  const claims = input.claims.map<CareerClaim>((claim) => ({
    kind: claim.kind,
    label: requireText(claim.label, "claim label"),
    value: requireText(claim.value, "claim value"),
    sourceText: requireText(claim.sourceText, "claim source"),
    verificationState: "claimed",
    grantsAuthority: false,
  }));

  return {
    subjectPersonId,
    source,
    claims,
    authority: {
      professional: false,
      clinical: false,
      billing: false,
      placementApproval: false,
      employmentEligibility: false,
    },
  };
}

export type CareerGridSignal = {
  kind: CareerClaimKind;
  label: string;
  value: string;
  verificationState: CareerVerificationState;
  eligibleForRegulatedWork: false;
};

export type CareerGridSignals = {
  have: CareerGridSignal[];
  need: CareerGridSignal[];
  boundary: string;
};

const needKinds = new Set<CareerClaimKind>(["career_goal", "availability"]);

/**
 * Translate career claims into Grid-friendly I HAVE / I NEED signals without turning
 * them into match eligibility. Grid may use them for discovery and next-step routing;
 * deterministic eligibility still has to verify the requirements of a real opportunity.
 */
export function deriveCareerGridSignals(artifact: CareerArtifact): CareerGridSignals {
  const have: CareerGridSignal[] = [];
  const need: CareerGridSignal[] = [];

  for (const claim of artifact.claims) {
    const signal: CareerGridSignal = {
      kind: claim.kind,
      label: claim.label,
      value: claim.value,
      verificationState: claim.verificationState,
      eligibleForRegulatedWork: false,
    };
    (needKinds.has(claim.kind) ? need : have).push(signal);
  }

  return {
    have,
    need,
    boundary:
      "Career and resume evidence helps Klinikos understand goals and discovery context. It does not establish licensure, clinical authority, placement approval, employment eligibility, or permission to perform regulated work.",
  };
}
