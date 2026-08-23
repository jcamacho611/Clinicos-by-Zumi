export type UniversalTrustDomain = "grid";
export type UniversalTrustKind = "commercial_dispute" | "safety_incident";
export type UniversalTrustSeverity = "review" | "low" | "medium" | "high" | "urgent";

export interface UniversalTrustAuthorityProjection {
  refundExecuted: false;
  payoutActionExecuted: false;
  participantRestrictionExecuted: false;
  resourceSuspensionExecuted: false;
  medicalDeterminationMade: false;
}

export interface UniversalTrustSignal {
  id: string;
  domain: UniversalTrustDomain;
  kind: UniversalTrustKind;
  category: string;
  status: string;
  severity: UniversalTrustSeverity;
  summary: string;
  relatedResourceId: string;
  updatedAt: string;
  open: boolean;
  blocksSettlement: boolean;
  authority: UniversalTrustAuthorityProjection;
  source: {
    recordType: "GridDisputeRecord" | "GridSafetyIncidentRecord";
    recordId: string;
  };
}

type GridDisputeSource = {
  id: string;
  reservationId: string;
  category: string;
  summary: string;
  status: string;
  updatedAt: string;
};

type GridSafetyIncidentSource = {
  id: string;
  reservationId: string;
  category: string;
  severity: string;
  summary: string;
  status: string;
  updatedAt: string;
};

const noExecutedAuthority: UniversalTrustAuthorityProjection = {
  refundExecuted: false,
  payoutActionExecuted: false,
  participantRestrictionExecuted: false,
  resourceSuspensionExecuted: false,
  medicalDeterminationMade: false,
};

function normalizeSafetySeverity(value: string): UniversalTrustSeverity {
  return value === "low" || value === "medium" || value === "high" || value === "urgent"
    ? value
    : "review";
}

export function projectGridTrustSignals(input: {
  disputes: readonly GridDisputeSource[];
  safetyIncidents: readonly GridSafetyIncidentSource[];
}): UniversalTrustSignal[] {
  const disputes: UniversalTrustSignal[] = input.disputes.map((item) => ({
    id: `grid:dispute:${item.id}`,
    domain: "grid",
    kind: "commercial_dispute",
    category: item.category,
    status: item.status,
    severity: "review",
    summary: item.summary,
    relatedResourceId: item.reservationId,
    updatedAt: item.updatedAt,
    open: item.status !== "closed",
    blocksSettlement: item.status !== "closed",
    authority: { ...noExecutedAuthority },
    source: {
      recordType: "GridDisputeRecord",
      recordId: item.id,
    },
  }));

  const safetyIncidents: UniversalTrustSignal[] = input.safetyIncidents.map((item) => ({
    id: `grid:safety:${item.id}`,
    domain: "grid",
    kind: "safety_incident",
    category: item.category,
    status: item.status,
    severity: normalizeSafetySeverity(item.severity),
    summary: item.summary,
    relatedResourceId: item.reservationId,
    updatedAt: item.updatedAt,
    open: item.status !== "closed",
    blocksSettlement: item.status !== "closed",
    authority: { ...noExecutedAuthority },
    source: {
      recordType: "GridSafetyIncidentRecord",
      recordId: item.id,
    },
  }));

  return [...disputes, ...safetyIncidents].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}