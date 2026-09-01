import { beforeEach, describe, expect, it, vi } from "vitest";

const personFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    person: { findUnique: (...args: unknown[]) => personFindUnique(...args) },
  },
}));

import { getMemberHomeProjection } from "@/lib/member/member-home-repository";

const session = {
  sessionId: "session-1",
  accountId: "account-1",
  personId: "person-1",
  email: "person@example.test",
  displayName: "Jordan Lee",
  expiresAt: Math.floor(Date.now() / 1_000) + 300,
};

describe("member Living Home minimum-necessary projection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    personFindUnique.mockResolvedValue({
      displayName: "Jordan Lee",
      status: "active",
      account: { id: "account-1", status: "active", emailVerifiedAt: null },
      memberships: [],
      relationships: [],
      careerArtifacts: [],
    });
  });

  it("projects a neutral Person object rather than inventing a patient, career, or organization role", async () => {
    const projection = await getMemberHomeProjection(session);

    expect(projection.person).toEqual({ displayName: "Jordan Lee" });
    expect(projection.object).toMatchObject({
      id: "person-profile",
      kind: "Person profile",
      state: "Account active",
      claimStatus: "unverified",
    });
    expect(projection.object.summary).not.toMatch(/patient|nurse|student|clinic owner/i);
    expect(projection.lenses).toHaveLength(5);
    expect(projection.actions.map((action) => action.href)).toEqual(["/grid", "/edu", "/member"]);
    expect(JSON.stringify(projection)).not.toContain("person@example.test");
    expect(JSON.stringify(projection)).not.toContain("person-1");
    expect(JSON.stringify(projection)).not.toContain("account-1");
  });

  it("labels persisted claims without upgrading them into eligibility or authority", async () => {
    personFindUnique.mockResolvedValue({
      displayName: "Jordan Lee",
      status: "active",
      account: { id: "account-1", status: "active", emailVerifiedAt: new Date() },
      memberships: [],
      relationships: [{ verificationState: "claimed" }],
      careerArtifacts: [{ claimState: "claimed", verificationState: "unverified" }],
    });

    const projection = await getMemberHomeProjection(session);
    expect(projection.object.claimStatus).toBe("claimed");
    expect(projection.object.authorityNotice).toMatch(/not a license|not.*eligibility/i);
    expect(projection.inspector.evidence.join(" ")).toMatch(/unverified/i);
    expect(projection.inspector.authority.join(" ")).toMatch(/grants no organization/i);
  });

  it("fails closed when the active Account is not the session account", async () => {
    personFindUnique.mockResolvedValue({
      displayName: "Jordan Lee",
      status: "active",
      account: { id: "other-account", status: "active", emailVerifiedAt: null },
      memberships: [],
      relationships: [],
      careerArtifacts: [],
    });

    await expect(getMemberHomeProjection(session)).rejects.toThrow(/could not be projected/i);
  });

  it("queries only the person-owned, non-clinical projection boundary", async () => {
    await getMemberHomeProjection(session);
    expect(personFindUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "person-1" },
      select: expect.objectContaining({
        displayName: true,
        account: expect.any(Object),
        memberships: expect.any(Object),
        relationships: expect.any(Object),
        careerArtifacts: expect.any(Object),
      }),
    }));
    const select = personFindUnique.mock.calls[0][0].select;
    expect(select).not.toHaveProperty("patients");
    expect(select).not.toHaveProperty("providers");
    expect(select).not.toHaveProperty("clinicalRecords");
  });
});
