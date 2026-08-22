import { describe, expect, it } from "vitest";
import { derivePublicConversationState } from "@/features/zumi/public-conversation-state";

describe("public Zumi conversation state", () => {
  it("turns a physician self-description into useful context without calling it verified", () => {
    const state = derivePublicConversationState([], "im a doctor", "/");

    expect(state.confirmedRoles).toContain("physician");
    expect(state.primaryRole).toBe("physician");
    expect(state.authenticated).toBe(false);
    expect(state.sessionMode).toBe("public");
  });

  it("keeps physician-owner context while the goal moves to missed callbacks", () => {
    const state = derivePublicConversationState([
      { role: "user", content: "im a doctor" },
      { role: "assistant", content: "I can tailor this around clinical practice." },
      { role: "user", content: "i own my practice too" },
      { role: "assistant", content: "Then we can focus on the operation." },
    ], "we keep missing callbacks", "/");

    expect(state.confirmedRoles).toContain("physician");
    expect(state.confirmedRoles).toContain("clinic_owner");
    expect(state.ownsPractice).toBe(true);
    expect(state.currentGoal).toBe("follow_up");
  });

  it("understands short continuations as continuations instead of independent routing requests", () => {
    for (const prompt of ["like what", "how", "why", "what else", "for me?", "how would you help"]) {
      const state = derivePublicConversationState([
        { role: "user", content: "we miss callbacks" },
        { role: "assistant", content: "I would turn the callback problem into owned work." },
      ], prompt, "/");

      expect(state.currentMessageIsShortContinuation, prompt).toBe(true);
      expect(state.currentGoal, prompt).toBe("follow_up");
    }
  });

  it("lets a later clinical-role correction replace the prior clinical role", () => {
    const state = derivePublicConversationState([
      { role: "user", content: "im a nurse" },
      { role: "assistant", content: "Got it." },
    ], "actually im an NP", "/");

    expect(state.confirmedRoles).toContain("nurse_practitioner");
    expect(state.confirmedRoles).not.toContain("nurse");
    expect(state.primaryRole).toBe("nurse_practitioner");
  });

  it("keeps public page awareness as context without treating it as authority", () => {
    const state = derivePublicConversationState([], "what is this", "/grid");
    expect(state.currentSurface).toBe("/grid");
    expect(state.authenticated).toBe(false);
    expect(state.currentGoal).toBe("understand_klinikos");
  });
});
