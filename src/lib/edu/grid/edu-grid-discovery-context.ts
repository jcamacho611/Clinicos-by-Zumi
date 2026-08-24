export type EduGridDiscoveryInput = {
  optedIn: boolean;
  pathway: string;
  completionDate: string;
  releasedCompetencies: readonly string[];
  opportunityIntents: readonly string[];
};

export function buildEduGridDiscoveryContext(input: EduGridDiscoveryInput) {
  if (!input.optedIn) return null;

  return {
    evidenceKind: "training_completion" as const,
    pathway: input.pathway,
    completionDate: input.completionDate,
    releasedCompetencies: [...input.releasedCompetencies],
    opportunityIntents: [...input.opportunityIntents],
    establishesLicensure: false as const,
    establishesEmploymentEligibility: false as const,
    autoApply: false as const,
  };
}
