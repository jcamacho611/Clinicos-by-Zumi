import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const organizationFindUnique = vi.fn();
const hasActiveIssues = vi.fn();
const auditCreate = vi.fn();

/** Rows the fake transaction hands back, routed by the SQL text of each query. */
let contextRow: Record<string, unknown>;
let feePolicyRow: Record<string, unknown>;
const insertedObligations: string[] = [];

function sqlTextOf(query: unknown): string {
  const strings = (query as { strings?: string[] })?.strings;
  return Array.isArray(strings) ? strings.join(" ") : String(query);
}

vi.mock("@/lib/db", () => ({
  db: {
    organization: { findUnique: (...args: unknown[]) => organizationFindUnique(...args) },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        $queryRaw: async (query: unknown) => {
          const text = sqlTextOf(query);
          if (text.includes("GridReservationRecord")) return [contextRow];
          if (text.includes("GridFeePolicyRecord")) return [feePolicyRow];
          if (text.includes("INSERT INTO \"GridFinancialObligationRecord\"")) {
            // Echo the bound parameters back so the allocator's own reconciliation
            // check runs against the amounts it actually computed.
            const values = (query as { values?: unknown[] }).values ?? [];
            const [id, organizationId, reservationId, obligationType, beneficiaryType, beneficiaryReference, amountCents] =
              values as [string, string, string, string, string, string | null, number];
            insertedObligations.push(`${obligationType}:${amountCents}`);
            return [
              {
                id,
                organizationId,
                reservationId,
                obligationType,
                beneficiaryType,
                beneficiaryReference,
                amountCents,
                status: "pending",
                externalReference: null,
                createdAt: new Date("2026-08-24T00:00:00Z"),
                updatedAt: new Date("2026-08-24T00:00:00Z"),
              },
            ];
          }
          // Remaining read is the existing-obligations check: none yet.
          return [];
        },
        auditLog: { create: (...args: unknown[]) => auditCreate(...args) },
      }),
  },
}));

vi.mock("@/lib/grid/trust-repository", () => ({
  reservationHasActiveGridIssues: (...args: unknown[]) => hasActiveIssues(...args),
}));

const { allocateGridFinancialObligations } = await import("@/lib/grid/financial-obligation-repository");

function session(): ClinicSession {
  return {
    sessionId: "session-1",
    userId: "user-1",
    organizationId: "org-a",
    organizationName: "Clinic A",
    organizationSlug: "clinic-a",
    email: "owner@example.invalid",
    name: "Owner",
    role: "clinic_owner",
    demo: true,
    expiresAt: Date.now() + 60_000,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  insertedObligations.length = 0;
  organizationFindUnique.mockResolvedValue({ demoMode: true, status: "active" });
  hasActiveIssues.mockResolvedValue({ blocked: false, activeDisputes: 0, activeSafetyIncidents: 0 });
  contextRow = {
    reservationId: "reservation-1",
    organizationId: "org-a",
    grossAmountCents: 100_000,
    locationPayableCents: 0,
    fulfillmentStatus: "fulfilled",
    providerId: "provider-1",
    locationId: null,
    resourceKind: null,
    demandKind: "space",
    supplyOrganizationId: "org-b",
    locationOrganizationId: null,
  };
  feePolicyRow = {
    id: "policy-1",
    scopeKind: "default",
    scopeValue: null,
    platformFeeBps: 0,
    platformFeeFlatCents: 0,
  };
});

describe("Grid settlement monetization gate", () => {
  it("refuses to apply a default percentage policy to a referral transaction", async () => {
    // This is the defect that matters: nobody scoped a fee at referrals. A plain
    // "set a default marketplace fee" row is resolved by the fallback and would
    // otherwise take a percentage of a patient referral.
    contextRow.demandKind = "referral";
    feePolicyRow = { ...feePolicyRow, platformFeeBps: 1_000 };

    await expect(allocateGridFinancialObligations(session(), "reservation-1")).rejects.toThrow(
      /percentage platform fee cannot be applied/i,
    );
    expect(insertedObligations).toEqual([]);
  });

  it("refuses to apply a default percentage policy to regulated clinical care", async () => {
    contextRow.resourceKind = "regulated_clinical_service";
    feePolicyRow = { ...feePolicyRow, platformFeeBps: 1_500 };

    await expect(allocateGridFinancialObligations(session(), "reservation-1")).rejects.toThrow();
    expect(insertedObligations).toEqual([]);
  });

  it("refuses a percentage on professional coverage, which is declared flat-fee only", async () => {
    contextRow.demandKind = "provider";
    feePolicyRow = { ...feePolicyRow, platformFeeBps: 1_200 };

    await expect(allocateGridFinancialObligations(session(), "reservation-1")).rejects.toThrow();
    expect(insertedObligations).toEqual([]);
  });

  it("refuses a fee for a demand kind that carries no declared class", async () => {
    contextRow.demandKind = "work";
    feePolicyRow = { ...feePolicyRow, platformFeeBps: 800 };

    await expect(allocateGridFinancialObligations(session(), "reservation-1")).rejects.toThrow(
      /no Klinikos fee-policy class is declared/i,
    );
    expect(insertedObligations).toEqual([]);
  });

  it("refuses a percentage even on a marketplace class, because none is counsel-cleared", async () => {
    contextRow.demandKind = "space";
    feePolicyRow = { ...feePolicyRow, platformFeeBps: 1_000 };

    await expect(allocateGridFinancialObligations(session(), "reservation-1")).rejects.toThrow(
      /counsel clearance/i,
    );
    expect(insertedObligations).toEqual([]);
  });

  it("still settles a zero-fee transaction, paying the supply organization in full", async () => {
    const result = await allocateGridFinancialObligations(session(), "reservation-1");
    expect(result).toHaveLength(1);
    // No platform fee line at all, and the supply organization receives the full gross.
    expect(insertedObligations).toEqual(["supply_payable:100000"]);
  });
});
