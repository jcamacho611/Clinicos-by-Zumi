import type { KlinikosRiskClass } from "@/lib/orchestration/contracts";

export type GovernedRuleDomain =
  | "quality"
  | "compliance"
  | "credentialing"
  | "authorization"
  | "revenue"
  | "referral"
  | "safety"
  | "inventory"
  | "education"
  | "grid"
  | "operations";

export type GovernedRuleAuthority =
  | "regulatory"
  | "contractual"
  | "organizational"
  | "clinical_policy"
  | "credential"
  | "financial"
  | "education"
  | "safety"
  | "operational";

export type GovernedRulePredicateOperator =
  | "equals"
  | "not_equals"
  | "in"
  | "not_in"
  | "exists"
  | "gte"
  | "lte"
  | "contains";

export type GovernedRulePredicate = {
  factKey: string;
  operator: GovernedRulePredicateOperator;
  value?: unknown;
};

export type EvidenceRequirement = {
  key: string;
  label: string;
  evidenceTypes: string[];
  minCount?: number;
  maxAgeDays?: number | null;
  requiredAttributes?: Record<string, unknown>;
};

export type GovernedRuleDefinition = {
  id: string;
  key: string;
  version: string;
  title: string;
  description: string;
  domain: GovernedRuleDomain;
  authority: GovernedRuleAuthority;
  sourceRef?: string | null;
  subjectType: string;
  status: "draft" | "active" | "retired";
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  applicability: GovernedRulePredicate[];
  evidenceRequirements: EvidenceRequirement[];
  closureMode: "all" | "any";
  riskClass: KlinikosRiskClass;
  requiresHumanReview: boolean;
  ownerRoleKeys: string[];
};

export type GovernedEvidenceRecord = {
  id: string;
  subjectType: string;
  subjectId: string;
  organizationId?: string | null;
  evidenceType: string;
  sourceRef: string;
  observedAt: Date;
  expiresAt?: Date | null;
  attributes: Record<string, unknown>;
  verifiedBy?: string | null;
};

export type GovernedRuleEvaluationStatus =
  | "not_applicable"
  | "gap"
  | "review_required"
  | "satisfied";

export type GovernedRuleEvaluation = {
  id: string;
  ruleId: string;
  ruleKey: string;
  ruleVersion: string;
  ruleTitle: string;
  domain: GovernedRuleDomain;
  subjectType: string;
  subjectId: string;
  organizationId?: string | null;
  status: GovernedRuleEvaluationStatus;
  riskClass: KlinikosRiskClass;
  applicable: boolean;
  matchedEvidenceRefs: string[];
  expiredEvidenceRefs: string[];
  missingEvidenceKeys: string[];
  reasons: string[];
  ownerRoleKeys: string[];
  dueAt?: Date | null;
  evaluatedAt: Date;
};

function comparable(value: unknown) {
  if (value instanceof Date) return value.getTime();
  return value;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

export function predicateMatches(facts: Record<string, unknown>, predicate: GovernedRulePredicate) {
  const actual = facts[predicate.factKey];
  const expected = predicate.value;

  switch (predicate.operator) {
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";
    case "equals":
      return comparable(actual) === comparable(expected);
    case "not_equals":
      return comparable(actual) !== comparable(expected);
    case "in":
      return asArray(expected).some((value) => comparable(value) === comparable(actual));
    case "not_in":
      return !asArray(expected).some((value) => comparable(value) === comparable(actual));
    case "gte":
      return typeof comparable(actual) === "number" && typeof comparable(expected) === "number"
        ? (comparable(actual) as number) >= (comparable(expected) as number)
        : false;
    case "lte":
      return typeof comparable(actual) === "number" && typeof comparable(expected) === "number"
        ? (comparable(actual) as number) <= (comparable(expected) as number)
        : false;
    case "contains":
      if (Array.isArray(actual)) return actual.some((value) => comparable(value) === comparable(expected));
      if (typeof actual === "string" && typeof expected === "string") return actual.includes(expected);
      return false;
  }
}

function attributesMatch(attributes: Record<string, unknown>, required?: Record<string, unknown>) {
  if (!required) return true;
  return Object.entries(required).every(([key, value]) => comparable(attributes[key]) === comparable(value));
}

function isEvidenceCurrent(record: GovernedEvidenceRecord, now: Date, maxAgeDays?: number | null) {
  if (record.expiresAt && record.expiresAt < now) return false;
  if (maxAgeDays == null) return true;
  const oldestAllowed = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  return record.observedAt.getTime() >= oldestAllowed;
}

export function evaluateGovernedRule(input: {
  rule: GovernedRuleDefinition;
  subjectId: string;
  organizationId?: string | null;
  facts: Record<string, unknown>;
  evidence: readonly GovernedEvidenceRecord[];
  dueAt?: Date | null;
  now?: Date;
}): GovernedRuleEvaluation {
  const now = input.now ?? new Date();
  const evaluationId = `${input.rule.id}:${input.subjectId}:${input.rule.version}`;
  const effective = input.rule.status === "active"
    && input.rule.effectiveFrom <= now
    && (!input.rule.effectiveTo || input.rule.effectiveTo >= now);
  const applicable = effective && input.rule.applicability.every((predicate) => predicateMatches(input.facts, predicate));

  if (!applicable) {
    return {
      id: evaluationId,
      ruleId: input.rule.id,
      ruleKey: input.rule.key,
      ruleVersion: input.rule.version,
      ruleTitle: input.rule.title,
      domain: input.rule.domain,
      subjectType: input.rule.subjectType,
      subjectId: input.subjectId,
      organizationId: input.organizationId ?? null,
      status: "not_applicable",
      riskClass: input.rule.riskClass,
      applicable: false,
      matchedEvidenceRefs: [],
      expiredEvidenceRefs: [],
      missingEvidenceKeys: [],
      reasons: [effective ? "Applicability criteria were not met." : "Rule is not active for the evaluation date."],
      ownerRoleKeys: input.rule.ownerRoleKeys,
      dueAt: input.dueAt ?? null,
      evaluatedAt: now,
    };
  }

  const candidateEvidence = input.evidence.filter((record) =>
    record.subjectType === input.rule.subjectType
    && record.subjectId === input.subjectId
    && (!input.organizationId || !record.organizationId || record.organizationId === input.organizationId));

  const matchedEvidenceRefs = new Set<string>();
  const expiredEvidenceRefs = new Set<string>();
  const missingEvidenceKeys: string[] = [];

  for (const requirement of input.rule.evidenceRequirements) {
    const matchingType = candidateEvidence.filter((record) =>
      requirement.evidenceTypes.includes(record.evidenceType)
      && attributesMatch(record.attributes, requirement.requiredAttributes));
    const current = matchingType.filter((record) => isEvidenceCurrent(record, now, requirement.maxAgeDays));
    const stale = matchingType.filter((record) => !isEvidenceCurrent(record, now, requirement.maxAgeDays));
    current.forEach((record) => matchedEvidenceRefs.add(record.sourceRef));
    stale.forEach((record) => expiredEvidenceRefs.add(record.sourceRef));

    if (current.length < Math.max(1, requirement.minCount ?? 1)) missingEvidenceKeys.push(requirement.key);
  }

  const requirementCount = input.rule.evidenceRequirements.length;
  const satisfiedCount = requirementCount - missingEvidenceKeys.length;
  const evidenceSatisfied = requirementCount === 0
    || (input.rule.closureMode === "all" ? missingEvidenceKeys.length === 0 : satisfiedCount > 0);

  const status: GovernedRuleEvaluationStatus = evidenceSatisfied
    ? input.rule.requiresHumanReview ? "review_required" : "satisfied"
    : "gap";

  const reasons: string[] = [];
  if (status === "gap") reasons.push(`${missingEvidenceKeys.length} evidence requirement(s) remain unsatisfied.`);
  if (expiredEvidenceRefs.size) reasons.push(`${expiredEvidenceRefs.size} matching evidence item(s) are expired or outside the allowed age window.`);
  if (status === "review_required") reasons.push("Evidence requirements are met, but deterministic policy requires authorized human review before closure.");
  if (status === "satisfied") reasons.push("Applicable deterministic rule requirements are satisfied by current evidence.");

  return {
    id: evaluationId,
    ruleId: input.rule.id,
    ruleKey: input.rule.key,
    ruleVersion: input.rule.version,
    ruleTitle: input.rule.title,
    domain: input.rule.domain,
    subjectType: input.rule.subjectType,
    subjectId: input.subjectId,
    organizationId: input.organizationId ?? null,
    status,
    riskClass: input.rule.riskClass,
    applicable: true,
    matchedEvidenceRefs: [...matchedEvidenceRefs],
    expiredEvidenceRefs: [...expiredEvidenceRefs],
    missingEvidenceKeys,
    reasons,
    ownerRoleKeys: input.rule.ownerRoleKeys,
    dueAt: input.dueAt ?? null,
    evaluatedAt: now,
  };
}

/**
 * This engine is deterministic infrastructure. It does not encode proprietary
 * measure specifications, infer clinical truth, or allow an AI response to
 * establish rule satisfaction. Program-specific rule packages must be sourced,
 * licensed where required, versioned, reviewed, and activated separately.
 */
export function evaluateGovernedRuleSet(input: {
  rules: readonly GovernedRuleDefinition[];
  subjectId: string;
  organizationId?: string | null;
  facts: Record<string, unknown>;
  evidence: readonly GovernedEvidenceRecord[];
  dueAtByRuleKey?: Readonly<Record<string, Date | null | undefined>>;
  now?: Date;
}) {
  return input.rules.map((rule) => evaluateGovernedRule({
    rule,
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    facts: input.facts,
    evidence: input.evidence,
    dueAt: input.dueAtByRuleKey?.[rule.key] ?? null,
    now: input.now,
  }));
}
