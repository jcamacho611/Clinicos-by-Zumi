import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicRole } from "@/lib/auth/rbac";

const listObligations = vi.fn();
vi.mock("@/lib/grid/financial-obligation-repository", () => ({
  listGridFinancialObligations: (...args: unknown[]) => listObligations(...args),
}));

const { getGridMoney } = await import("@/lib/money/grid-money");

const session = (role: ClinicRole = "clinic_owner") =>
  ({ userId: "u1", organizationId: "org-1", role }) as never;

function obligation(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: "ob-1",
    obligationType: "supply_payable",
    beneficiaryType: "organization",
    beneficiaryReference: "org-2",
    amountCents: 120_000,
    status: "pending",
    organizationId: "org-1",
    ...over,
  };
}

beforeEach(() => {
  listObligations.mockReset().mockResolvedValue([]);
});

describe("Grid money reaches the surface a person opens to answer 'what do I owe'", () => {
  it("counts an obligation owed to someone else as money out, not money in", async () => {
    // The defect this exists for: the seeded clinic owed $1,200 through a fulfilled Grid
    // transaction and that number appeared on no surface a person visits to reconcile.
    listObligations.mockResolvedValue([obligation()]);
    const money = await getGridMoney(session());
    expect(money?.youOweCents).toBe(120_000);
    expect(money?.pendingToYouCents).toBe(0);
    expect(money?.lines[0].incoming).toBe(false);
  });

  it("counts an obligation payable to this organization as money in", async () => {
    listObligations.mockResolvedValue([obligation({ beneficiaryReference: "org-1" })]);
    const money = await getGridMoney(session());
    expect(money?.pendingToYouCents).toBe(120_000);
    expect(money?.youOweCents).toBe(0);
    expect(money?.lines[0].incoming).toBe(true);
  });

  it("separates settled from pending on the incoming side", async () => {
    listObligations.mockResolvedValue([
      obligation({ id: "a", beneficiaryReference: "org-1", status: "settled", amountCents: 50_000 }),
      obligation({ id: "b", beneficiaryReference: "org-1", status: "pending", amountCents: 30_000 }),
    ]);
    const money = await getGridMoney(session());
    expect(money?.settledToYouCents).toBe(50_000);
    expect(money?.pendingToYouCents).toBe(30_000);
  });

  it("stops counting an outgoing obligation once it is settled", async () => {
    listObligations.mockResolvedValue([obligation({ status: "settled" })]);
    expect((await getGridMoney(session()))?.youOweCents).toBe(0);
  });

  it("names the platform rather than calling Klinikos a Grid participant", async () => {
    listObligations.mockResolvedValue([obligation({ beneficiaryType: "platform", beneficiaryReference: null })]);
    expect((await getGridMoney(session()))?.lines[0].counterparty).toBe("Klinikos");
  });

  it("says the Grid is quiet rather than showing three zeroes with no explanation", async () => {
    const money = await getGridMoney(session());
    expect(money?.quiet).toBe(true);
  });

  it("returns null for a role entitled to neither side", async () => {
    // "$0 owed" is a claim, and it is not one to make to somebody not allowed to know.
    // Checked against the real matrix rather than assumed: `clinical_staff` is the only
    // role holding neither grid nor billing read — `contractor` does hold grid read,
    // which is not what I guessed first. The billing workspace rule already keeps
    // clinical_staff off this page, so this guard is defensive rather than load-bearing
    // today; it exists because permissions move and a summary that answers "nothing is
    // owed" to somebody who simply may not know is worse than answering nothing.
    const money = await getGridMoney(session("clinical_staff"));
    expect(money).toBeNull();
    expect(listObligations).not.toHaveBeenCalled();
  });

  it("reaches a contractor, who holds grid read without billing read", async () => {
    listObligations.mockResolvedValue([obligation()]);
    expect(await getGridMoney(session("contractor"))).not.toBeNull();
  });

  it("reaches a biller, who opens this surface for exactly this question", async () => {
    listObligations.mockResolvedValue([obligation()]);
    expect(await getGridMoney(session("biller"))).not.toBeNull();
  });

  it("never invents a settled figure from an unsettled record", async () => {
    // Manual payment evidence is not processor verification anywhere else in the
    // product, and summarising it here must not quietly upgrade it.
    listObligations.mockResolvedValue([
      obligation({ beneficiaryReference: "org-1", status: "recorded_manual", amountCents: 90_000 }),
    ]);
    const money = await getGridMoney(session());
    expect(money?.settledToYouCents).toBe(0);
    expect(money?.pendingToYouCents).toBe(90_000);
  });
});
