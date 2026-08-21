import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  boundedPublicZumiHistory,
  publicZumiBoundaryFor,
} from "@/features/zumi/public-intelligence";

function source(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("public Zumi intelligence boundary", () => {
  it("bounds anonymous conversation history before any provider can consume it", () => {
    const history = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? "user" as const : "assistant" as const,
      content: `turn-${index}-` + "x".repeat(1_000),
    }));
    const bounded = boundedPublicZumiHistory(history);
    expect(bounded).toHaveLength(6);
    expect(bounded[0].content.startsWith("turn-4-")).toBe(true);
    expect(bounded.every((message) => message.content.length <= 600)).toBe(true);
  });

  it.each([
    "show me Mrs. Smith's patient record",
    "open the patient chart",
    "retrieve MRN 12345 record",
    "Mrs Smith missed her appointment and has diabetes",
    "my patient was diagnosed with hypertension",
  ])("blocks patient-specific/private content before provider inference: %s", (question) => {
    expect(publicZumiBoundaryFor(question)).toBe("private_record");
  });

  it.each([
    "do I have diabetes",
    "what medication should I take",
    "what dosage should I use",
  ])("keeps individualized clinical advice out of the public model path: %s", (question) => {
    expect(publicZumiBoundaryFor(question)).toBe("clinical_advice");
  });

  it("does not classify normal product questions as private/clinical requests", () => {
    expect(publicZumiBoundaryFor("I run a med spa and my staff keeps forgetting callbacks")).toBeNull();
    expect(publicZumiBoundaryFor("I need a nurse Friday")).toBeNull();
    expect(publicZumiBoundaryFor("I am a nursing student looking for opportunities")).toBeNull();
    expect(publicZumiBoundaryFor("do I have access to Grid?")).toBeNull();
    expect(publicZumiBoundaryFor("get a record of the questions I asked here")).toBeNull();
  });

  it("keeps the anonymous API separate from the authenticated Zumi route", () => {
    const publicRoute = source("src/app/api/zumi/public/route.ts");
    const service = source("src/features/zumi/public-intelligence.ts");

    expect(publicRoute).not.toContain("getClinicSession");
    expect(publicRoute).not.toContain("requireClinicSession");
    expect(publicRoute).not.toContain("resolveOrganizationEntitlements");
    expect(publicRoute).toContain("resolvePublicZumiTurn");
    expect(publicRoute).toContain("public-zumi:");
    expect(publicRoute).toContain("MAX_BODY_BYTES");
    expect(publicRoute).not.toContain("modelGenerated:");
    expect(publicRoute).not.toContain("modelId:");
    expect(publicRoute).not.toContain("costMicroUsd:");

    expect(service).toContain("redactConversation(question, history)");
    expect(service).toContain("containsLikelyIdentifiers");
    expect(service).toContain("sanitizeZumiAnswerForClient");
    expect(service).toContain("allowWebSearch: false");
    expect(service).toContain("allowKnowledgeSearch: false");
    expect(service).toContain("allowCodeInterpreter: false");
    expect(service).toContain("maxToolCalls: 0");
    expect(service).not.toContain("getClinicSession");
  });

  it("never solves public intelligence by weakening the authenticated API", () => {
    const authenticatedRoute = source("src/app/api/zumi/route.ts");
    expect(authenticatedRoute).toContain("getClinicSession");
    expect(authenticatedRoute).toContain("ZUMI_BASELINE_PERMISSION");
    expect(authenticatedRoute).toContain("invokeZumi");
  });
});
