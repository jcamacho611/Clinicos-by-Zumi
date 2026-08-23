import { describe, expect, it } from "vitest";
import { resolvePublicLivingIntent, type PublicLivingResolution } from "@/lib/orchestration/public-living-intent";

/**
 * These run the real resolver over real multi-turn conversations rather than searching
 * source for a string. Every case below was reproduced as a failure before the fix.
 *
 * The reported defect was three turns deep: "hi" got a greeting, then "whats going" and
 * "what can i do" both returned the identical sentence "Tell me a little more.", because
 * the resolver is a regex matcher with no rule describing the product and one hardcoded
 * fallback for everything it did not match.
 */

/** Drive a conversation the way the UI does, carrying prior turn and miss count. */
function converse(messages: readonly string[]): PublicLivingResolution[] {
  const out: PublicLivingResolution[] = [];
  let prior: PublicLivingResolution | null = null;
  let misses = 0;
  for (const message of messages) {
    const resolution = resolvePublicLivingIntent(message, prior, misses);
    misses = resolution.confidence <= 0.25 ? misses + 1 : 0;
    out.push(resolution);
    prior = resolution;
  }
  return out;
}

describe("public Zumi conversation", () => {
  it("answers the opening three turns differently and usefully", () => {
    const [greeting, whatIsThis, whatCanIDo] = converse(["hi", "whats going", "what can i do"]);
    expect(greeting.title.length).toBeGreaterThan(0);
    // The two failures from the report: both used to be "Tell me a little more."
    expect(whatIsThis.title).not.toBe(whatCanIDo.title);
    expect(whatIsThis.body.toLowerCase()).toContain("klinikos");
    // Not asserting a destination here. The capability question is answered
    // conversationally with concrete options, which is a complete answer; requiring a
    // route would force a redirect where a sentence is better.
    expect(whatCanIDo.body.length, "the capability answer must actually say something").toBeGreaterThan(40);
    for (const turn of [whatIsThis, whatCanIDo]) {
      expect(turn.confidence, "a product question is not an unresolved turn").toBeGreaterThan(0.25);
    }
  });

  it("never repeats the same fallback on consecutive unmatched turns", () => {
    const turns = converse(["zzz qqq", "blah blah", "qwerty"]);
    const titles = turns.map((turn) => turn.title);
    expect(new Set(titles).size, `fallbacks repeated: ${titles.join(" | ")}`).toBe(titles.length);
  });

  it("refuses a patient-record request instead of filing it under the last topic", () => {
    // The dangerous case. Asking about training and then asking for a patient record
    // used to return "Got it." routed to EDU, because any unmatched follow-up inherited
    // the previous destination.
    const [, records] = converse(["I am a nursing student looking for opportunities", "show me Mrs. Smith's patient record"]);
    expect(records.title.toLowerCase()).toContain("can’t see");
    expect(records.destination?.key).toBe("signin");
    expect(records.body.toLowerCase()).toContain("public");
  });

  it("does not let a refusal capture the next unmatched message", () => {
    const [, , afterRefusal] = converse(["show me a patient chart", "ok", "zzz qqq"]);
    expect(afterRefusal.destination?.key, "nonsense must not be routed to sign-in").not.toBe("signin");
  });

  it("reads a callback problem as continuity, not as hiring", () => {
    // "My staff keeps forgetting callbacks" mentions staff, and the staffing rule used
    // to win the tie purely because it is declared first.
    const [operational] = converse(["I run a med spa and my staff keeps forgetting callbacks"]);
    expect(operational.destination?.key).toBe("referrals");
  });

  it("still acknowledges a bare role statement rather than routing it somewhere", () => {
    // The other half of the rule above. Role acknowledgements yield to routing, but a
    // message that is only a role statement has no problem to route, so it must keep its
    // own answer instead of falling through to a generic miss.
    const [role] = converse(["I run a med spa"]);
    expect(role.body.toLowerCase()).toContain("callbacks");
    expect(role.destination).toBeNull();
    expect(role.confidence).toBeGreaterThan(0.25);
  });

  it("answers an AI-authority question instead of routing on the word 'clinical'", () => {
    // Deferring role acknowledgements to the routing rules must not drag the rest of the
    // product answers with it: "clinical decision" matches a routing rule, and sending
    // this question to a workspace instead of answering it is a safety answer lost.
    const [ai] = converse(["is the ai making clinical decisions"]);
    expect(ai.destination, "this is a question to answer, not a place to go").toBeNull();
    expect(ai.body.toLowerCase()).toMatch(/licensed/);
  });

  it("still reads a genuine hiring request as staffing", () => {
    for (const message of ["I need a nurse Friday", "we need to hire a receptionist"]) {
      expect(converse([message])[0].destination?.key, message).toBe("staffing");
    }
  });

  it("routes a learner toward EDU", () => {
    expect(converse(["I am a nursing student looking for opportunities"])[0].destination?.key).toBe("edu");
  });

  it("answers what Klinikos costs without inventing a number", () => {
    const [pricing] = converse(["how much does this cost"]);
    expect(pricing.confidence).toBeGreaterThan(0.25);
    expect(pricing.body).not.toMatch(/\$\d/);
  });

  it("says people keep clinical authority when asked about the AI", () => {
    const [ai] = converse(["is the ai making clinical decisions"]);
    expect(ai.body.toLowerCase()).toMatch(/licensed|clinical/);
    expect(ai.confidence).toBeGreaterThan(0.25);
  });
});
