import { describe, expect, it } from "vitest";
import {
  connectorCatalog,
  connectorReadiness,
  connectorsByEconomicClass,
  connectorsByGateway,
  customerConnectableConnectors,
  getConnector,
} from "@/lib/connectors/catalog";
import {
  CONFIGURED_IS_NOT_APPROVED,
  economicClasses,
  evaluateConnectorReadiness,
  gateways,
  integrationClasses,
  ownershipClasses,
  phiEgressAllowed,
  provisioningStates,
  readinessGates,
} from "@/lib/connectors/taxonomy";

/**
 * The claim this file defends: Klinikos never reports an integration as further along
 * than its paperwork. A working API key is not a contract, a contract is not a BAA,
 * and none of them is production.
 */

describe("connector taxonomy", () => {
  it("keeps the nine readiness gates independent", () => {
    // A single status enum cannot express "credentials work, no BAA" — which is the
    // state most integrations sit in, and the one that gets misreported.
    expect(readinessGates).toHaveLength(9);
    expect(readinessGates).toContain("configured");
    expect(readinessGates).toContain("baa_complete");
    expect(readinessGates).toContain("phi_approved");
    expect(readinessGates).toContain("production_live");
  });

  it("treats an unspecified gate as false", () => {
    const readiness = evaluateConnectorReadiness({ gates: {}, handlesPhi: true, baaRequired: true });
    expect(readiness).toMatchObject({ productionUsable: false, phiUsable: false, sandboxUsable: false });
    expect(readiness.summary).toBe("Pending connection");
  });

  it("does not let credentials alone imply production use", () => {
    const readiness = evaluateConnectorReadiness({ gates: { configured: true }, handlesPhi: false, baaRequired: false });
    expect(readiness.productionUsable).toBe(false);
    expect(readiness.summary).toBe("Credentials present, not approved for use");
  });

  it("allows sandbox on credentials plus a sandbox gate, and nothing more", () => {
    const readiness = evaluateConnectorReadiness({
      gates: { configured: true, sandbox_ready: true },
      handlesPhi: true,
      baaRequired: true,
    });
    expect(readiness).toMatchObject({ sandboxUsable: true, productionUsable: false, phiUsable: false });
    expect(readiness.summary).toBe("Sandbox only");
  });

  it("allows production without PHI once the commercial and security gates are complete", () => {
    const readiness = evaluateConnectorReadiness({
      gates: {
        configured: true, contract_complete: true, security_review_complete: true,
        production_credentials: true, production_live: true,
      },
      handlesPhi: false,
      baaRequired: false,
    });
    expect(readiness).toMatchObject({ productionUsable: true, phiUsable: false });
    expect(readiness.summary).toBe("Live, not approved for PHI");
  });

  it("refuses PHI while the BAA is outstanding, however complete everything else is", () => {
    const gates = {
      configured: true, sandbox_ready: true, contract_complete: true,
      security_review_complete: true, enrollment_complete: true,
      production_credentials: true, production_live: true, phi_approved: true,
    };
    expect(phiEgressAllowed({ gates, handlesPhi: true, baaRequired: true })).toBe(false);
    expect(phiEgressAllowed({ gates: { ...gates, baa_complete: true }, handlesPhi: true, baaRequired: true })).toBe(true);
  });

  it("refuses PHI while the explicit PHI approval is outstanding", () => {
    // A signed BAA is permission to be given PHI, not a decision that this deployment
    // should send it. Both are required.
    const gates = {
      configured: true, contract_complete: true, security_review_complete: true,
      enrollment_complete: true, production_credentials: true, production_live: true, baa_complete: true,
    };
    expect(phiEgressAllowed({ gates, handlesPhi: true, baaRequired: true })).toBe(false);
  });

  it("names the gates still outstanding so a blocker is actionable", () => {
    const readiness = evaluateConnectorReadiness({
      gates: { configured: true },
      handlesPhi: true,
      baaRequired: true,
    });
    expect(readiness.missingGates).toContain("contract_complete");
    expect(readiness.missingGates).toContain("baa_complete");
    expect(readiness.missingGates).toContain("phi_approved");
    expect(readiness.missingGates).not.toContain("configured");
  });

  it("says plainly that configured is not approved", () => {
    expect(CONFIGURED_IS_NOT_APPROVED).toContain("A working API key is not approval");
  });
});

describe("the connector catalog", () => {
  it("reports no connector as live, because none has a contract", () => {
    // If this test starts failing, someone flipped a readiness gate. That should only
    // ever happen alongside the actual paperwork.
    const live = connectorCatalog.filter((connector) => connectorReadiness(connector).productionUsable);
    expect(live.map((connector) => connector.id)).toEqual([]);
  });

  it("sends no PHI anywhere", () => {
    const phi = connectorCatalog.filter((connector) => connectorReadiness(connector).phiUsable);
    expect(phi.map((connector) => connector.id)).toEqual([]);
  });

  it("classifies every connector on all five axes", () => {
    for (const connector of connectorCatalog) {
      expect({ id: connector.id, ok: gateways.includes(connector.gateway) }).toEqual({ id: connector.id, ok: true });
      expect({ id: connector.id, ok: integrationClasses.includes(connector.integration) }).toEqual({ id: connector.id, ok: true });
      expect({ id: connector.id, ok: ownershipClasses.includes(connector.ownership) }).toEqual({ id: connector.id, ok: true });
      expect({ id: connector.id, ok: economicClasses.includes(connector.economics) }).toEqual({ id: connector.id, ok: true });
    }
  });

  it("names a concrete external gate for every connector", () => {
    // "Blocked" is only useful if it says on what. A vague blocker is a blocker
    // nobody can clear.
    for (const connector of connectorCatalog) {
      expect({ id: connector.id, length: connector.externalGate.length > 20 }).toEqual({ id: connector.id, length: true });
    }
  });

  it("declares each connector exactly once", () => {
    const ids = connectorCatalog.map((connector) => connector.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("exposes a public key only where the browser genuinely needs one", () => {
    // browser → Klinikos → vendor is the rule. Google Maps JS is the documented
    // exception, and it must hold no server-side key.
    const withPublicEnv = connectorCatalog.filter((connector) => (connector.publicEnv?.length ?? 0) > 0);
    expect(withPublicEnv.map((connector) => connector.id)).toEqual(["google-maps-js"]);
    for (const connector of withPublicEnv) {
      expect(connector.integration).toBe("browser_and_server");
      expect(connector.env).toEqual([]);
      expect(connector.handlesPhi).toBe(false);
    }
  });

  it("never puts a PHI-bearing connector on a browser key", () => {
    for (const connector of connectorCatalog) {
      if (connector.handlesPhi) expect({ id: connector.id, publicEnv: connector.publicEnv ?? [] }).toEqual({ id: connector.id, publicEnv: [] });
    }
  });

  it("requires a BAA for every connector that would carry PHI", () => {
    for (const connector of connectorCatalog) {
      if (!connector.handlesPhi) continue;
      // CMS Blue Button is patient-authorized rather than a business associate
      // relationship, which is why it is the one PHI connector without a BAA gate.
      if (connector.ownership === "patient_authorized") continue;
      expect({ id: connector.id, baa: connector.baaRequired }).toEqual({ id: connector.id, baa: true });
    }
  });

  it("routes payment confirmation through webhooks rather than a redirect", () => {
    expect(getConnector("stripe")?.integration).toBe("webhook_driven");
  });

  it("treats patient-authorized access as its own ownership class", () => {
    // The clinic cannot consent on the patient's behalf, so this cannot be
    // clinic-owned.
    expect(getConnector("cms-blue-button")?.ownership).toBe("patient_authorized");
  });

  it("keeps the regulated rails out of the ordinary API-key class", () => {
    for (const id of ["labs", "imaging", "erx", "stedi"]) {
      expect({ id, integration: getConnector(id)?.integration }).toEqual({ id, integration: "regulated_network" });
    }
  });

  it("groups connectors under the gateway that owns the vendor call", () => {
    expect(connectorsByGateway("ai").map((connector) => connector.id)).toEqual(["openai", "anthropic", "google-ai"]);
    expect(connectorsByGateway("clinical_network").map((connector) => connector.id)).toEqual(["labs", "imaging", "erx"]);
  });

  it("keeps the clinic's own healthcare relationships out of Klinikos' cost base", () => {
    const customerOwned = connectorsByEconomicClass("B_customer_owned").map((connector) => connector.id);
    expect(customerOwned).toContain("labs");
    expect(customerOwned).toContain("imaging");
    expect(customerOwned).toContain("stedi");

    // AI and maps are Klinikos' own infrastructure, metered and priced into the plan.
    const platform = connectorsByEconomicClass("A_platform").map((connector) => connector.id);
    expect(platform).toContain("openai");
    expect(platform).toContain("google-routes");
  });

  it("defers avoidable per-customer vendor cost until after a sale", () => {
    const afterSale = connectorsByEconomicClass("C_activate_after_sale").map((connector) => connector.id);
    expect(afterSale).toContain("daily");
    expect(afterSale).toContain("background-check");
    expect(afterSale).toContain("esign");
  });

  it("offers a customer-connectable path for the relationships clinics already hold", () => {
    const connectable = customerConnectableConnectors().map((connector) => connector.id);
    for (const id of ["labs", "imaging", "stedi", "twilio", "stripe-connect"]) {
      expect({ id, connectable: connectable.includes(id) }).toEqual({ id, connectable: true });
    }
  });

  it("enumerates the honest waiting states a customer may be shown", () => {
    // A healthcare vendor requiring manual enrollment cannot be made instant, so the
    // vocabulary has to be able to say so.
    expect(provisioningStates).toContain("enrollment_pending");
    expect(provisioningStates).toContain("compliance_review_pending");
    expect(provisioningStates).toContain("vendor_connection_required");
  });
});
