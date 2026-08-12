import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { planZumiOrchestration } from "@/features/zumi/orchestrator";
import { containsLikelyIdentifiers, redactText } from "@/features/zumi/redaction";
import { zumiPresenceSchema } from "@/features/zumi/presence";

/**
 * A regression guard for a real defect.
 *
 * Redaction used to live inside the gateway's buildPrompt, which meant the *user*
 * prompt was clean while the *system* prompt was not: the orchestration planners take
 * the question and echo it back — the trusted orchestration instruction prints the
 * intent goal verbatim — so a question containing an SSN, an email address or a phone
 * number reached the model provider anyway.
 *
 * The fix is ordering: the gateway redacts once, before anything else reads the
 * question. That ordering is invisible at a type level and easy to undo by adding one
 * more planner, so it is asserted here directly.
 */

const GATEWAY = join(process.cwd(), "src/features/zumi/gateway.ts");

describe("Zumi egress redaction happens before anything reads the question", () => {
  it("lets the gateway touch the raw question exactly once, to redact it", () => {
    const source = readFileSync(GATEWAY, "utf8");
    const rawUses = source.match(/request\.question/g) ?? [];

    // The one permitted use. Every later consumer must read the redacted text.
    expect(rawUses).toHaveLength(1);
    expect(source).toMatch(/const question = redactText\(request\.question\);/);
  });

  it("passes redacted text to every planner that can reach the provider", () => {
    const source = readFileSync(GATEWAY, "utf8");

    // These four all embed what they are given into text that ends up in the system
    // prompt or in a provider-bound plan.
    for (const call of [
      /planZumiContext\(questionText,/,
      /estimateResearchComplexity\(questionText\)/,
      /planZumiOrchestration\(\{ question: questionText,/,
      /resolveTrustedZumiOrchestration\(\{ session: request\.session, question: questionText,/,
    ]) {
      expect(source).toMatch(call);
    }
  });

  it("keeps identifiers out of an orchestration plan built from a redacted question", () => {
    const question = "Call Dana at 555-867-5309 or dana.whitfield@example.com, SSN 123-45-6789.";
    const leaky = planZumiOrchestration({ question, presence: zumiPresenceSchema.parse({}) });
    // The planner is not the control and is not expected to redact — it echoes its input.
    expect(containsLikelyIdentifiers(leaky.goal)).toBe(true);

    const safe = planZumiOrchestration({ question: redactText(question).text, presence: zumiPresenceSchema.parse({}) });
    expect(containsLikelyIdentifiers(safe.goal)).toBe(false);
    expect(safe.goal).not.toContain("123-45-6789");
    expect(safe.goal).not.toContain("dana.whitfield@example.com");
  });
});
