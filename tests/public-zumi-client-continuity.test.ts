import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  boundedPublicZumiHistoryContent,
  publicZumiEmergencyResolution,
} from "@/components/marketing/public-living-gateway";

const source = fs.readFileSync(path.join(process.cwd(), "src/components/marketing/public-living-gateway.tsx"), "utf8");

describe("public Zumi browser continuity", () => {
  it("keeps a stable ephemeral browser-session identity without persistent cross-session storage", () => {
    expect(source).toContain('PUBLIC_SESSION_KEY = "klinikos.public.zumi.session"');
    expect(source).toContain("window.sessionStorage.getItem");
    expect(source).toContain("window.sessionStorage.setItem");
    expect(source).toContain("window.crypto.randomUUID()");
    expect(source).not.toContain("localStorage");
  });

  it("sends enough bounded recent context plus public page context to the server", () => {
    expect(source).toContain(".slice(-12)");
    expect(source).toContain("sessionId: publicConversationId()");
    expect(source).toContain("surface: window.location.pathname");
    expect(source).toContain('fetch("/api/zumi/public"');
  });

  it("renders server-owned suggestions as prompt replies rather than executable AI actions", () => {
    expect(source).toContain('aria-label="Suggested replies"');
    expect(source).toContain("sendPrompt(suggestion.prompt)");
    expect(source).toContain('type="button"');
    expect(source).not.toContain("suggestion.href");
    expect(source).not.toContain("suggestion.action");
  });

  it("preserves the emergency instruction returned with a rate-limit refusal", () => {
    expect(publicZumiEmergencyResolution({
      error: "Too many messages. Please try again shortly.",
      emergency: "Call 911 now. Klinikos has not contacted anyone for you.",
    })).toMatchObject({
      title: "This may be an emergency",
      body: "Call 911 now. Klinikos has not contacted anyone for you.",
      destination: null,
      confidence: 1,
    });
    expect(publicZumiEmergencyResolution({ emergency: "" })).toBeNull();
  });

  it("bounds every re-sent history item to the API's accepted 600-character contract", () => {
    const oversized = "a".repeat(1_200);
    expect(boundedPublicZumiHistoryContent(oversized)).toHaveLength(600);
    expect(boundedPublicZumiHistoryContent("short")).toBe("short");
  });
});
