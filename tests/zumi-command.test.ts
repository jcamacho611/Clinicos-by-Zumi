import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BANNED_PUBLIC_COPY,
  deriveOperatingMap,
  deriveSignalSummary,
  engagementOffers,
  findBannedPublicCopy,
  guidedQuestions,
  interviewProgress,
  missionPhases,
  NO_PHI_NOTICE,
  operatingMapSurfaces,
} from "@/lib/sales/zumi-command";
import { demoOffers } from "@/lib/sales-demo-rules";

describe("Klinikos public copy rules", () => {
  it("flags every banned marketing and compliance claim", () => {
    expect(findBannedPublicCopy("We are HIPAA compliant and a certified EHR.")).toEqual(
      expect.arrayContaining(["hipaa compliant", "certified ehr"]),
    );
    expect(findBannedPublicCopy("Start free with a free trial today")).toEqual(
      expect.arrayContaining(["start free", "free trial"]),
    );
    expect(findBannedPublicCopy("Request a Private Workflow Review")).toEqual([]);
  });

  it("is case-insensitive so a capitalised claim cannot slip through", () => {
    expect(findBannedPublicCopy("GUARANTEED REVENUE")).toContain("guaranteed revenue");
  });

  it("keeps banned phrases out of the redesigned sales surfaces", () => {
    const sources = [
      "src/app/sales/page.tsx",
      "src/lib/sales/zumi-command.ts",
      "src/components/sales/zumi/zumi-command-shell.tsx",
      "src/components/sales/zumi/zumi-interview.tsx",
      "src/components/sales/zumi/zumi-operating-map.tsx",
    ];

    for (const source of sources) {
      const text = readFileSync(join(process.cwd(), source), "utf8");
      // The vocabulary list itself legitimately contains the banned phrases.
      const body = source.endsWith("zumi-command.ts")
        ? text.slice(text.indexOf("export const APPROVED_PUBLIC_COPY"))
        : text;
      expect({ source, hits: findBannedPublicCopy(body) }).toEqual({ source, hits: [] });
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
