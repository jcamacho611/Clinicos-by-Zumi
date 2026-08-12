import type { BlockerResolution, PolicyDecision } from "@/lib/orchestration/contracts";

export function blockersFromPolicy(decision: PolicyDecision): BlockerResolution[] {
  const blockers: BlockerResolution[] = [];

  for (const role of decision.missingRoles) {
    blockers.push({
      code: `missing_role:${role}`,
      title: `Role required: ${role}`,
      explanation: `This action requires the ${role} role in the active context.`,
      owner: "clinic",
      canResolveNow: false,
      alternatives: [],
    });
  }

  for (const permission of decision.missingPermissions) {
    blockers.push({
      code: `missing_permission:${permission}`,
      title: "Permission required",
      explanation: `The active context does not currently grant ${permission}.`,
      owner: "clinic",
      canResolveNow: false,
      alternatives: [],
    });
  }

  for (const connector of decision.missingConnectors) {
    blockers.push({
      code: `missing_connector:${connector}`,
      title: "Connection not ready",
      explanation: `${connector} is required for the automated path, but the connection is not production-ready in this context.`,
      owner: "connector",
      canResolveNow: false,
      alternatives: [
        {
          title: "Use an approved manual fallback",
          description: "Continue the workflow using a documented manual process when one exists, while preserving the Path and audit trail.",
        },
      ],
    });
  }

  if (decision.state === "review_required") {
    blockers.push({
      code: "human_review_required",
      title: "Human review required",
      explanation: decision.reasons[0] ?? "A governed reviewer must approve this consequential action before completion.",
      owner: "reviewer",
      canResolveNow: false,
      alternatives: [],
    });
  }

  return blockers;
}

export function describeBlockerSummary(blockers: readonly BlockerResolution[]) {
  if (blockers.length === 0) return "No blockers.";
  if (blockers.length === 1) return blockers[0].explanation;
  return `${blockers.length} items are blocking progress: ${blockers.map((blocker) => blocker.title).join(", ")}.`;
}
