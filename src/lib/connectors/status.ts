import "server-only";

import { connectorCatalog, type ConnectorDefinition } from "@/lib/connectors/catalog";
import { evaluateConnectorReadiness, provisioningStateLabels, type ProvisioningState } from "@/lib/connectors/taxonomy";

export type ConnectorRuntimeStatus = {
  id: string;
  name: string;
  gateway: string;
  economics: string;
  ownership: string;
  configured: boolean;
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

function configurationPresent(connector: ConnectorDefinition, missingEnv: string[]) {
  const requiredCount = connector.env.length + (connector.publicEnv?.length ?? 0);
  // An integration with no environment variables is not magically configured. It
  // becomes configured only when its audited readiness record says so.
  return requiredCount > 0 ? missingEnv.length === 0 : connector.gates.configured === true;
}

function readinessFor(connector: ConnectorDefinition, configured: boolean) {
  return evaluateConnectorReadiness({
    gates: { ...connector.gates, configured },
    handlesPhi: connector.handlesPhi,
    baaRequired: connector.baaRequired,
  });
}

function provisioningStateFor(connector: ConnectorDefinition, configured: boolean): ProvisioningState {
  const readiness = readinessFor(connector, configured);
  if (readiness.phiUsable || (readiness.productionUsable && !connector.handlesPhi)) return "active";
  if (readiness.productionUsable) return "compliance_review_pending";

  const gates = connector.gates;
  if (connector.handlesPhi && gates.contract_complete && connector.baaRequired && !gates.baa_complete) return "compliance_review_pending";
  if (gates.contract_complete && !gates.enrollment_complete) return "enrollment_pending";
  if (!configured && connector.customerConnectable) return "vendor_connection_required";
  if (!configured) return "not_started";
  return "provisioning";
}

/**
 * Runtime view of a connector. Secret values never leave this function; only missing
 * variable names and derived readiness are returned.
 */
export function connectorStatus(connector: ConnectorDefinition, env: NodeJS.ProcessEnv = process.env): ConnectorRuntimeStatus {
  const missingEnv = missingEnvFor(connector, env);
  const configured = configurationPresent(connector, missingEnv);
  const readiness = readinessFor(connector, configured);
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

export function connectorIntegritySummary(env: NodeJS.ProcessEnv = process.env) {
  const connectors = connectorCatalog.map((connector) => connectorStatus(connector, env));
  return {
    total: connectors.length,
    configured: connectors.filter((connector) => connector.configured).length,
    productionUsable: connectors.filter((connector) => connector.productionUsable).length,
    phiUsable: connectors.filter((connector) => connector.phiUsable).length,
    connectors,
  };
}
