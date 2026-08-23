import { describe, expect, it } from "vitest";

import { normalizeZumiPresence } from "@/features/zumi/presence";

describe("Zumi presence normalization", () => {
  it("does not let an EDU pathname downgrade itself to generic platform", () => {
    const presence = normalizeZumiPresence({
      surface: "platform",
      pathname: "/edu/zumi-practice",
      mode: "conversation",
      autonomy: "suggest_actions",
      inputModalities: ["text"],
      outputModalities: ["text"],
    });
    expect(presence.surface).toBe("education");
  });

  it("preserves an explicit surface when no pathname is supplied", () => {
    const presence = normalizeZumiPresence({
      surface: "voice",
      mode: "conversation",
      autonomy: "answer_only",
      inputModalities: ["voice"],
      outputModalities: ["speech"],
    });
    expect(presence.surface).toBe("voice");
  });
});
