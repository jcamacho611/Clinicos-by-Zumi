import { connectorCatalog } from "@/lib/connectors/catalog";

export type ConnectorActivationState = "not_entitled" | "entitled" | "pending_setup" | "manual_fallback" | "sandbox" | "production_ready" | "suspended";

export type ConnectorEntitlement = {
  id: string;
  organizationId: string;
  connectorId: string;
  state: ConnectorActivationState;
  fundedBy: "platform" | "customer" | "transaction" | "manual";
  sourcePaymentId?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  activatedAt?: Date | null;
  suspendedAt?: Date | null;
  notes?: string | null;
};

export function evaluateConnectorEntitlement(input: {
  organizationId: string;
  connectorId: string;
  entitlement?: ConnectorEntitlement | null;
  paymentVerified?: boolean;
  externalRequirementsSatisfied?: boolean;
}) {
  const connector = connectorCatalog.find((entry) => entry.id === input.connectorId);
  if (!connector) return { state: "not_entitled" as const, allowed: false, reasons: ["Unknown connector."] };

  if (!connector.customerConnectable) {
    return {
      state: input.externalRequirementsSatisfied ? "production_ready" as const : "pending_setup" as const,
      allowed: Boolean(input.externalRequirementsSatisfied),
      reasons: input.externalRequirementsSatisfied ? [] : [connector.externalGate],
    };
  }

  const entitlement = input.entitlement;
  if (!entitlement || entitlement.organizationId !== input.organizationId || entitlement.connectorId !== input.connectorId) {
    return { state: "not_entitled" as const, allowed: false, reasons: ["Organization has no entitlement for this connector."] };
  }
  if (entitlement.state === "suspended") return { state: "suspended" as const, allowed: false, reasons: ["Connector entitlement is suspended."] };
  if (entitlement.fundedBy === "customer" || entitlement.fundedBy === "transaction") {
    if (!input.paymentVerified) return { state: "entitled" as const, allowed: false, reasons: ["Verified server-side payment evidence is required before funded activation."] };
  }
  if (!input.externalRequirementsSatisfied) {
    return {
      state: connector.status === "sandbox-ready" ? "sandbox" as const : "pending_setup" as const,
      allowed: false,
      reasons: [connector.externalGate],
    };
  }
  return { state: "production_ready" as const, allowed: true, reasons: [] };
}

export function nextConnectorActivationState(input: {
  current: ConnectorActivationState;
  externalRequirementsSatisfied: boolean;
  manualFallbackAvailable: boolean;
}) {
  if (input.current === "suspended") return "suspended" as const;
  if (input.externalRequirementsSatisfied) return "production_ready" as const;
  if (input.manualFallbackAvailable) return "manual_fallback" as const;
  if (input.current === "not_entitled") return "not_entitled" as const;
  return "pending_setup" as const;
}
