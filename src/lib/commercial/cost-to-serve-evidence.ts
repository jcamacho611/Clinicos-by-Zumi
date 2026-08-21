import "server-only";

import { COST_LINES } from "@/lib/commercial/cost-to-serve";
import { publishedCostRateEvidenceFor, type CostRateEvidence } from "@/lib/commercial/cost-rate-evidence";

export type CostLineEvidenceStatus = {
  readonly key: string;
  readonly label: string;
  readonly driver: string;
  readonly billingUnit: string;
  readonly fixedOrVariable: "fixed" | "variable";
  readonly tenantAttributable: boolean;
  /** Monthly clinic amount remains the input used by gross-margin arithmetic. */
  readonly monthlyCentsPerClinic: number | null;
  /** Public unit-rate context may be known even when monthly tenant cost is not. */
  readonly publishedRateEvidence: CostRateEvidence | null;
  readonly monthlyCostKnown: boolean;
};

/**
 * Evidence matrix for procurement/forecast work.
 *
 * A published unit rate reduces one kind of uncertainty but does not make monthly cost
 * known. The caller must still measure usage, verify the applicable contract/rate, and
 * allocate shared fixed spend before feeding a monthly clinic value into margin math.
 */
export function costLineEvidenceMatrix(): CostLineEvidenceStatus[] {
  return COST_LINES.map((line) => ({
    key: line.key,
    label: line.label,
    driver: line.driver,
    billingUnit: line.billingUnit,
    fixedOrVariable: line.fixedOrVariable,
    tenantAttributable: line.tenantAttributable,
    monthlyCentsPerClinic: line.monthlyCentsPerClinic,
    publishedRateEvidence: publishedCostRateEvidenceFor(line.key),
    monthlyCostKnown: line.monthlyCentsPerClinic !== null,
  }));
}

export function costLinesWithPublishedRateEvidence() {
  return costLineEvidenceMatrix().filter((line) => line.publishedRateEvidence !== null);
}

export function costLinesMissingBothMonthlyCostAndPublishedRate() {
  return costLineEvidenceMatrix().filter((line) => !line.monthlyCostKnown && line.publishedRateEvidence === null);
}
