import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const organizationFindUnique = vi.fn();
const executeRaw = vi.fn();
const queryRaw = vi.fn();
const auditCreate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    organization: { findUnique: (...args: unknown[]) => organizationFindUnique(...args) },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        $executeRaw: (...args: unknown[]) => executeRaw(...args),
        $queryRaw: (...args: unknown[]) => queryRaw(...args),
        auditLog: { create: (...args: unknown[]) => auditCreate(...args) },
      }),
  },
}));

const { createGridFeePolicy } = await import("@/lib/grid/fee-policy-repository");

function session(): ClinicSession {
  return {
    sessionId: "session-1",
    userId: "user-1",
    organizationId: "org-platform",
    organizationName: "Klinikos",
    organizationSlug: "clinicos-by-zumi",
    email: "owner@example.invalid",
    name: "Platform Owner",
    role: "clinic_owner",
    demo: true,
    expiresAt: Date.now() + 60_000,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  organizationFindUnique.mockResolvedValue({ slug: "clinicos-by-zumi", status: "active" });
  queryRaw.mockResolvedValue([
    {
      id: "policy-1",
      scopeKind: "demand_kind",
      scopeValue: "space",
      platformFeeBps: 0,
      platformFeeFlatCents: 0,
      status: "active",
      createdBy: "user-1",
      createdAt: new Date("2026-08-24T00:00:00Z"),
      updatedAt: new Date("2026-08-24T00:00:00Z"),
    },
  ]);
});

describe("createGridFeePolicy monetization gate", () => {
  it("refuses a percentage fee scoped at referrals and writes nothing", async () => {
    await expect(
      createGridFeePolicy(session(), {
        scopeKind: "demand_kind",
        scopeValue: "referral",
        platformFeeBps: 1_000,
        platformFeeFlatCents: 0,
      }),
    ).rejects.toThrow(/percentage platform fee cannot be applied/i);

    // The refusal must happen before any row is touched.
    expect(queryRaw).not.toHaveBeenCalled();
    expect(executeRaw).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("refuses a percentage fee scoped at regulated clinical services", async () => {
    await expect(
      createGridFeePolicy(session(), {
        scopeKind: "resource_kind",
        scopeValue: "regulated_clinical_service",
        platformFeeBps: 500,
        platformFeeFlatCents: 0,
      }),
    ).rejects.toThrow();
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it("refuses a fee-bearing default policy, which would reach every class", async () => {
    await expect(
      createGridFeePolicy(session(), {
        scopeKind: "default",
        scopeValue: null,
        platformFeeBps: 1_000,
        platformFeeFlatCents: 0,
      }),
    ).rejects.toThrow(/referral and regulated clinical/i);
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it("refuses a percentage on professional coverage, declared flat-fee only", async () => {
    await expect(
      createGridFeePolicy(session(), {
        scopeKind: "demand_kind",
        scopeValue: "provider",
        platformFeeBps: 1_200,
        platformFeeFlatCents: 0,
      }),
    ).rejects.toThrow();
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it("still allows a zero-fee policy to be recorded", async () => {
    const created = await createGridFeePolicy(session(), {
      scopeKind: "demand_kind",
      scopeValue: "space",
      platformFeeBps: 0,
      platformFeeFlatCents: 0,
    });
    expect(created.id).toBe("policy-1");
    expect(executeRaw).toHaveBeenCalled();
    expect(auditCreate).toHaveBeenCalled();
  });

  it("records the monetization decision on the audit entry", async () => {
    await createGridFeePolicy(session(), {
      scopeKind: "demand_kind",
      scopeValue: "space",
      platformFeeBps: 0,
      platformFeeFlatCents: 0,
    });
    const metadata = auditCreate.mock.calls[0]?.[0]?.data?.metadata;
    expect(metadata?.monetizationOutcome).toBe("free");
  });

  it("refuses before checking the platform organization is not bypassed", async () => {
    // A non-platform organization is still rejected by the existing admin gate, so the
    // monetization gate does not become the only thing standing between a caller and
    // the table.
    organizationFindUnique.mockResolvedValue({ slug: "some-clinic", status: "active" });
    await expect(
      createGridFeePolicy(session(), {
        scopeKind: "demand_kind",
        scopeValue: "space",
        platformFeeBps: 0,
        platformFeeFlatCents: 0,
      }),
    ).rejects.toThrow(/platform organization/i);
  });
});
