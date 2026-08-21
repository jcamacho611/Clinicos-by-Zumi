import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("public Zumi API disclosure and abuse contract", () => {
  const route = source("src/app/api/zumi/public/route.ts");
  const service = source("src/features/zumi/public-intelligence.ts");
  const providers = source("src/features/zumi/providers.ts");
  const openAI = source("src/features/zumi/adapters/openai-responses.ts");

  it("keeps anonymous input bounded and no-store", () => {
    expect(route).toContain("MAX_BODY_BYTES = 16 * 1024");
    expect(route).toContain("max(1_200)");
    expect(route).toContain("max(600)");
    expect(route).toContain("max(6)");
    expect(route).toContain('"Cache-Control": "no-store, max-age=0"');
    expect(route).toContain('Vary: "Origin"');
  });

  it("requires an allowed public origin and a public-specific rate-limit key", () => {
    expect(route).toContain("originAccepted(request)");
    expect(route).toContain('"https://klinikos.io"');
    expect(route).toContain('"https://www.klinikos.io"');
    expect(route).toContain("public-zumi:");
    expect(route).toContain("checkZumiProcessRateLimit");
  });

  it("returns presentation only and does not disclose provider economics or internal routing state", () => {
    const responseSection = route.slice(route.indexOf("return NextResponse.json({\n    data:"));
    expect(responseSection).toContain("title: resolution.title");
    expect(responseSection).toContain("body: resolution.body");
    expect(responseSection).toContain("destination: resolution.destination");
    expect(responseSection).toContain("assumption: null");
    expect(responseSection).toContain("confidence: 1");
    expect(responseSection).not.toContain("modelGenerated");
    expect(responseSection).not.toContain("intelligenceAvailable");
    expect(responseSection).not.toContain("degradedReason");
    expect(responseSection).not.toContain("modelId");
    expect(responseSection).not.toContain("costMicroUsd");
    expect(responseSection).not.toContain("provider:");
    expect(responseSection).not.toContain("redactions");
  });

  it("disables optional tools and provider-side response retention on the public surface", () => {
    expect(service).toContain("storeResponse: false");
    expect(service).toContain("allowWebSearch: false");
    expect(service).toContain("allowKnowledgeSearch: false");
    expect(service).toContain("allowCodeInterpreter: false");
    expect(service).toContain("maxToolCalls: 0");
    expect(providers).toContain("storeResponse?: boolean");
    expect(openAI).toContain("store: request.storeResponse ?? true");
  });
});