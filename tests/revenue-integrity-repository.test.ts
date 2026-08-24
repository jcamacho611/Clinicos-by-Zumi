import { describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";

const claimFindFirst = vi.fn();
const encounterFindFirst = vi.fn();
const superbillFindFirst = vi.fn();
const denialFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    claimDraft: { findFirst: (...a: unknown[]) => claimFindFirst(...a) },
    encounter: { findFirst: (...a: unknown[]) => encounterFindFirst(...a) },
    superbill: { findFirst: (...a: unknown[]) => superbillFindFirst(...a) },
    denial: { findMany: (...a: unknown[]) => denialFindMany(...a) },
  },
}));

const { readRevenueIntegrityPath, claimsRailConnected } = await import(
  "@/lib/repositories/revenue-integrity-repository"
);

const viewer = (role: ClinicRole) => ({ organizationId: "org-1", role });

describe("revenue integrity repository", () => {
  it("refuses a role without billing read instead of returning a partial answer", async () => {
    // The path names money and payer state. A role that cannot read billing must not get
    // a redacted version of it — it must get nothing.
    await expect(readRevenueIntegrityPath(viewer("clinical_staff" as ClinicRole), "claim-1"))
      .rejects.toMatchObject({ status: 403 });
    expect(claimFindFirst).not.toHaveBeenCalled();
  });

  it("scopes the claim lookup by organization inside the query", async () => {
    claimFindFirst.mockResolvedValueOnce(null);
    const result = await readRevenueIntegrityPath(viewer("clinic_owner" as ClinicRole), "claim-x");

    // A claim in another tenant must be indistinguishable from one that does not exist,
    // so the scope belongs in the lookup rather than in a filter applied afterwards.
    expect(result).toBeNull();
    expect(claimFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "claim-x", organizationId: "org-1" } }),
    );
  });

  it("reads a real claim into the canonical path without inventing evidence", async () => {
    claimFindFirst.mockResolvedValueOnce({
      id: "claim-1", status: "DENIED", totalCents: 18_480,
      submittedAt: new Date("2026-08-01T10:00:00Z"), encounterId: "enc-1", superbillId: "sb-1",
    });
    encounterFindFirst.mockResolvedValueOnce({ signedAt: new Date("2026-07-30T18:00:00Z") });
    superbillFindFirst.mockResolvedValueOnce({
      procedures: [{ code: "99213" }, { code: "20610" }],
      diagnoses: [{ code: "M25.511" }],
      reviewedAt: new Date("2026-07-31T09:00:00Z"),
    });
    denialFindMany.mockResolvedValueOnce([
      { reason: "Authorization not attached.", appealDueAt: new Date("2026-09-15T00:00:00Z") },
    ]);

    const path = await readRevenueIntegrityPath(viewer("clinic_owner" as ClinicRole), "claim-1");

    expect(path?.firstUnresolved).toBe("adjudicated");
    expect(path?.nextAction).toContain("appeal is due 2026-09-15");
    expect(path?.stages.find((stage) => stage.key === "coded")?.state).toBe("complete");
    // Only open denials are fetched; a resolved one must not keep blocking the claim.
    expect(denialFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "open" }) }),
    );
  });

  it("counts absent or malformed code JSON as no codes rather than throwing", async () => {
    claimFindFirst.mockResolvedValueOnce({
      id: "c", status: "DRAFT", totalCents: 0, submittedAt: null, encounterId: null, superbillId: "sb",
    });
    superbillFindFirst.mockResolvedValueOnce({ procedures: null, diagnoses: "unexpected", reviewedAt: null });
    denialFindMany.mockResolvedValueOnce([]);

    const path = await readRevenueIntegrityPath(viewer("clinic_owner" as ClinicRole), "c");
    expect(path?.stages.find((stage) => stage.key === "coded")?.state).toBe("attention");
    expect(path?.nextAction).toBe("Complete coding on the superbill.");
  });

  it("cannot be told the claims rail is live by an environment variable", () => {
    /* Stedi is the claims rail. Its production readiness is gated on an executed BAA,
       payer enrollment and explicit production approval — none of which is an env var,
       and all of which are currently open. So no configuration, including an explicit
       production mode, may flip this on.

       That is the point: if setting STEDI_MODE could make the path report a payer
       confirmed a claim, one deployment variable would be enough to turn every recorded
       status into a false settlement claim. */
    for (const env of [
      {},
      { STEDI_API_KEY: "x", STEDI_MODE: "sandbox" },
      { STEDI_API_KEY: "x", STEDI_MODE: "production" },
    ]) {
      expect(claimsRailConnected(env as NodeJS.ProcessEnv), JSON.stringify(env)).toBe(false);
    }
  });
});
