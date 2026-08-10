import { describe, expect, it } from "vitest";
import { findCopyViolations } from "@/lib/design/command-system";
import { auditPriceForAnswers, deriveOperatingMap, preliminaryAuditScore, preliminaryQualificationLabel } from "@/lib/sales/zumi-command";

describe("Zumi command experience", () => {
  it("keeps prohibited public claims out of approved positioning", () => {
    expect(findCopyViolations("Klinikos is built toward HIPAA-regulated deployment. Human review required.")).toEqual([]);
    expect(findCopyViolations("Start free with a HIPAA compliant certified EHR")).toContain("start free");
    expect(findCopyViolations("Start free with a HIPAA compliant certified EHR")).toContain("hipaa compliant");
  });

  it("prices the paid Operational Audit from reported provider scale", () => {
    expect(auditPriceForAnswers({ provider_scale: ["1"] })).toBe(750);
    expect(auditPriceForAnswers({ provider_scale: ["2_5"] })).toBe(1250);
    expect(auditPriceForAnswers({ provider_scale: ["6_15"] })).toBe(2500);
    expect(auditPriceForAnswers({ provider_scale: ["16_30"] })).toBe(4000);
    expect(auditPriceForAnswers({ provider_scale: ["30_plus"] })).toBe(5000);
  });

  it("labels operating signals as reported rather than measured findings", () => {
    const map = deriveOperatingMap({ bottleneck: ["follow_ups", "results"] });
    const followUp = map.find((signal) => signal.key === "follow_up_control");
    expect(followUp?.status).toBe("attention");
    expect(followUp?.detected).toContain("You reported");
  });

  it("produces a high preliminary score for a complex fragmented clinic without claiming guaranteed qualification", () => {
    const score = preliminaryAuditScore({
      provider_scale: ["6_15"],
      location_scale: ["3_5"],
      bottleneck: ["follow_ups", "billing_readiness", "referrals", "staff_accountability"],
      software_spend: ["10k_plus"],
      revenue_belief: ["denials", "lost_leads"],
      current_system: ["many_systems"],
      first_control: ["billing"],
    });
    expect(score).toBeGreaterThanOrEqual(70);
    expect(preliminaryQualificationLabel(score)).toBe("STRONG AUDIT CANDIDATE");
  });
});
