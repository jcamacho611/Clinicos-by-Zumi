import { describe, expect, it } from "vitest";

import {
  WORKFORCE_APPLIED_LEARNING_LOOP,
  getDolAiLiteracyAlignment,
} from "./workforce-learning-framework";

describe("Workforce learning framework", () => {
  it("maps exactly five existing AI-literacy modules without creating a second curriculum", () => {
    const mapping = getDolAiLiteracyAlignment();
    expect(mapping).toHaveLength(5);
    expect(mapping.map((item) => item.moduleKey)).toEqual([
      "understand_ai",
      "explore_uses",
      "direct_ai_effectively",
      "evaluate_outputs",
      "use_ai_responsibly",
    ]);
  });

  it("uses the approved applied-learning loop", () => {
    expect(WORKFORCE_APPLIED_LEARNING_LOOP.map((stage) => stage.key)).toEqual([
      "frame",
      "protect",
      "direct",
      "inspect",
      "verify",
      "correct_or_escalate",
      "explain_and_evidence",
    ]);
  });
});
