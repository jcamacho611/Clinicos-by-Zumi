import { describe, expect, it } from "vitest";
import {
  buildPaidAnalysisHandoffHref,
  parsePaidAnalysisHandoffSearchParams,
} from "@/lib/sales/intake-handoff";

describe("guided operating-map to paid-analysis handoff", () => {
  it("carries only reusable clinic type and matching bottleneck enum codes", () => {
    const href = buildPaidAnalysisHandoffHref({
      clinic_type: ["med_spa"],
      bottleneck: ["follow_ups", "missed_calls", "billing_readiness", "follow_ups"],
      current_system: ["legacy_ehr"],
      revenue_belief: ["denials"],
      first_control: ["med_spa"],
      injected_free_text: ["patient-name-should-never-appear"],
    });

    expect(href).toBe("/private-demo?clinic=med_spa&pain=follow_ups&pain=billing_readiness#reserve");
    expect(href).not.toContain("missed_calls");
    expect(href).not.toContain("legacy_ehr");
    expect(href).not.toContain("denials");
    expect(href).not.toContain("patient-name-should-never-appear");
  });

  it("re-validates URL values and ignores forged or non-reusable categories", () => {
    const parsed = parsePaidAnalysisHandoffSearchParams({
      clinic: "med_spa",
      pain: ["billing_readiness", "payments", "unknown", "billing_readiness"],
    });

    expect(parsed.clinicType).toBe("Medical spa");
    expect(parsed.painPoints).toEqual(["billing_readiness"]);
    expect(parsed.biggestPainPoint).toBe("billing_readiness");
    expect(parsed.summaryLabels).toEqual([
      "Clinic type: Medical spa",
      "Carried bottlenecks: Billing readiness",
    ]);
  });

  it("returns an empty handoff for unknown clinic and pain values", () => {
    expect(parsePaidAnalysisHandoffSearchParams({
      clinic: "forged-clinic",
      pain: ["forged-pain"],
    })).toEqual({
      clinicType: null,
      painPoints: [],
      biggestPainPoint: null,
      summaryLabels: [],
    });
  });
});
