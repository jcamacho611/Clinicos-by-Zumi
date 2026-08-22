import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";

const create = vi.fn();
const findMany = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    expertSupportRequest: {
      create: (...a: unknown[]) => create(...a),
      findMany: (...a: unknown[]) => findMany(...a),
    },
  },
}));

const { createExpertSupportRequest, listExpertSupportRequests, expertSupportRequestSchema } =
  await import("@/lib/repositories/expert-support-repository");

function session(role: ClinicRole = "clinic_owner") {
  return {
    sessionId: "s1", userId: "u1", organizationId: "org-1", organizationName: "Northgate",
    organizationSlug: "northgate", email: "owner@example.test", name: "Nadja Owner",
    role, demo: true, expiresAt: Date.now() + 60_000,
  };
}

const valid = {
  capabilityDomain: "compliance" as const,
  outcomeWanted: "A written opinion on whether our consent flow meets state requirements.",
};

beforeEach(() => {
  create.mockReset().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({ ...data, id: "req-1", createdAt: new Date(), neededBy: null, jurisdictionKey: null, remoteAllowed: true }));
  findMany.mockReset().mockResolvedValue([]);
});

describe("asking for an expert grants nobody anything", () => {
  it("always records data access as none, whatever the requester sends", async () => {
    // The whole point. If asking for help could set its own access class, every control
    // in the engagement engine — conflict review, purpose, minimum-necessary scope,
    // named approver — would be reachable around rather than through.
    await createExpertSupportRequest(session(), { ...valid, dataAccessClass: "phi" });
    // A stray field is rejected outright by the strict schema, so nothing was written.
    expect(create).not.toHaveBeenCalled();

    await createExpertSupportRequest(session(), valid);
    expect(create.mock.calls[0][0].data.dataAccessClass).toBe("none");
  });

  it("refuses a request from a role without network create", async () => {
    const result = await createExpertSupportRequest(session("viewer"), valid);
    expect(result).toEqual({ ok: false, reason: "not_authorized" });
    expect(create).not.toHaveBeenCalled();
  });

  it("requires an outcome, not just a topic", async () => {
    expect(expertSupportRequestSchema.safeParse({ ...valid, outcomeWanted: "help" }).success).toBe(false);
    expect(expertSupportRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a capability domain the engines do not define", async () => {
    expect(expertSupportRequestSchema.safeParse({ ...valid, capabilityDomain: "anything" }).success).toBe(false);
  });

  it("writes and reads only within the caller's organization", async () => {
    await createExpertSupportRequest(session(), valid);
    expect(create.mock.calls[0][0].data.organizationId).toBe("org-1");

    await listExpertSupportRequests({ organizationId: "org-1", role: "clinic_owner" });
    expect(findMany.mock.calls[0][0].where.organizationId).toBe("org-1");
  });

  it("returns null rather than an empty list for a role that may not see requests", async () => {
    const picture = await listExpertSupportRequests({ organizationId: "org-1", role: "contractor" });
    expect(picture.requests).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("never claims matching is available while there is no expert supply", async () => {
    const picture = await listExpertSupportRequests({ organizationId: "org-1", role: "clinic_owner" });
    expect(picture.matchingAvailable).toBe(false);
  });
});

describe("the surface states the access boundary plainly", () => {
  const surface = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/workspaces/expert-support.tsx"), "utf8");
  const migration = fs.readFileSync(
    path.join(process.cwd(), "prisma/migrations/20260819120000_expert_support_requests/migration.sql"), "utf8");

  it("shows the staged progression with access standing at the end", () => {
    for (const step of ["Matched", "Terms agreed", "Conflict review", "Purpose confirmed", "Agreement complete"]) {
      expect(surface, `progression is missing "${step}"`).toContain(step);
    }
    expect(surface).toContain("Data access: <strong>None</strong>");
    expect(surface).toContain("Nobody sees your records by being matched.");
  });

  it("does not imply an automatic match that cannot happen", () => {
    expect(surface).toContain("Matching is not automated yet");
    expect(surface).toContain("Nothing has been shared with anyone outside your organization");
  });

  it("tells the requester not to put patient details in a free-text field", () => {
    expect(surface).toContain("Do not include patient details");
  });

  it("exposes no ranking score or matching formula", () => {
    // Match what renders, not the comments: the doc block above this component says the
    // words "matching score" precisely to explain that none is shown, and "weight" is
    // ordinary English. A guard that flags its own rationale is measuring the wrong text.
    const rendered = surface.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const internal of ["score", "ranking", "formula", "algorithm", "suitability"]) {
      expect(rendered.toLowerCase(), `the surface exposes "${internal}"`).not.toMatch(new RegExp(`\\b${internal}\\b`));
    }
  });

  it("defaults access to none in the database, not only in application code", () => {
    // Application code can be bypassed by a future writer; the column default and the
    // check constraint cannot.
    expect(migration).toContain(`"dataAccessClass"   TEXT NOT NULL DEFAULT 'none'`);
    expect(migration).toContain("expert_support_requests_access_check");
  });
});
