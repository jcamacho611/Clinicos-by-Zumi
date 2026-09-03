import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import type { PersonAccountSession } from "@/lib/auth/account-types";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: {
    person: {
      findUnique: mocks.findUnique,
    },
  },
}));

import { getMemberHomeProjection } from "@/lib/member/member-home-repository";

const page = readFileSync("src/app/member/page.tsx", "utf8");
const repository = readFileSync("src/lib/member/member-home-repository.ts", "utf8");

const session: PersonAccountSession = {
  sessionId: "session-1",
  accountId: "account-1",
  personId: "person-1",
  email: "person@example.test",
  displayName: "Jordan Lee",
  expiresAt: Date.now() + 60_000,
};

function activePerson() {
  return {
    displayName: "Jordan Lee",
    status: "active",
    account: {
      id: "account-1",
      status: "active",
      emailVerifiedAt: null,
    },
    memberships: [],
    relationships: [],
    careerArtifacts: [],
  };
}

describe("member Path re-resolution", () => {
  it("treats query Path as navigation rather than evidence", () => {
    expect(page).toContain("klinikosPathCatalog.find");
    expect(repository).toContain("klinikosPathCatalog.find");
    expect(repository).toContain("personEntryHrefForPath");
    expect(repository).toContain("isAllowedMemberActionHref");
    expect(repository).toContain("navigation input, never evidence");
  });

  it("keeps authority separation visible", () => {
    expect(repository).toContain(
      "not a license, organization role, patient relationship, Grid eligibility decision, or payment authority",
    );
  });

  it("re-resolves a known Path and rejects an unknown Path without changing claim state", async () => {
    const knownPath = klinikosPathCatalog[0]!;
    mocks.findUnique.mockResolvedValue(activePerson());
    const valid = await getMemberHomeProjection(session, knownPath.id);

    mocks.findUnique.mockResolvedValue(activePerson());
    const invalid = await getMemberHomeProjection(session, "not-a-real-path");

    const validContinue = valid.actions.find((action) => action.id === "continue-path");
    const invalidContinue = invalid.actions.find((action) => action.id === "continue-path");

    expect(validContinue?.label).toBe("Continue this path");
    expect(validContinue?.href).toContain(`path=${encodeURIComponent(knownPath.id)}`);
    expect(invalidContinue).toBeUndefined();
    expect(valid.object.claimStatus).toBe("unverified");
    expect(invalid.object.claimStatus).toBe("unverified");
    expect(valid.object.authorityNotice).toBe(invalid.object.authorityNotice);
  });
});
