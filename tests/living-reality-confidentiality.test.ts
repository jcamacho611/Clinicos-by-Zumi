import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { MemberHomeProjection } from "@/components/living-universe/universe-shell";
import { memberRealityProjection } from "@/lib/living-reality/member-reality-projection";
import { publicPathRealityProjection } from "@/lib/living-reality/public-path-reality-projection";
import type { PublicLivingUniverseProjection } from "@/lib/orchestration/public-living-universe";

const gatePath = resolve(process.cwd(), "scripts/security/browser-confidentiality-gate.mjs");
const nodeKeys = ["id", "kind", "label", "state", "summary", "claimStatus", "routeRef"];
const edgeKeys = ["id", "fromId", "toId", "kind", "label"];
const forbiddenSerializedKey = /(password|secret|token|ssn|socialSecurity|diagnosis|medication|insuranceId|internalScore|rankingWeight|margin|prompt|reasoning)/i;

function fixtureRoot(source: string) {
  const root = mkdtempSync(resolve(tmpdir(), "klinikos-p16-browser-gate-"));
  mkdirSync(resolve(root, "src/components/living-reality"), { recursive: true });
  mkdirSync(resolve(root, "public"), { recursive: true });
  writeFileSync(
    resolve(root, "next.config.ts"),
    "const nextConfig = { productionBrowserSourceMaps: false }; export default nextConfig;\n",
  );
  writeFileSync(resolve(root, "src/components/living-reality/fixture.tsx"), source);
  return root;
}

function runGate(root: string) {
  return execFileSync(process.execPath, [gatePath], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const member: MemberHomeProjection = {
  person: { displayName: "Jordan Member" },
  activeLens: "lifecycle",
  lenses: [
    { id: "healthcare_universe", number: "01", title: "Healthcare Universe", description: "Care context", status: "available" },
    { id: "economic_resource", number: "02", title: "Economic & Resource", description: "Economic context", status: "available" },
    { id: "lifecycle", number: "03", title: "Lifecycle", description: "Journey context", status: "active" },
    { id: "operating_infrastructure", number: "04", title: "Operating Infrastructure", description: "Infrastructure context", status: "available" },
    { id: "compounding_business", number: "05", title: "Company Compounding", description: "Compounding context", status: "available" },
  ],
  object: {
    id: "person_opaque_123",
    title: "Jordan Member",
    kind: "Person",
    state: "active",
    summary: "One governed Person identity.",
    claimStatus: "claimed",
  },
  timeline: { before: "Account created", now: "Member active", next: "Complete evidence" },
  inspector: {
    eyebrow: "Identity",
    title: "What is true",
    body: "A member account exists.",
    evidence: ["Account evidence"],
    authority: ["No clinical authority"],
  },
  actions: [{ id: "member", label: "Living Home", href: "/member" }],
};

const publicPath: PublicLivingUniverseProjection = {
  id: "work",
  label: "Find healthcare work",
  side: "need",
  pathId: "find-extra-work",
  title: "Find extra healthcare work",
  summary: "Move from a work need into governed matching.",
  from: "I need work",
  to: "A governed work opportunity",
  availability: "requires_verification",
  availabilityCopy: "Needs verification first",
  governance: "Professional verification and eligibility remain separate decisions.",
  commercialBoundary: null,
  continuationHref: "/member?path=find-extra-work",
  steps: [
    { label: "Create identity", description: "Start with one Person identity.", state: "complete" },
    { label: "Verify evidence", description: "Review credentials and evidence.", state: "current" },
  ],
};

function expectProjectionAllowlist(projection: ReturnType<typeof memberRealityProjection>) {
  for (const node of projection.nodes) expect(Object.keys(node)).toEqual(nodeKeys);
  for (const edge of projection.edges) expect(Object.keys(edge)).toEqual(edgeKeys);
  const serialized = JSON.stringify(projection);
  for (const key of Object.keys(JSON.parse(serialized) as Record<string, unknown>)) {
    expect(key).not.toMatch(forbiddenSerializedKey);
  }
  expect(serialized).not.toMatch(/"(?:password|secret|token|ssn|socialSecurity|diagnosis|medication|insuranceId|internalScore|rankingWeight|margin|prompt|reasoning)[^"]*"\s*:/i);
}

describe("P16 Living Reality browser confidentiality", () => {
  it.each([
    "@/lib/db",
    "@/lib/repositories/member-repository",
    "@/lib/orchestration/engine-registry",
    "@/features/zumi/master-directive",
    "@/lib/security/secrets",
  ])("rejects a client Living Reality module importing %s", (specifier) => {
    const root = fixtureRoot(`"use client";\nimport value from "${specifier}";\nexport default value;\n`);
    expect(() => runGate(root)).toThrow(/client-import|client-transitive-import/i);
  });

  it.each([
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "ANTHROPIC_API_KEY",
    "passwordHash",
    "internalScore",
  ])("rejects confidential runtime marker %s", (marker) => {
    const root = fixtureRoot(`"use client";\nexport const unsafeMarker = "${marker}";\n`);
    expect(() => runGate(root)).toThrow(/client-marker|confidential/i);
  });

  it("keeps member spatial nodes and edges on the W1 allowlist", () => {
    expectProjectionAllowlist(memberRealityProjection(member));
  });

  it("keeps public spatial nodes and edges on the same W1 allowlist", () => {
    const projection = publicPathRealityProjection(publicPath);
    for (const node of projection.nodes) expect(Object.keys(node)).toEqual(nodeKeys);
    for (const edge of projection.edges) expect(Object.keys(edge)).toEqual(edgeKeys);
    expect(JSON.stringify(projection)).not.toMatch(/"(?:password|secret|token|ssn|socialSecurity|diagnosis|medication|insuranceId|internalScore|rankingWeight|margin|prompt|reasoning)[^"]*"\s*:/i);
  });
});
