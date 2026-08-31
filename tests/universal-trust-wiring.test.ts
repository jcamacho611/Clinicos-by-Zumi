import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { projectGridTrustSignals } from "@/lib/trust/universal-trust";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("universal trust wiring", () => {
  it("projects an active Grid dispute without pretending a refund or restriction executed", () => {
    const [signal] = projectGridTrustSignals({
      disputes: [{
        id: "dispute-1",
        reservationId: "reservation-1",
        category: "payment_disagreement",
        summary: "The parties disagree about the cancellation charge.",
        status: "under_review",
        updatedAt: "2026-08-22T20:00:00.000Z",
      }],
      safetyIncidents: [],
    });

    expect(signal).toMatchObject({
      id: "grid:dispute:dispute-1",
      domain: "grid",
      kind: "commercial_dispute",
      status: "under_review",
      severity: "review",
      open: true,
      blocksSettlement: true,
      authority: {
        refundExecuted: false,
        payoutActionExecuted: false,
        participantRestrictionExecuted: false,
        resourceSuspensionExecuted: false,
        medicalDeterminationMade: false,
      },
      source: {
        recordType: "GridDisputeRecord",
        recordId: "dispute-1",
      },
    });
  });

  it("projects an active Grid safety incident with severity while preserving governance boundaries", () => {
    const [signal] = projectGridTrustSignals({
      disputes: [],
      safetyIncidents: [{
        id: "incident-1",
        reservationId: "reservation-1",
        category: "credential_concern",
        severity: "urgent",
        summary: "Credential evidence appears inconsistent with the offered service.",
        status: "triage_required",
        updatedAt: "2026-08-22T21:00:00.000Z",
      }],
    });

    expect(signal).toMatchObject({
      id: "grid:safety:incident-1",
      domain: "grid",
      kind: "safety_incident",
      severity: "urgent",
      open: true,
      blocksSettlement: true,
    });
    expect(signal.authority.medicalDeterminationMade).toBe(false);
    expect(signal.authority.participantRestrictionExecuted).toBe(false);
    expect(signal.authority.resourceSuspensionExecuted).toBe(false);
  });

  it("does not keep settlement blocked after the governed source record is closed", () => {
    const [signal] = projectGridTrustSignals({
      disputes: [{
        id: "dispute-closed",
        reservationId: "reservation-2",
        category: "no_show",
        summary: "The reservation was reviewed and the dispute record was closed.",
        status: "closed",
        updatedAt: "2026-08-22T19:00:00.000Z",
      }],
      safetyIncidents: [],
    });

    expect(signal.open).toBe(false);
    expect(signal.blocksSettlement).toBe(false);
    expect(signal.authority.refundExecuted).toBe(false);
  });

  it("orders normalized signals by most recent source evidence without changing source truth", () => {
    const signals = projectGridTrustSignals({
      disputes: [{
        id: "older",
        reservationId: "reservation-1",
        category: "other",
        summary: "Older commercial issue with enough factual detail.",
        status: "open",
        updatedAt: "2026-08-22T18:00:00.000Z",
      }],
      safetyIncidents: [{
        id: "newer",
        reservationId: "reservation-1",
        category: "conduct_concern",
        severity: "high",
        summary: "Newer safety concern with enough factual detail for review.",
        status: "open",
        updatedAt: "2026-08-22T22:00:00.000Z",
      }],
    });

    expect(signals.map((signal) => signal.source.recordId)).toEqual(["newer", "older"]);
  });

  it("wires the shared projection beside the existing Grid trust workspace rather than replacing it", () => {
    const repository = read("src/lib/grid/trust-workspace-repository.ts");
    const page = read("src/app/(platform)/grid/trust/page.tsx");
    const component = read("src/components/trust/governed-trust-signals.tsx");
    const existingGridWorkspace = read("src/components/grid/grid-trust-workspace.tsx");

    expect(repository).toContain("projectGridTrustSignals");
    expect(repository).toContain("trustSignals");
    expect(page).toContain("GovernedTrustSignals");
    expect(page).toContain("workspace.trustSignals");
    expect(page).toContain("GridTrustWorkspace");
    expect(component).toContain("Governed trust signals");
    expect(component).toContain("No automatic penalty");
    expect(repository).not.toContain("UniversalTrustRecord");
    expect(existingGridWorkspace).toContain("Marketplace disputes");
    expect(existingGridWorkspace).toContain("Safety incidents");
    expect(component).not.toMatch(/refund completed|participant suspended|license revoked/i);
  });
});