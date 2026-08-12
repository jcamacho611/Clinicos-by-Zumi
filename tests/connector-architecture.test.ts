import { describe, expect, it } from "vitest";
import {
  connectorCatalog,
  connectorReadiness,
  connectorsByEconomicClass,
  connectorsByGateway,
  customerConnectableConnectors,
  getConnector,
} from "@/lib/connectors/catalog";
import { connectorStatus } from "@/lib/connectors/status";
import {
  CONFIGURED_IS_NOT_APPROVED,
  economicClasses,
  evaluateConnectorReadiness,
  gateways,
  integrationClasses,
  ownershipClasses,
  phiEgressAllowed,
  readinessGates,
} from "@/lib/connectors/taxonomy";

describe("connector readiness is fail-closed", () => {
  it("keeps configuration, contracts, security, enrollment, PHI and production independent", () => {
    expect(readinessGates).toHaveLength(9);
    expect(readinessGates).toEqual(expect.arrayContaining([
      "configured",
      "sandbox_ready",
      "contract_complete",
      "baa_complete",
      "security_review_complete",
      "enrollment_complete",
      "production_credentials",
      "phi_approved",
      "production_live",
    ]));
  });

  it("does not let credentials imply production readiness", () => {
    const readiness = evaluateConnectorReadiness({
      gates: { configured: true },
      handlesPhi: false,
      baaRequired: false,
    });
    expect(readiness.productionUsable).toBe(false);
    expect(readiness.phiUsable).toBe(false);
    expect(readiness.summary).toBe("Configuration present, not approved for use");
  });

  it("allows sandbox without promoting it to production", () => {
    const readiness = evaluateConnectorReadiness({
      gates: { configured: true, sandbox_ready: true },
      handlesPhi: true,
      baaRequired: true,
    });
    expect(readiness).toMatchObject({ sandboxUsable: true, productionUsable: false, phiUsable: false });
  });

  it("requires every production gate before non-PHI production traffic", () => {
    const readiness = evaluateConnectorReadiness({
      gates: {
        configured: true,
        contract_complete: true,
        security_review_complete: true,
        production_credentials: true,
        production_live: true,
      },
      handlesPhi: false,
      baaRequired: false,
    });
    expect(readiness).toMatchObject({ productionUsable: true, phiUsable: false });
  });

  it("requires explicit PHI approval and a BAA whenever the relationship requires one", () => {
    const gates = {
      configured: true,
      contract_complete: true,
      security_review_complete: true,
      enrollment_complete: true,
      production_credentials: true,
      production_live: true,
      phi_approved: true,
    } as const;

    expect(phiEgressAllowed({ gates, handlesPhi: true, baaRequired: true })).toBe(false);
    expect(phiEgressAllowed({ gates: { ...gates, baa_complete: true }, handlesPhi: true, baaRequired: true })).toBe(true);
  });

  it("still requires deployment and PHI approval for self-hosted infrastructure even without a third-party BAA", () => {
    const selfHosted = getConnector("self_hosted");
    expect(selfHosted).toMatchObject({ ownership: "klinikos_owned", handlesPhi: true, baaRequired: false });
    expect(selfHosted && connectorReadiness(selfHosted).phiUsable).toBe(false);
  });

  it("states the core rule plainly", () => {
    expect(CONFIGURED_IS_NOT_APPROVED).toContain("Working configuration is not approval");
  });
});

describe("connector catalog invariants", () => {
  it("classifies every connector on the server-integrity axes", () => {
    for (const connector of connectorCatalog) {
      expect(gateways).toContain(connector.gateway);
      expect(integrationClasses).toContain(connector.integration);
      expect(ownershipClasses).toContain(connector.ownership);
      expect(economicClasses).toContain(connector.economics);
      expect(connector.externalGate.length).toBeGreaterThan(20);
    }
  });

  it("declares each connector exactly once", () => {
    const ids = connectorCatalog.map((connector) => connector.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it("declares no connector production-live or PHI-approved by default", () => {
    expect(connectorCatalog.filter((connector) => connectorReadiness(connector).productionUsable)).toEqual([]);
    expect(connectorCatalog.filter((connector) => connectorReadiness(connector).phiUsable)).toEqual([]);
  });

  it("allows a browser credential only for the map-rendering exception", () => {
    const browser = connectorCatalog.filter((connector) => (connector.publicEnv?.length ?? 0) > 0);
    expect(browser.map((connector) => connector.id)).toEqual(["google-maps-js"]);
    expect(browser[0]).toMatchObject({ integration: "browser_and_server", handlesPhi: false, env: [] });
  });

  it("never puts PHI-bearing integrations on a browser credential", () => {
    for (const connector of connectorCatalog.filter((connector) => connector.handlesPhi)) {
      expect(connector.publicEnv ?? []).toEqual([]);
    }
  });

  it("makes self-hosted Zumi the first-class AI infrastructure path without removing optional providers", () => {
    expect(connectorsByGateway("ai").map((connector) => connector.id)).toEqual([
      "self_hosted",
      "openai",
      "anthropic",
      "google-ai",
    ]);
  });

  it("routes payment truth through server-verifiable integration shapes", () => {
    expect(getConnector("stripe")?.integration).toBe("webhook_driven");
    expect(getConnector("stripe-connect")?.integration).toBe("oauth_authorized");
  });

  it("keeps customer-owned healthcare relationships out of the default Klinikos variable-cost base", () => {
    const customerOwned = connectorsByEconomicClass("B_customer_owned").map((connector) => connector.id);
    expect(customerOwned).toEqual(expect.arrayContaining(["twilio", "stedi", "labs", "imaging"]));

    const connectable = customerConnectableConnectors().map((connector) => connector.id);
    expect(connectable).toEqual(expect.arrayContaining(["labs", "imaging", "stedi", "twilio", "stripe-connect"]));
  });

  it("never returns credential values from runtime status", () => {
    const selfHosted = getConnector("self_hosted");
    expect(selfHosted).toBeTruthy();
    const status = connectorStatus(selfHosted!, {
      ZUMI_SELF_HOSTED_BASE_URL: "https://private.internal",
      ZUMI_SELF_HOSTED_MODEL: "private-model",
      ZUMI_SELF_HOSTED_API_KEY: "never-return-this",
    });
    expect(status.configured).toBe(true);
    expect(status.productionUsable).toBe(false);
    expect(status.phiUsable).toBe(false);
    expect(JSON.stringify(status)).not.toContain("never-return-this");
    expect(JSON.stringify(status)).not.toContain("private-model");
    expect(JSON.stringify(status)).not.toContain("private.internal");
  });
});
