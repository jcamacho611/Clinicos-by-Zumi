import { describe, expect, it } from "vitest";
import {
  buildRevenueIntegrityPath,
  type RevenueClaimSnapshot,
} from "@/lib/revenue/revenue-integrity-path";

function claim(overrides: Partial<RevenueClaimSnapshot> = {}): RevenueClaimSnapshot {
  return {
    status: "PAID",
    totalCents: 18_480,
    submittedAt: "2026-08-01T10:00:00.000Z",
    encounter: { signedAt: "2026-07-30T18:00:00.000Z" },
    superbill: { procedureCount: 2, diagnosisCount: 1, reviewedAt: "2026-07-31T09:00:00.000Z" },
    openDenials: [],
    ...overrides,
  };
}

const NO_RAIL = { externalRailConnected: false };

/**
 * "Why hasn't this been paid?" should be answerable as a path rather than a paragraph.
 * These cover the reading, and — far more importantly — what it refuses to say.
 *
 * No claims rail is connected: 837, 276/277 and 835 are all sandbox-ready and pending
 * production connection. So every post-submission state in the database is something
 * Klinikos wrote down, not something a clearinghouse or payer confirmed. A claim that
 * merely looks paid is the most expensive lie this system could tell.
 */
describe("revenue integrity path", () => {
  it("never claims external confirmation while no claims rail is connected", () => {
    const path = buildRevenueIntegrityPath(claim(), NO_RAIL);
    expect(path.externalRailConnected).toBe(false);
    expect(path.stages.every((stage) => stage.confirmation !== "externally_confirmed")).toBe(true);
  });

  it("says a paid claim is a recorded status, not settlement", () => {
    const paid = buildRevenueIntegrityPath(claim(), NO_RAIL).stages.find((s) => s.key === "paid");
    expect(paid?.state).toBe("complete");
    expect(paid?.confirmation).toBe("internal_record_only");
    expect(paid?.evidence).toContain("recorded status rather than settlement evidence");
  });

  it("says a submitted claim was marked submitted, not transmitted", () => {
    const submitted = buildRevenueIntegrityPath(claim(), NO_RAIL).stages.find((s) => s.key === "submitted");
    expect(submitted?.evidence).toContain("marked submitted");
    expect(submitted?.evidence).toContain("nothing has been transmitted");
    expect(submitted?.evidence).not.toMatch(/was transmitted to the clearinghouse/);
  });

  it("upgrades to external confirmation only when a rail is actually connected", () => {
    const connected = buildRevenueIntegrityPath(claim(), { externalRailConnected: true });
    const paid = connected.stages.find((stage) => stage.key === "paid");
    expect(paid?.confirmation).toBe("externally_confirmed");
    expect(paid?.evidence).toContain("Payment was received");
  });

  it("reports reconciliation as unknown rather than pending", () => {
    // "We have not got there yet" and "we cannot see this" are different answers, and
    // nothing in the schema records reconciliation.
    const reconciled = buildRevenueIntegrityPath(claim(), NO_RAIL).stages.find((s) => s.key === "reconciled");
    expect(reconciled?.state).toBe("unknown");
    expect(reconciled?.state).not.toBe("pending");
  });

  it("points attention at the first unresolved stage, not the last completed one", () => {
    const unsigned = buildRevenueIntegrityPath(
      claim({ status: "DRAFT", submittedAt: null, encounter: { signedAt: null } }),
      NO_RAIL,
    );
    expect(unsigned.firstUnresolved).toBe("documented");
    expect(unsigned.nextAction).toBe("Sign the encounter note.");
  });

  it("treats a denial as workable attention rather than an error", () => {
    const denied = buildRevenueIntegrityPath(
      claim({ status: "DENIED", openDenials: [{ reason: "Authorization not attached.", appealDueAt: "2026-09-15T00:00:00.000Z" }] }),
      NO_RAIL,
    );
    const adjudicated = denied.stages.find((stage) => stage.key === "adjudicated");
    expect(adjudicated?.state).toBe("attention");
    expect(adjudicated?.evidence).toContain("Authorization not attached.");
    expect(denied.nextAction).toContain("appeal is due 2026-09-15");
    expect(denied.stages.find((stage) => stage.key === "paid")?.state).toBe("attention");
  });

  it("distinguishes missing coding from a missing superbill", () => {
    const noSuperbill = buildRevenueIntegrityPath(claim({ superbill: null, status: "DRAFT" }), NO_RAIL);
    expect(noSuperbill.stages.find((s) => s.key === "coded")?.evidence).toContain("No superbill is attached");

    const partial = buildRevenueIntegrityPath(
      claim({ superbill: { procedureCount: 2, diagnosisCount: 0, reviewedAt: null }, status: "DRAFT" }),
      NO_RAIL,
    );
    expect(partial.stages.find((s) => s.key === "coded")?.evidence).toContain("missing procedure or diagnosis codes");
    expect(partial.nextAction).toBe("Complete coding on the superbill.");
  });

  it("says so when there is no encounter rather than inventing one", () => {
    const orphan = buildRevenueIntegrityPath(claim({ encounter: null, status: "DRAFT" }), NO_RAIL);
    expect(orphan.stages.find((s) => s.key === "performed")?.state).toBe("unknown");
    expect(orphan.stages.find((s) => s.key === "documented")?.state).toBe("unknown");
  });

  it("keeps every stage in the canonical order and speaks no enums", () => {
    const path = buildRevenueIntegrityPath(claim(), NO_RAIL);
    expect(path.stages.map((stage) => stage.key)).toEqual([
      "performed", "documented", "coded", "claim_ready",
      "submitted", "accepted", "adjudicated", "paid", "reconciled",
    ]);
    // A biller reads these. Raw status names must never reach them.
    const prose = path.stages.map((stage) => `${stage.label} ${stage.evidence}`).join(" ");
    for (const raw of ["READY_FOR_REVIEW", "PATIENT_BALANCE", "claim.status", "ClaimStatus"]) {
      expect(prose).not.toContain(raw);
    }
  });
});
