import { describe, expect, it } from "vitest";
import { zumiAccessibilitySchema, zumiPresenceSchema } from "@/features/zumi/presence";
import { getZumiTool, resolveZumiToolReadiness, resolvedZumiToolCatalog, zumiToolCatalog } from "@/features/zumi/tool-catalog";
import { planZumiOrchestration } from "@/features/zumi/orchestrator";

describe("Zumi ambient presence contract", () => {
  it("defaults to a safe conversational posture", () => {
    const presence = zumiPresenceSchema.parse({});
    const accessibility = zumiAccessibilitySchema.parse({});
    expect(presence).toMatchObject({ surface: "platform", mode: "conversation", autonomy: "suggest_actions" });
    expect(presence.inputModalities).toEqual(["text"]);
    expect(accessibility).toMatchObject({ responseLength: "balanced", languageStyle: "professional", speechOutput: false, captions: true });
  });

  it("accepts voice, speech, route, and accessibility context without changing authorization", () => {
    const presence = zumiPresenceSchema.parse({
      surface: "provider_portal",
      mode: "command",
      autonomy: "prepare_actions",
      pathname: "/grid/resources",
      inputModalities: ["voice", "text"],
      outputModalities: ["text", "speech"],
    });
    const accessibility = zumiAccessibilitySchema.parse({ responseLength: "detailed", languageStyle: "technical", keyboardFirst: true, reducedMotion: true });
    expect(presence.inputModalities).toContain("voice");
    expect(presence.outputModalities).toContain("speech");
    expect(accessibility.keyboardFirst).toBe(true);
    expect(accessibility.reducedMotion).toBe(true);
  });
});

describe("Zumi universal capability graph", () => {
  it("describes a broad tool universe instead of a short hardcoded chatbot list", () => {
    expect(zumiToolCatalog.length).toBeGreaterThanOrEqual(25);
    expect(zumiToolCatalog.map((tool) => tool.family)).toEqual(expect.arrayContaining(["research", "compute", "operations", "communications", "finance", "clinical", "engineering", "multimodal", "ambient"]));
  });

  it("distinguishes active, pending, configured, available-to-wire, and roadmap truthfully", () => {
    expect(resolveZumiToolReadiness(getZumiTool("canonical_knowledge")!, {})).toBe("active");
    expect(resolveZumiToolReadiness(getZumiTool("web_search")!, {})).toBe("pending_connection");
    expect(resolveZumiToolReadiness(getZumiTool("web_search")!, { OPENAI_API_KEY: "configured" })).toBe("provider_capability");
    expect(resolveZumiToolReadiness(getZumiTool("calendar")!, { GOOGLE_CALENDAR_CONNECTED: "true" })).toBe("configured");
    expect(resolveZumiToolReadiness(getZumiTool("database")!, {})).toBe("available_to_wire");
    expect(resolveZumiToolReadiness(getZumiTool("browser")!, {})).toBe("roadmap");
  });

  it("never exposes environment values through the resolved catalog", () => {
    const catalog = resolvedZumiToolCatalog({ OPENAI_API_KEY: "super-secret-value" });
    expect(JSON.stringify(catalog)).not.toContain("super-secret-value");
  });
});

describe("Zumi multi-tool orchestration", () => {
  it("plans across research, calendar, payments, and analysis for compound goals", () => {
    const plan = planZumiOrchestration({
      question: "Research the latest payment issue, calculate the impact, then schedule a follow-up meeting.",
      presence: zumiPresenceSchema.parse({ mode: "research", autonomy: "prepare_actions" }),
      env: { OPENAI_API_KEY: "configured", STRIPE_SECRET_KEY: "configured", GOOGLE_CALENDAR_CONNECTED: "true" },
    });
    const keys = plan.candidateTools.map((tool) => tool.key);
    expect(keys).toEqual(expect.arrayContaining(["canonical_knowledge", "web_search", "code_interpreter", "payments", "calendar"]));
    expect(plan.steps.map((step) => step.phase)).toEqual(expect.arrayContaining(["understand", "research", "compute", "prepare", "verify", "respond"]));
    expect(plan.steps.find((step) => step.phase === "prepare")?.requiresApproval).toBe(true);
    expect(plan.canExecuteConsequentialActions).toBe(false);
  });

  it("adds multimodal tools when the actual surface says those modalities are available", () => {
    const plan = planZumiOrchestration({
      question: "Explain what I am showing you.",
      presence: zumiPresenceSchema.parse({ inputModalities: ["image", "voice"], outputModalities: ["text", "speech"] }),
      env: { OPENAI_API_KEY: "configured", TWILIO_ACCOUNT_SID: "configured" },
    });
    expect(plan.candidateTools.map((tool) => tool.key)).toEqual(expect.arrayContaining(["vision", "voice"]));
  });

  it("removes the preparation phase when the user explicitly chooses answer-only mode", () => {
    const plan = planZumiOrchestration({
      question: "Email the clinic and schedule a meeting",
      presence: zumiPresenceSchema.parse({ autonomy: "answer_only" }),
      env: { GMAIL_CONNECTED: "true", GOOGLE_CALENDAR_CONNECTED: "true" },
    });
    expect(plan.steps.some((step) => step.phase === "prepare")).toBe(false);
    expect(plan.canPrepareActions).toBe(false);
  });
});
