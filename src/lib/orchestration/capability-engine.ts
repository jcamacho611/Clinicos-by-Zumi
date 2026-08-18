import "server-only";

import { connectorCatalog } from "@/lib/connectors/catalog";
import type { ActorContext, CapabilityDefinition, PolicyDecision } from "@/lib/orchestration/contracts";

const capabilities: readonly CapabilityDefinition[] = [
  { key: "care.patient.read", label: "Open patient care", description: "Open governed patient-care context.", route: "/patients", domain: "care", requiredRoles: [], requiredPermissions: [], riskClass: "phi", requiresConfirmation: false, requiresHumanReview: false, connectorIds: [], productionState: "available" },
  { key: "care.referral.manage", label: "Manage referrals", description: "Review and advance referral loops.", route: "/referrals", domain: "care", requiredRoles: [], requiredPermissions: [], riskClass: "phi", requiresConfirmation: false, requiresHumanReview: false, connectorIds: [], productionState: "available" },
  { key: "care.patient.navigate", label: "Navigate patient care", description: "Coordinate patient follow-up and next steps.", route: "/patient-navigation", domain: "care", requiredRoles: [], requiredPermissions: [], riskClass: "phi", requiresConfirmation: false, requiresHumanReview: false, connectorIds: [], productionState: "available" },
  { key: "grid.availability.manage", label: "Manage Grid availability", description: "Declare professional or resource availability.", route: "/grid/availability", domain: "grid", requiredRoles: [], requiredPermissions: [], riskClass: "low", requiresConfirmation: false, requiresHumanReview: false, connectorIds: [], productionState: "available" },
  { key: "grid.request.create", label: "Create Grid request", description: "Declare a clinic or network need.", route: "/grid/requests", domain: "grid", requiredRoles: [], requiredPermissions: [], riskClass: "review", requiresConfirmation: true, requiresHumanReview: false, connectorIds: [], productionState: "available" },
  { key: "grid.match.review", label: "Review Grid matches", description: "Review eligible Grid participants and resources.", route: "/grid/providers", domain: "grid", requiredRoles: [], requiredPermissions: [], riskClass: "review", requiresConfirmation: false, requiresHumanReview: false, connectorIds: ["google-routes"], productionState: "manual_fallback" },
  { key: "grid.transaction.manage", label: "Manage Grid transaction", description: "Manage accepted Grid work through completion and settlement.", route: "/grid/transactions", domain: "grid", requiredRoles: [], requiredPermissions: [], riskClass: "financial", requiresConfirmation: true, requiresHumanReview: true, connectorIds: ["stripe", "stripe-connect"], productionState: "connector_required" },
  { key: "edu.learning.open", label: "Open learning", description: "Open Klinikos EDU learning pathways.", route: "/edu", domain: "edu", requiredRoles: [], requiredPermissions: [], riskClass: "low", requiresConfirmation: false, requiresHumanReview: false, connectorIds: [], productionState: "available" },
  { key: "edu.competency.review", label: "Review competency", description: "Review competency progression and evidence.", route: "/edu/competencies", domain: "edu", requiredRoles: [], requiredPermissions: [], riskClass: "review", requiresConfirmation: false, requiresHumanReview: true, connectorIds: [], productionState: "available" },
  { key: "network.provider.review", label: "Review provider readiness", description: "Review provider-network identity, credentials, and readiness.", route: "/provider-network", domain: "network", requiredRoles: [], requiredPermissions: [], riskClass: "regulated", requiresConfirmation: false, requiresHumanReview: true, connectorIds: ["nppes", "state-license", "oig-leie", "sam-exclusions"], productionState: "manual_fallback" },
  { key: "quality.assurance.view", label: "View quality assurance", description: "Review governed quality and evidence state without changing closure truth.", route: "/tasks", domain: "work", requiredRoles: [], requiredPermissions: ["quality:read"], riskClass: "phi", requiresConfirmation: false, requiresHumanReview: false, connectorIds: [], productionState: "available" },
  { key: "quality.assurance.manage", label: "Manage quality assurance work", description: "Advance quality evidence and remediation work through governed task queues.", route: "/tasks", domain: "work", requiredRoles: [], requiredPermissions: ["quality:update"], riskClass: "phi", requiresConfirmation: false, requiresHumanReview: false, connectorIds: [], productionState: "available" },
  { key: "quality.assurance.review", label: "Review quality evidence", description: "Perform the authorized human-review step required before regulated quality closure.", route: "/tasks", domain: "work", requiredRoles: [], requiredPermissions: ["quality:manage"], riskClass: "regulated", requiresConfirmation: true, requiresHumanReview: true, connectorIds: [], productionState: "available" },
  { key: "work.task.manage", label: "Manage work", description: "Open assigned work and ownership queues.", route: "/tasks", domain: "work", requiredRoles: [], requiredPermissions: [], riskClass: "low", requiresConfirmation: false, requiresHumanReview: false, connectorIds: [], productionState: "available" },
  { key: "revenue.payment.collect", label: "Collect payment", description: "Collect or reconcile a payment through approved rails.", route: "/billing", domain: "revenue", requiredRoles: [], requiredPermissions: [], riskClass: "financial", requiresConfirmation: true, requiresHumanReview: false, connectorIds: ["stripe"], productionState: "connector_required" },
  { key: "organization.connections.manage", label: "Manage connections", description: "Configure organization integrations and external dependencies.", route: "/integrations", domain: "organization", requiredRoles: ["owner", "admin"], requiredPermissions: [], riskClass: "review", requiresConfirmation: true, requiresHumanReview: false, connectorIds: [], productionState: "available" },
] as const;

export function listCapabilities() {
  return capabilities.slice();
}

export function getCapability(key: string) {
  return capabilities.find((capability) => capability.key === key) ?? null;
}

export function evaluateCapabilityPolicy(input: {
  context: ActorContext;
  capabilityKey: string;
  connectedConnectorIds?: readonly string[];
}): PolicyDecision {
  const capability = getCapability(input.capabilityKey);
  if (!capability) {
    return { state: "unavailable", reasons: ["Unknown capability."], missingRoles: [], missingPermissions: [], missingConnectors: [], requiredConfirmations: [] };
  }

  const roleSet = new Set(input.context.roleKeys.map((role) => role.toLowerCase()));
  const permissionSet = new Set(input.context.permissionKeys);
  const connected = new Set(input.connectedConnectorIds ?? []);
  const missingRoles = capability.requiredRoles.filter((role) => !roleSet.has(role.toLowerCase()));
  const missingPermissions = capability.requiredPermissions.filter((permission) => !permissionSet.has(permission));
  const missingConnectors = capability.connectorIds.filter((id) => {
    const definition = connectorCatalog.find((connector) => connector.id === id);
    if (!definition) return true;
    if (capability.productionState === "manual_fallback") return false;
    return !connected.has(id);
  });

  const reasons: string[] = [];
  if (missingRoles.length) reasons.push(`Missing role: ${missingRoles.join(", ")}.`);
  if (missingPermissions.length) reasons.push(`Missing permission: ${missingPermissions.join(", ")}.`);
  if (missingConnectors.length) reasons.push(`Required connection not ready: ${missingConnectors.join(", ")}.`);

  if (missingRoles.length || missingPermissions.length || missingConnectors.length) {
    return {
      state: "blocked",
      reasons,
      missingRoles,
      missingPermissions,
      missingConnectors,
      requiredConfirmations: capability.requiresConfirmation ? ["Explicit user confirmation"] : [],
    };
  }

  if (capability.requiresHumanReview || capability.riskClass === "regulated") {
    return {
      state: "review_required",
      reasons: ["This capability requires a governed human-review step before consequential completion."],
      missingRoles: [],
      missingPermissions: [],
      missingConnectors: [],
      requiredConfirmations: capability.requiresConfirmation ? ["Explicit user confirmation"] : [],
    };
  }

  return {
    state: "allowed",
    reasons: [],
    missingRoles: [],
    missingPermissions: [],
    missingConnectors: [],
    requiredConfirmations: capability.requiresConfirmation ? ["Explicit user confirmation"] : [],
  };
}
