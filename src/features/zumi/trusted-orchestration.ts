import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { orchestrationRoleKeys, permissionKeysForRole } from "@/lib/auth/permission-keys";
import type { KlinikosContextKind } from "@/lib/orchestration/contracts";
import { orchestrateGoal } from "@/lib/orchestration/orchestrator";
import type { ZumiPresence } from "@/features/zumi/presence";

function contextKindForPresence(presence: ZumiPresence): KlinikosContextKind {
  const pathname = presence.pathname ?? "";
  if (presence.surface === "patient_portal" || /^\/patients?(?:\/|$)/.test(pathname)) return "patient";
  if (presence.surface === "grid" || pathname.startsWith("/grid")) return "grid";
  if (pathname.startsWith("/edu")) return "edu";
  if (presence.surface === "platform" || presence.surface === "clinic_portal" || presence.surface === "provider_portal") return "clinic";
  return "personal";
}

export type ZumiTrustedOrchestration = {
  available: boolean;
  intent: {
    goal: string;
    outcome: string;
    candidatePathIds: string[];
    confidence: number;
    requiresClarification: boolean;
    clarificationQuestions: string[];
  } | null;
  path: {
    pathId: string;
    title: string;
    status: string;
    progress: number;
    blockers: string[];
  } | null;
  nextActions: Array<{
    id: string;
    title: string;
    reason: string;
    capabilityKey: string | null;
    href: string | null;
    state: string;
    priority: number;
    blockers: string[];
  }>;
  blockers: Array<{ code: string; title: string; explanation: string; owner: string; canResolveNow: boolean }>;
  warnings: string[];
};

/**
 * Resolve natural language through the platform's deterministic orchestration suite.
 * No connector is marked connected merely because an environment variable exists;
 * connector-required actions therefore remain blocked until a real connection state
 * source is wired into this bridge.
 */
export async function resolveTrustedZumiOrchestration(input: {
  session: ClinicSession;
  question: string;
  presence: ZumiPresence;
}): Promise<ZumiTrustedOrchestration> {
  const result = await orchestrateGoal({
    rawIntent: input.question,
    context: {
      actorId: input.session.userId,
      actorKind: "user",
      userId: input.session.userId,
      organizationId: input.session.organizationId,
      contextKind: contextKindForPresence(input.presence),
      roleKeys: orchestrationRoleKeys(input.session.role),
      permissionKeys: permissionKeysForRole(input.session.role),
    },
    // Intent interpretation deliberately starts with the deterministic engine. A
    // future model interpreter must still pass the trusted schema/path filters.
    interpreter: null,
    // Configuration is not proof of a connected/authorized connector.
    connectedConnectorIds: [],
  });

  if (!result.ok || !result.value) {
    return {
      available: false,
      intent: null,
      path: null,
      nextActions: [],
      blockers: [],
      warnings: [...result.warnings, ...result.errors],
    };
  }

  return {
    available: true,
    intent: {
      goal: result.value.intent.goal,
      outcome: result.value.intent.outcome,
      candidatePathIds: [...result.value.intent.candidatePathIds],
      confidence: result.value.intent.confidence,
      requiresClarification: result.value.intent.requiresClarification,
      clarificationQuestions: [...result.value.intent.clarificationQuestions],
    },
    path: result.value.path
      ? {
          pathId: result.value.path.pathId,
          title: result.value.path.title,
          status: result.value.path.status,
          progress: result.value.path.progress,
          blockers: [...result.value.path.blockers],
        }
      : null,
    nextActions: result.value.nextActions.map((action) => ({
      id: action.id,
      title: action.title,
      reason: action.reason,
      capabilityKey: action.capabilityKey ?? null,
      href: action.href ?? null,
      state: action.state,
      priority: action.priority,
      blockers: [...action.blockers],
    })),
    blockers: result.value.blockers.map((blocker) => ({
      code: blocker.code,
      title: blocker.title,
      explanation: blocker.explanation,
      owner: blocker.owner,
      canResolveNow: blocker.canResolveNow,
    })),
    warnings: [...result.value.warnings],
  };
}

export function trustedOrchestrationInstruction(orchestration: ZumiTrustedOrchestration) {
  if (!orchestration.available) {
    return `Trusted Klinikos orchestration could not resolve a path for this turn. Do not invent one. Warnings: ${orchestration.warnings.join("; ") || "none"}.`;
  }

  return [
    "Trusted Klinikos orchestration result:",
    orchestration.intent ? `Intent goal: ${orchestration.intent.goal}. Outcome: ${orchestration.intent.outcome}. Confidence: ${orchestration.intent.confidence}.` : "No structured intent was resolved.",
    orchestration.path ? `Trusted path: ${orchestration.path.pathId} (${orchestration.path.title}), status=${orchestration.path.status}, progress=${orchestration.path.progress}.` : "No trusted path matched.",
    orchestration.nextActions.length
      ? `Trusted next actions: ${orchestration.nextActions.map((action) => `${action.title} [${action.state}]${action.capabilityKey ? ` capability=${action.capabilityKey}` : ""}`).join("; ")}.`
      : "No trusted next actions were produced.",
    orchestration.blockers.length ? `Trusted blockers: ${orchestration.blockers.map((blocker) => `${blocker.title}: ${blocker.explanation}`).join("; ")}.` : "No trusted blockers were produced.",
    "These deterministic path/action states outrank model suggestions. Never describe a blocked or review-required action as executable now.",
  ].join("\n");
}
