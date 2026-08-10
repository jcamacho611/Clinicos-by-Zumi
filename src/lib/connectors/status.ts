import "server-only";

import { connectorCatalog, connectorReadiness, type ConnectorDefinition } from "@/lib/connectors/catalog";
import { provisioningStateLabels, type ProvisioningState } from "@/lib/connectors/taxonomy";

/**
 * Configuration status for connectors, resolved from the process environment.
 *
 * Separated from the catalog so the catalog stays pure and testable, and so there is
 * exactly one place that reads credentials. Nothing here ever returns a credential
 * value — only whether one is present, and which names are missing.
 */

export type ConnectorStatus = {
  id: string;
  name: string;
  gateway: string;
  economics: string;
  ownership: string;
  /** Whether every required variable has a non-empty value. */
  configured: boolean;
  /** Names of missing variables. Names only — never values. */
  missingEnv: string[];
  handlesPhi: boolean;
  customerConnectable: boolean;
  productionUsable: boolean;
  phiUsable: boolean;
  sandboxUsable: boolean;
  provisioningState: ProvisioningState;
  provisioningLabel: string;
  externalGate: string;
  summary: string;
};

function missingEnvFor(connector: ConnectorDefinition, env: NodeJS.ProcessEnv) {
  const required = [...connector.env, ...(connector.publicEnv ?? [])];
  return required.filter((name) => {
    const value = env[name];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

/**
 * The provisioning state a customer should be shown.
 *
 * Derived, never stored as a claim. The ordering matters: a connector whose gates are
 * incomplete is reported as waiting on the specific thing it is waiting on, rather
 * than as a generic error the customer cannot act on.
 */
function provisioningStateFor(connector: ConnectorDefinition, configured: boolean): ProvisioningState {
  const readiness = connectorReadiness(connector);

  if (readiness.phiUsable || (readiness.productionUsable && !connector.handlesPhi)) return "active";
  if (readiness.productionUsable) return "compliance_review_pending";

  const gates = connector.gates;
  if (connector.handlesPhi && gates.contract_complete && !gates.baa_complete) return "compliance_review_pending";
  if (gates.contract_complete && !gates.enrollment_complete) return "enrollment_pending";
  if (!configured && connector.customerConnectable) return "vendor_connection_required";
  if (!configured) return "not_started";
  return "provisioning";
}

export function connectorStatus(connector: ConnectorDefinition, env: NodeJS.ProcessEnv = process.env): ConnectorStatus {
  const missingEnv = missingEnvFor(connector, env);
  const configured = missingEnv.length === 0;
  const readiness = connectorReadiness(connector);
  const provisioningState = provisioningStateFor(connector, configured);

  return {
    id: connector.id,
    name: connector.name,
    gateway: connector.gateway,
    economics: connector.economics,
    ownership: connector.ownership,
    configured,
    missingEnv,
    handlesPhi: connector.handlesPhi,
    customerConnectable: connector.customerConnectable,
    productionUsable: readiness.productionUsable,
    phiUsable: readiness.phiUsable,
    sandboxUsable: readiness.sandboxUsable,
    provisioningState,
    provisioningLabel: provisioningStateLabels[provisioningState],
    externalGate: connector.externalGate,
    summary: readiness.summary,
  };
}

export function connectorStatusSummary(env: NodeJS.ProcessEnv = process.env) {
  const connectors = connectorCatalog.map((connector) => connectorStatus(connector, env));
  return {
    total: connectors.length,
    configured: connectors.filter((connector) => connector.configured).length,
    productionUsable: connectors.filter((connector) => connector.productionUsable).length,
    phiUsable: connectors.filter((connector) => connector.phiUsable).length,
    connectors,
  };
}
