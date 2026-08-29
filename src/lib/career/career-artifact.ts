export type CareerClaimKind = "education" | "experience" | "skill" | "goal";

export type CareerClaim = {
  id: string;
  personId: string;
  kind: CareerClaimKind;
  value: string;
  source: "resume";
  verificationState: "claimed";
  grantsAuthority: false;
};

export type ResumeCareerArtifactInput = {
  personId: string;
  summary?: string | null;
  education?: string[];
  experience?: string[];
  skills?: string[];
  goals?: string[];
};

export type CareerArtifact = {
  personId: string;
  summary: string;
  claims: CareerClaim[];
  inferredAuthority: {
    professional: false;
    clinical: false;
  };
};

function normalizedValues(values: string[] | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

export function buildCareerArtifactFromResume(input: ResumeCareerArtifactInput): CareerArtifact {
  const personId = input.personId.trim();
  if (!personId) throw new Error("personId is required");

  const grouped: Array<[CareerClaimKind, string[]]> = [
    ["education", normalizedValues(input.education)],
    ["experience", normalizedValues(input.experience)],
    ["skill", normalizedValues(input.skills)],
    ["goal", normalizedValues(input.goals)],
  ];

  const claims = grouped.flatMap(([kind, values]) =>
    values.map((value, index) => ({
      id: `${personId}:${kind}:${index + 1}`,
      personId,
      kind,
      value,
      source: "resume" as const,
      verificationState: "claimed" as const,
      grantsAuthority: false as const,
    })),
  );

  return {
    personId,
    summary: input.summary?.trim() ?? "",
    claims,
    inferredAuthority: {
      professional: false,
      clinical: false,
    },
  };
}
