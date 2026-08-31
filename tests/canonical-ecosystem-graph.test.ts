import { describe, expect, it } from "vitest";
import { klinikosPathCatalog } from "@/lib/paths/catalog";
import {
  CANONICAL_PLANE_IDS,
  canonicalEcosystemGraph,
  REQUIRED_ECOSYSTEM_LENS_IDS,
} from "@/lib/ecosystem/canonical-ecosystem-graph";

const requiredJourneyIds = [
  "patient-care",
  "learner-placement-work",
  "professional-grid",
  "clinic-grid",
  "current-visit-rcm",
  "quality-expert",
  "company-compounding",
] as const;

const strategyStates = new Set([
  "NOW",
  "NEXT",
  "LATER",
  "PARTNER",
  "CONNECT",
  "INTERNALIZE",
  "NEVER_BUILD",
]);

const implementationStates = new Set([
  "LIVE_VERIFIED",
  "BUILT_NEEDS_VERIFICATION",
  "PARTIAL",
  "DESIGNED",
  "PLANNED",
  "EXTERNAL_CONNECTION_REQUIRED",
  "LEGAL_REVIEW_REQUIRED",
  "NOT_BUILT",
  "HISTORICAL_ONLY",
]);

describe("canonical five-plane ecosystem graph", () => {
  it("defines exactly the five approved planes and identifies the graph as connective machinery", () => {
    expect(CANONICAL_PLANE_IDS).toEqual([
      "healthcare_universe",
      "economic_resource",
      "lifecycle",
      "operating_infrastructure",
      "compounding_business",
    ]);
    expect(canonicalEcosystemGraph.kind).toBe("connective_graph");
    expect(canonicalEcosystemGraph.isTopLevelPlane).toBe(false);
    expect(canonicalEcosystemGraph.planes.map(({ id }) => id)).toEqual(CANONICAL_PLANE_IDS);
  });

  it("keeps stable unique graph identifiers and valid references", () => {
    const nodeIds = canonicalEcosystemGraph.nodes.map(({ id }) => id);
    const edgeIds = canonicalEcosystemGraph.edges.map(({ id }) => id);
    const knownNodeIds = new Set(nodeIds);

    expect(new Set(nodeIds).size).toBe(nodeIds.length);
    expect(new Set(edgeIds).size).toBe(edgeIds.length);

    for (const node of canonicalEcosystemGraph.nodes) {
      expect(CANONICAL_PLANE_IDS).toContain(node.planeId);
      expect(strategyStates.has(node.strategyState)).toBe(true);
      expect(implementationStates.has(node.implementationState)).toBe(true);
    }

    for (const edge of canonicalEcosystemGraph.edges) {
      expect(knownNodeIds.has(edge.from)).toBe(true);
      expect(knownNodeIds.has(edge.to)).toBe(true);
    }
  });

  it("binds every registered Klinikos route to graph nodes or an explicit approved boundary", () => {
    const bindings = new Map(canonicalEcosystemGraph.routeBindings.map((binding) => [binding.routeId, binding]));
    const knownNodeIds = new Set(canonicalEcosystemGraph.nodes.map(({ id }) => id));

    for (const path of klinikosPathCatalog) {
      const binding = bindings.get(path.id);
      expect(binding, `missing graph binding for ${path.id}`).toBeDefined();
      expect(
        Boolean(binding?.approvedBoundary) || (binding?.nodeIds.length ?? 0) > 0,
        `${path.id} must bind to graph nodes or an approved boundary`,
      ).toBe(true);
      for (const nodeId of binding?.nodeIds ?? []) expect(knownNodeIds.has(nodeId)).toBe(true);
    }
  });

  it("contains the required cross-plane journeys", () => {
    const journeys = new Map(canonicalEcosystemGraph.journeys.map((journey) => [journey.id, journey]));

    for (const journeyId of requiredJourneyIds) {
      const journey = journeys.get(journeyId);
      expect(journey, `missing ${journeyId} journey`).toBeDefined();
      expect(new Set(journey?.planeIds ?? []).size).toBeGreaterThan(1);
      expect((journey?.nodeIds.length ?? 0) > 1).toBe(true);
    }
  });

  it("preserves hard safety and economic invariants", () => {
    expect(canonicalEcosystemGraph.invariants).toMatchObject({
      patientDemandPrivateByDefault: true,
      eligibilityBeforeRanking: true,
      educationCompletionIsNotLicense: true,
      resumeIsNotVerifiedCredential: true,
      paymentIsNotAuthority: true,
      aiCannotSelfAuthorizeConsequentialActions: true,
      regulatedClinicalInventoryUsesOrdinaryPublicCommerce: false,
    });

    expect(canonicalEcosystemGraph.invariants.transactionTruthOrder).toEqual([
      "match",
      "offer",
      "agreement",
      "reservation_or_assignment_or_order_or_appointment",
      "fulfillment",
      "evidence",
      "financial_obligation_where_applicable",
      "payment_or_payable_or_payout_where_applicable",
      "settlement_where_applicable",
      "reconciliation_where_applicable",
    ]);
  });

  it("represents authoritative external healthcare rails as connections rather than internal authority", () => {
    for (const nodeId of [
      "external.lab_rail",
      "external.imaging_rail",
      "external.pharmacy_erx_rail",
      "external.clearinghouse_rail",
      "external.payer_rail",
      "external.credential_authority_rail",
    ]) {
      const node = canonicalEcosystemGraph.nodes.find((candidate) => candidate.id === nodeId);
      expect(node, `missing ${nodeId}`).toBeDefined();
      expect(["CONNECT", "PARTNER"]).toContain(node?.strategyState);
      expect(node?.authorityOwner).toBe("external");
    }
  });

  it("registers every required generated ecosystem lens from one graph", () => {
    expect(REQUIRED_ECOSYSTEM_LENS_IDS).toHaveLength(21);
    const lensIds = canonicalEcosystemGraph.lenses.map(({ id }) => id);
    expect(new Set(lensIds).size).toBe(lensIds.length);
    expect(lensIds).toEqual(expect.arrayContaining([...REQUIRED_ECOSYSTEM_LENS_IDS]));

    const knownNodeIds = new Set(canonicalEcosystemGraph.nodes.map(({ id }) => id));
    for (const lens of canonicalEcosystemGraph.lenses) {
      expect(lens.nodeIds.length, `${lens.id} must project at least one node`).toBeGreaterThan(0);
      for (const nodeId of lens.nodeIds) expect(knownNodeIds.has(nodeId)).toBe(true);
    }
  });
});
