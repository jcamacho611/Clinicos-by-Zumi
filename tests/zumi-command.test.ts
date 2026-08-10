import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  findCopyViolations,
  findUnqualifiedClaims,
  BANNED_PUBLIC_COPY,
  auditPriceForAnswers,
  deriveOperatingMap,
  preliminaryAuditScore,
  preliminaryQualificationLabel,
  deriveSignalSummary,
  engagementOffers,
  findBannedPublicCopy,
  guidedQuestions,
  interviewProgress,
  missionPhases,
  NO_PHI_NOTICE,
  operatingMapSurfaces,
} from "@/lib/sales/zumi-command";
import { GOVERNED_PUBLIC_SURFACES } from "@/lib/design/command-system";
import { demoOffers } from "@/lib/sales-demo-rules";

describe("Klinikos public copy rules", () => {
  it("flags marketing language that may never appear", () => {
    expect(findBannedPublicCopy("Start free with a free trial today")).toEqual(
      expect.arrayContaining(["start free", "free trial"]),
    );
    expect(findBannedPublicCopy("Request a Private Workflow Review")).toEqual([]);
  });

  it("is case-insensitive so a capitalised claim cannot slip through", () => {
    expect(findBannedPublicCopy("START FREE")).toContain("start free");
    expect(findUnqualifiedClaims("GUARANTEED REVENUE")).toContain("guaranteed revenue");
  });

  it("flags a regulatory term asserted as a claim", () => {
    expect(findUnqualifiedClaims("Klinikos is HIPAA compliant and a certified EHR.")).toEqual(
      expect.arrayContaining(["hipaa compliant", "certified ehr"]),
    );
  });

  it("permits the same term inside a disclaimer, which is where it is most needed", () => {
    // Banning the phrase outright would push pages into vaguer disclaimers, which is
    // the opposite of what the rule is for.
    expect(findUnqualifiedClaims("Klinikos is not a certified EHR.")).toEqual([]);
    expect(findUnqualifiedClaims("This is not a HIPAA compliant deployment.")).toEqual([]);
    expect(findUnqualifiedClaims("No guaranteed revenue is implied.")).toEqual([]);
    expect(findUnqualifiedClaims("Klinikos does not provide a certified EHR.")).toEqual([]);
  });

  it("does not let a distant negation launder a later claim", () => {
    const laundered = `We are not perfect. ${"filler text ".repeat(30)} Klinikos is a certified EHR.`;
    expect(findUnqualifiedClaims(laundered)).toContain("certified ehr");
  });

  it("combines both rules for a single surface verdict", () => {
    expect(findCopyViolations("Start free — Klinikos is a certified EHR")).toEqual(
      expect.arrayContaining(["start free", "certified ehr"]),
    );
    expect(findCopyViolations("Klinikos is not a certified EHR. Request a Private Workflow Review.")).toEqual([]);
  });

  it("keeps banned phrases out of every governed public surface", () => {
    // GOVERNED_PUBLIC_SURFACES is the enforcement list: adding a page there is what
    // brings it under design law, so this test grows with the product.
    for (const source of GOVERNED_PUBLIC_SURFACES) {
      const text = readFileSync(join(process.cwd(), source), "utf8");
      expect({ source, hits: findCopyViolations(text) }).toEqual({ source, hits: [] });
    }
  });

  it("keeps banned phrases out of the shared command components", () => {
    const sources = [
      "src/components/command/zumi-command-shell.tsx",
      "src/components/command/zumi-interview.tsx",
      "src/components/command/zumi-operating-map.tsx",
      "src/components/command/founding-offer-cards.tsx",
    ];

    for (const source of sources) {
      const text = readFileSync(join(process.cwd(), source), "utf8");
      expect({ source, hits: findCopyViolations(text) }).toEqual({ source, hits: [] });
    }
  });

  it("governs every page the redesign has brought under command law", () => {
    expect(GOVERNED_PUBLIC_SURFACES).toContain("src/app/sales/page.tsx");
    expect(GOVERNED_PUBLIC_SURFACES).toContain("src/app/start/page.tsx");
    expect(GOVERNED_PUBLIC_SURFACES).toContain("src/app/founding-clinic/page.tsx");
    for (const source of GOVERNED_PUBLIC_SURFACES) {
      expect(existsSync(join(process.cwd(), source))).toBe(true);
    }
  });

  it("never markets Monetization OS", () => {
    expect(BANNED_PUBLIC_COPY).toContain("monetization os");
  });

  it("warns against PHI in the notice shown on every intake surface", () => {
    expect(NO_PHI_NOTICE.toLowerCase()).toContain("protected health information");
    expect(NO_PHI_NOTICE.toLowerCase()).toContain("diagnoses");
  });
});

describe("Zumi interview", () => {
  it("runs as a sequence of single focused questions", () => {
    expect(guidedQuestions.length).toBeGreaterThanOrEqual(5);
    for (const question of guidedQuestions) {
      expect(question.prompt.endsWith("?")).toBe(true);
      expect(question.options.length).toBeGreaterThan(1);
    }
  });

  it("maps every option to a clinic signal", () => {
    for (const question of guidedQuestions) {
      for (const option of question.options) {
        expect(option.signal.length).toBeGreaterThan(3);
      }
    }
  });

  it("tracks completion across the full question set", () => {
    expect(interviewProgress({})).toMatchObject({ answered: 0, complete: false });
    const complete = Object.fromEntries(guidedQuestions.map((question) => [question.key, [question.options[0].value]]));
    expect(interviewProgress(complete)).toMatchObject({ answered: guidedQuestions.length, complete: true });
  });

  it("presents the mission as phases rather than numbered form steps", () => {
    expect(missionPhases.map((phase) => phase.key)).toContain("brief");
    expect(missionPhases.map((phase) => phase.key)).toContain("review");
  });
});

describe("operating map derivation", () => {
  it("reports nothing as needing attention before any answers", () => {
    const map = deriveOperatingMap({});
    expect(map).toHaveLength(operatingMapSurfaces.length);
    expect(map.every((signal) => signal.status === "stable")).toBe(true);
  });

  it("raises a surface once the operator reports a related pressure point", () => {
    const map = deriveOperatingMap({ bottleneck: ["follow_ups"] });
    const followUp = map.find((signal) => signal.key === "follow_up_control");
    expect(followUp?.status).toBe("review");
  });

  it("escalates a surface reported from two directions", () => {
    const map = deriveOperatingMap({ bottleneck: ["follow_ups", "results"] });
    expect(map.find((signal) => signal.key === "follow_up_control")?.status).toBe("attention");
  });

  it("asks for human review on every raised surface", () => {
    const map = deriveOperatingMap({ bottleneck: ["billing_readiness"], revenue_belief: ["unbilled"] });
    for (const signal of map.filter((entry) => entry.status !== "stable")) {
      expect(signal.humanReview.toLowerCase()).toContain("reviewer");
    }
  });

  it("attributes findings to the operator rather than to a measurement", () => {
    const map = deriveOperatingMap({ bottleneck: ["paperwork"] });
    const raised = map.find((signal) => signal.key === "paperwork_readiness");
    expect(raised?.detected.toLowerCase()).toContain("you reported");
  });
});

describe("signal summary", () => {
  it("hedges every claim it makes", () => {
    const summary = deriveSignalSummary({ bottleneck: ["follow_ups", "results"], revenue_belief: ["unbilled"] });
    const narrative = summary.narrative.toLowerCase();
    expect(narrative).toContain("appears");
    expect(narrative).toContain("should be reviewed");
    expect(narrative).toContain("requires human confirmation");
  });

  it("never claims a measured or guaranteed financial outcome", () => {
    const summary = deriveSignalSummary({ revenue_belief: ["denials"] });
    expect(findBannedPublicCopy(summary.narrative)).toEqual([]);
    expect(summary.leakageCategory.toLowerCase()).toContain("may");
  });

  it("says so plainly when nothing was reported", () => {
    const summary = deriveSignalSummary({});
    expect(summary.topBottleneck).toBe("No dominant bottleneck reported");
    expect(summary.narrative.toLowerCase()).toContain("have not yet reported");
  });

  it("recommends a starting module from the operator's stated priority", () => {
    expect(deriveSignalSummary({ first_control: ["billing"] }).recommendedModule).toBe("Claim Readiness");
    expect(deriveSignalSummary({}).recommendedModule).toBe("To be determined during review");
  });
});

describe("engagement offers", () => {
  it("keeps pricing bound to the existing server-controlled offers", () => {
    expect(engagementOffers).toHaveLength(3);
    expect(engagementOffers[0].shortPrice).toBe(demoOffers.private_workflow_demo.shortPrice);
    expect(engagementOffers[1].shortPrice).toBe(demoOffers.founding_clinic_evaluation.shortPrice);
    expect(engagementOffers[2].shortPrice).toBe(demoOffers.founding_clinic_program.shortPrice);
  });

  it("describes what happens next rather than promising an outcome", () => {
    for (const offer of engagementOffers) {
      expect(offer.whatHappens.length).toBeGreaterThan(20);
      expect(findBannedPublicCopy(`${offer.name} ${offer.bestFor} ${offer.whatHappens} ${offer.cta}`)).toEqual([]);
    }
  });
});

describe("audit pricing and preliminary qualification", () => {
  it("prices the paid Operational Audit from reported provider scale", () => {
    expect(auditPriceForAnswers({ provider_scale: ["1"] })).toBe(750);
    expect(auditPriceForAnswers({ provider_scale: ["2_5"] })).toBe(1250);
    expect(auditPriceForAnswers({ provider_scale: ["6_15"] })).toBe(2500);
    expect(auditPriceForAnswers({ provider_scale: ["16_30"] })).toBe(4000);
    expect(auditPriceForAnswers({ provider_scale: ["30_plus"] })).toBe(5000);
  });

  it("falls to the lowest tier when scale was never answered", () => {
    // Undercharging is the recoverable failure. Defaulting high would surprise
    // someone with a price they never agreed to.
    expect(auditPriceForAnswers({})).toBe(750);
  });

  it("scores a large fragmented clinic as a strong candidate", () => {
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

  it("does not score \"unsure\" as evidence of revenue leakage", () => {
    const base = { provider_scale: ["1"], location_scale: ["1"], software_spend: ["under_2k"] };
    expect(preliminaryAuditScore({ ...base, revenue_belief: ["unsure"] })).toBe(
      preliminaryAuditScore({ ...base, revenue_belief: [] }),
    );
  });

  it("never labels a score as qualified or approved", () => {
    // Copy law forbids implying automatic approval. A person decides qualification.
    for (const score of [0, 44, 45, 69, 70, 100]) {
      const label = preliminaryQualificationLabel(score).toLowerCase();
      expect(label).not.toContain("qualified");
      expect(label).not.toContain("approved");
    }
  });

  it("caps the score at 100", () => {
    expect(
      preliminaryAuditScore({
        provider_scale: ["30_plus"],
        location_scale: ["6_plus"],
        bottleneck: ["a", "b", "c", "d", "e", "f", "g", "h"],
        software_spend: ["10k_plus"],
        revenue_belief: ["denials", "lost_leads", "unbilled", "no_shows"],
        current_system: ["many_systems"],
        first_control: ["billing"],
      }),
    ).toBe(100);
  });
});
