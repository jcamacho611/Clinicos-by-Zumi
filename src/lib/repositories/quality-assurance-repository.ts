import "server-only";

import { can } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";
import type { KlinikosRiskClass } from "@/lib/orchestration/contracts";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";

const MAX_ACTIVE_QUALITY_GAPS = 2_000;

export type PersistedQualityAssuranceLoad = {
  authorized: boolean;
  complete: boolean;
  evaluations: GovernedRuleEvaluation[];
  warnings: string[];
  coverage: "persisted_active_quality_gap_backlog";
};

function impactRiskClass(impact: string): KlinikosRiskClass {
  const normalized = impact.trim().toLowerCase();
  if (normalized === "high" || normalized === "critical" || normalized === "urgent") return "review";
  return "low";
}

function normalizedStatus(status: string) {
  return status.trim().toLowerCase();
}

/**
 * Adapter over the QualityMeasure / QualityGap tables that already exist in
 * Klinikos. This does NOT pretend those legacy records are a complete CMS/NCQA/
 * HEDIS calculation engine. It exposes the current persisted *active gap backlog*
 * to the new governed orchestration layer so Zumi can coordinate real work now.
 *
 * Closed legacy gaps are deliberately not converted into `satisfied` rule results:
 * those rows do not carry the provenance required by the new Rules & Evidence
 * engine to prove deterministic satisfaction.
 */
export async function loadPersistedActiveQualityGapEvaluations(
  session: ClinicSession,
): Promise<PersistedQualityAssuranceLoad> {
  if (!can(session.role, "quality", "read")) {
    return {
      authorized: false,
      complete: false,
      evaluations: [],
      warnings: ["Quality assurance access is not authorized for the active session."],
      coverage: "persisted_active_quality_gap_backlog",
    };
  }

  try {
    const gaps = await db.qualityGap.findMany({
      where: {
        organizationId: session.organizationId,
        status: { not: "closed" },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: MAX_ACTIVE_QUALITY_GAPS + 1,
    });

    if (gaps.length > MAX_ACTIVE_QUALITY_GAPS) {
      return {
        authorized: true,
        complete: false,
        evaluations: [],
        warnings: [
          `The active quality-gap backlog exceeds the bounded ${MAX_ACTIVE_QUALITY_GAPS}-record Zumi loader. No partial aggregate was produced.`,
          "Coverage remains limited to persisted QualityGap records and is not a population-wide quality-program calculation.",
        ],
        coverage: "persisted_active_quality_gap_backlog",
      };
    }

    const measureIds = [...new Set(gaps.map((gap) => gap.measureId))];
    // Only active definitions are treated as current governed mappings. A gap that
    // points at an inactive/retired definition remains visible as an unmapped gap so
    // historical data cannot silently authorize current operational interpretation.
    const measures = measureIds.length
      ? await db.qualityMeasure.findMany({
          where: {
            organizationId: session.organizationId,
            id: { in: measureIds },
            status: "active",
          },
        })
      : [];
    const measureById = new Map(measures.map((measure) => [measure.id, measure]));
    let unmappedMeasures = 0;

    const evaluations = gaps.map<GovernedRuleEvaluation>((gap) => {
      const measure = measureById.get(gap.measureId);
      if (!measure) unmappedMeasures += 1;
      const key = measure?.key ?? `legacy.unmapped.${gap.measureId}`;
      const version = measure?.version?.trim() || "legacy-unversioned";
      const title = measure?.name ?? "Unmapped persisted quality gap";
      const state = normalizedStatus(gap.status);

      return {
        id: `persisted-quality-gap:${gap.id}`,
        ruleId: measure?.id ?? gap.measureId,
        ruleKey: key,
        ruleVersion: version,
        ruleTitle: title,
        domain: "quality",
        subjectType: "patient",
        subjectId: gap.patientId,
        organizationId: session.organizationId,
        status: "gap",
        riskClass: impactRiskClass(gap.impact),
        applicable: true,
        matchedEvidenceRefs: [],
        expiredEvidenceRefs: [],
        missingEvidenceKeys: ["persisted_quality_gap_evidence"],
        reasons: [
          state === "open"
            ? "A persisted quality gap is open and requires governed follow-up."
            : `A persisted quality gap is in '${state}' workflow state and remains unresolved.`,
          "This legacy gap record does not by itself prove the underlying program measure, evidence provenance, or compliance status.",
        ],
        ownerRoleKeys: ["quality"],
        dueAt: gap.dueAt,
        evaluatedAt: gap.updatedAt,
      };
    });

    const warnings = [
      "Coverage is limited to the current persisted active QualityGap backlog; population-wide versioned program evaluation is not yet connected.",
    ];
    if (unmappedMeasures > 0) {
      warnings.push(`${unmappedMeasures} active quality gap record(s) do not map to an active measure definition inside the active organization.`);
    }

    return {
      authorized: true,
      complete: true,
      evaluations,
      warnings,
      coverage: "persisted_active_quality_gap_backlog",
    };
  } catch (error) {
    console.error("[quality-assurance] failed to load persisted gap backlog", error instanceof Error ? error.message : "unknown error");
    return {
      authorized: true,
      complete: false,
      evaluations: [],
      warnings: [
        "Persisted quality-gap state could not be loaded. No quality aggregate was produced.",
        "Coverage remains limited to persisted QualityGap records and is not a population-wide quality-program calculation.",
      ],
      coverage: "persisted_active_quality_gap_backlog",
    };
  }
}
