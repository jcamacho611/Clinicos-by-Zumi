import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const getClinicSession = vi.fn();
const createCompanyOpportunity = vi.fn();
const listCompanyOpportunities = vi.fn();
const getCompanyOpportunity = vi.fn();
const appendCompanyOpportunityEvidence = vi.fn();
const transitionCompanyOpportunity = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getClinicSession: () => getClinicSession(),
}));

vi.mock("@/lib/repositories/company-opportunity-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/repositories/company-opportunity-repository")>();
  return {
    ...actual,
    createCompanyOpportunity: (...args: unknown[]) => createCompanyOpportunity(...args),
    listCompanyOpportunities: (...args: unknown[]) => listCompanyOpportunities(...args),
    getCompanyOpportunity: (...args: unknown[]) => getCompanyOpportunity(...args),
    appendCompanyOpportunityEvidence: (...args: unknown[]) => appendCompanyOpportunityEvidence(...args),
    transitionCompanyOpportunity: (...args: unknown[]) => transitionCompanyOpportunity(...args),
  };
});

const collection = await import("@/app/api/company/opportunities/route");
const detail = await import("@/app/api/company/opportunities/[opportunityId]/route");
const evidence = await import("@/app/api/company/opportunities/[opportunityId]/evidence/route");
const transition = await import("@/app/api/company/opportunities/[opportunityId]/transition/route");

const session: ClinicSession = {
  sessionId: "session-1",
  userId: "user-1",
  organizationId: "org-platform",
  organizationName: "Klinikos",
  organizationSlug: "clinicos-by-zumi",
  email: "founder@example.test",
  name: "Founder",
  role: "clinic_owner",
  demo: false,
  expiresAt: Date.now() + 60_000,
};

const dto = {
  id: "opp-1",
  version: 1,
  lifecycleStage: "DISCOVERED",
  qualificationState: "UNQUALIFIED",
  awardState: "UNPROVEN",
  contractState: "UNPROVEN",
  cashState: "UNPROVEN",
};

function request(path: string, method: string, body?: unknown, origin = "http://localhost") {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      origin,
      "sec-fetch-site": origin === "http://localhost" ? "same-origin" : "cross-site",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getClinicSession.mockResolvedValue(session);
  createCompanyOpportunity.mockResolvedValue(dto);
  listCompanyOpportunities.mockResolvedValue({ items: [dto], nextCursor: null });
  getCompanyOpportunity.mockResolvedValue(dto);
  appendCompanyOpportunityEvidence.mockResolvedValue({ ...dto, version: 2 });
  transitionCompanyOpportunity.mockResolvedValue({ ...dto, version: 2, lifecycleStage: "FIT_REVIEW" });
});

describe("company opportunity API", () => {
  it("requires authentication and sends private no-store responses", async () => {
    getClinicSession.mockResolvedValueOnce(null);
    const unauthorized = await collection.GET(request("/api/company/opportunities", "GET"));
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get("cache-control")).toContain("no-store");

    const allowed = await collection.GET(request("/api/company/opportunities?limit=10", "GET"));
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("cache-control")).toBe("private, no-store");
    expect(listCompanyOpportunities).toHaveBeenCalledWith(session, { cursor: undefined, limit: 10 });
  });

  it("requires same-origin mutations before reading or persisting company intelligence", async () => {
    const response = await collection.POST(request(
      "/api/company/opportunities",
      "POST",
      { title: "Do not parse this cross-site body" },
      "https://attacker.example",
    ));
    expect(response.status).toBe(403);
    expect(createCompanyOpportunity).not.toHaveBeenCalled();

    const evidenceResponse = await evidence.POST(
      request("/api/company/opportunities/opp-1/evidence", "POST", {}, "https://attacker.example"),
      { params: Promise.resolve({ opportunityId: "opp-1" }) },
    );
    expect(evidenceResponse.status).toBe(403);
    expect(appendCompanyOpportunityEvidence).not.toHaveBeenCalled();
  });

  it("rejects client-supplied organization identity and arbitrary metadata", async () => {
    const response = await collection.POST(request("/api/company/opportunities", "POST", {
      organizationId: "org-attacker",
      title: "Attempted cross-tenant create",
      metadata: { rawEmailBody: "private" },
    }));
    expect(response.status).toBe(400);
    expect(createCompanyOpportunity).not.toHaveBeenCalled();

    const rawOpportunityMessage = await collection.POST(request("/api/company/opportunities", "POST", {
      title: "Workforce opportunity",
      opportunityClass: "GOVERNMENT_CONTRACT",
      targetClass: "GOVERNMENT_PROGRAM",
      targetOrganizationName: "Example Agency",
      purpose: "From: sender@example.test\nTo: operator@example.test\nFull copied message body",
      ask: "Confirm the authoritative application path.",
      sourceSystem: "outlook-audit",
      sourceType: "OUTLOOK_SUMMARY",
      sourceReference: "outlook-summary://message-1",
      sourceFingerprintSha256: "a".repeat(64),
      sourceObservedAt: "2026-08-31T12:00:00.000Z",
    }));
    expect(rawOpportunityMessage.status).toBe(400);
    expect(createCompanyOpportunity).not.toHaveBeenCalled();

    const rawMessage = await evidence.POST(
      request("/api/company/opportunities/opp-1/evidence", "POST", {
        expectedVersion: 1,
        ingestionKey: "raw-message-1",
        claimKey: "source.body",
        claimText: "From: patient@example.test\nSubject: private narrative\nFull message body",
        claimTruthClass: "ACTUAL",
        evidenceType: "OBSERVED_SOURCE",
        sourceSystem: "outlook",
        sourceType: "OUTLOOK_MESSAGE",
        sourceReference: "outlook-message://message-1",
        sourceFingerprintSha256: "a".repeat(64),
        sourceObservedAt: "2026-08-31T12:00:00.000Z",
        verifiedByCurrentActor: false,
      }),
      { params: Promise.resolve({ opportunityId: "opp-1" }) },
    );
    expect(rawMessage.status).toBe(400);
    expect(appendCompanyOpportunityEvidence).not.toHaveBeenCalled();

    const unsafeLocator = await evidence.POST(
      request("/api/company/opportunities/opp-1/evidence", "POST", {
        expectedVersion: 1,
        ingestionKey: "unsafe-reference-1",
        claimKey: "source.observed",
        claimText: "A minimized source reference was observed.",
        claimTruthClass: "ACTUAL",
        evidenceType: "OBSERVED_SOURCE",
        sourceSystem: "outlook",
        sourceType: "OUTLOOK_MESSAGE",
        sourceReference: "https://user:secret@example.test/message?token=private",
        sourceFingerprintSha256: "a".repeat(64),
        sourceObservedAt: "2026-08-31T12:00:00.000Z",
        verifiedByCurrentActor: false,
      }),
      { params: Promise.resolve({ opportunityId: "opp-1" }) },
    );
    expect(unsafeLocator.status).toBe(400);
    expect(appendCompanyOpportunityEvidence).not.toHaveBeenCalled();
  });

  it("passes only validated input and server session identity to repository commands", async () => {
    const response = await transition.POST(
      request("/api/company/opportunities/opp-1/transition", "POST", {
        expectedVersion: 1,
        targetStage: "FIT_REVIEW",
        idempotencyKey: "fit-review-1",
        reason: "Begin fit review without asserting an outcome.",
      }),
      { params: Promise.resolve({ opportunityId: "opp-1" }) },
    );
    expect(response.status).toBe(200);
    expect(transitionCompanyOpportunity).toHaveBeenCalledWith(session, "opp-1", {
      expectedVersion: 1,
      targetStage: "FIT_REVIEW",
      idempotencyKey: "fit-review-1",
      reason: "Begin fit review without asserting an outcome.",
    });
  });

  it("uses the same safe not-found response for inaccessible detail records", async () => {
    const { CompanyOpportunityAccessError } = await import(
      "@/lib/repositories/company-opportunity-repository"
    );
    getCompanyOpportunity.mockRejectedValueOnce(
      new CompanyOpportunityAccessError("Company opportunity not found.", 404),
    );
    const response = await detail.GET(request("/api/company/opportunities/missing", "GET"), {
      params: Promise.resolve({ opportunityId: "missing" }),
    });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Company opportunity not found." });
  });
});
