import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import { orchestrationRoleKeys, permissionKeysForRole } from "@/lib/auth/permission-keys";
import type { ActorContext, KlinikosContextKind } from "@/lib/orchestration/contracts";
import { orchestrateGoal, orchestrateQualityAssurance } from "@/lib/orchestration/orchestrator";
import type { GovernedRuleEvaluation } from "@/lib/orchestration/rules-evidence-engine";
import type { ZumiPresence } from "@/features/zumi/presence";

function contextKindForPresence(presence: ZumiPresence): KlinikosContextKind {
  const pathname = presence.pathname ?? "";
  if (presence.surface === "patient_portal" || /^\/patients?(?:\/|$)/.test(pathname)) return "patient";
  if (presence.surface === "grid" || pathname.startsWith("/grid")) return "grid";
  if (pathname.startsWith("/edu")) return "edu";
  if (presence.surface === "platform" || presence.surface === "clinic_portal" || presence.surface === "provider_portal") return "clinic";
  return "personal";
}

function trustedActorContext(session: ClinicSession, contextKind: KlinikosContextKind): ActorContext {
  return {
    actorId: session.userId,
    actorKind: "user",
    userId: session.userId,
    organizationId: session.organizationId,
    contextKind,
    roleKeys: orchestrationRoleKeys(session.role),
    permissionKeys: permissionKeysForRole(session.role),
  };
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

export type ZumiTrustedQualityAssurance = {
  available: boolean;
  snapshot: {
    evaluated: number;
    applicable: number;
    satisfied: number;
    openGaps: number;
    reviewRequired: number;
    overdue: number;
    dueSoon: number;
  } | null;
  internalCapabilityAvailable: boolean | null;
  nextActions: Array<{
    title: string;
    reason: string;
    capabilityKey: string | null;
    href: string | null;
    state: string;
    priority: number;
    blockers: string[];
  }>;
  expertNeeds: Array<{
    capabilityKey: string;
    capabilityDomain: string;
    urgency: string;
    requiredDataAccessClass: string;
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
    context: trustedActorContext(input.session, contextKindForPresence(input.presence)),
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

/**
 * Bridge already-authorized deterministic quality evaluations into Zumi. This
 * function intentionally returns aggregate state and safe action metadata rather
 * than subject identifiers or evidence references. The caller remains responsible
 * for retrieving the evaluations through the canonical tenant/RBAC repository path.
 */
export function resolveTrustedZumiQualityAssurance(input: {
  session: ClinicSession;
  evaluations: readonly GovernedRuleEvaluation[];
  internalQualityCapabilityAvailable: boolean;
  jurisdictionKey?: string | null;
  requiredExpertEvidenceKeys?: string[];
  requiredAgreementEvidenceKeys?: string[];
}): ZumiTrustedQualityAssurance {
  const result = orchestrateQualityAssurance({
    context: trustedActorContext(input.session, "clinic"),
    evaluations: input.evaluations,
    internalQualityCapabilityAvailable: input.internalQualityCapabilityAvailable,
    jurisdictionKey: input.jurisdictionKey,
    requiredExpertEvidenceKeys: input.requiredExpertEvidenceKeys,
    requiredAgreementEvidenceKeys: input.requiredAgreementEvidenceKeys,
    connectedConnectorIds: [],
  });

  if (!result.ok || !result.value) {
    return {
      available: false,
      snapshot: null,
      internalCapabilityAvailable: null,
      nextActions: [],
      expertNeeds: [],
      blockers: [],
      warnings: [...result.warnings, ...result.errors],
    };
  }

  return {
    available: true,
    snapshot: { ...result.value.snapshot },
    internalCapabilityAvailable: result.value.internalCapabilityAvailable,
    nextActions: result.value.nextActions.map((action) => ({
      title: action.title,
      reason: action.reason,
      capabilityKey: action.capabilityKey ?? null,
      href: action.href ?? null,
      state: action.state,
      priority: action.priority,
      blockers: [...action.blockers],
    })),
    expertNeeds: result.value.expertNeeds.map((need) => ({
      capabilityKey: need.capabilityKey,
      capabilityDomain: need.capabilityDomain,
      urgency: need.urgency,
      requiredDataAccessClass: need.requiredDataAccessClass,
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

export function trustedQualityAssuranceInstruction(quality: ZumiTrustedQualityAssurance | null) {
  if (!quality) return "Trusted Quality Guardian context was not supplied for this turn. Do not invent quality-gap counts, compliance status, or expert requirements.";
  if (!quality.available || !quality.snapshot) {
    return `Trusted Quality Guardian context is unavailable for this turn. Do not infer quality state. Warnings: ${quality.warnings.join("; ") || "none"}.`;
  }

  const snapshot = quality.snapshot;
  return [
    "Trusted Quality Guardian result:",
    `Evaluated=${snapshot.evaluated}; applicable=${snapshot.applicable}; satisfied=${snapshot.satisfied}; open gaps=${snapshot.openGaps}; review required=${snapshot.reviewRequired}; overdue=${snapshot.overdue}; due soon=${snapshot.dueSoon}.`,
    `Internal quality capability available=${quality.internalCapabilityAvailable ? "yes" : "no"}.`,
    quality.nextActions.length
      ? `Governed quality next actions: ${quality.nextActions.map((action) => `${action.title} [${action.state}]${action.capabilityKey ? ` capability=${action.capabilityKey}` : ""}`).join("; ")}.`
      : "No governed quality next actions were produced.",
    quality.expertNeeds.length
      ? `Expert Grid needs: ${quality.expertNeeds.map((need) => `${need.capabilityDomain}/${need.capabilityKey} urgency=${need.urgency} access=${need.requiredDataAccessClass}`).join("; ")}. A need is not an engagement and grants no data access.`
      : "No Expert Grid escalation was produced.",
    quality.blockers.length ? `Quality blockers: ${quality.blockers.map((blocker) => `${blocker.title}: ${blocker.explanation}`).join("; ")}.` : "No quality blockers were produced.",
    "These are deterministic operational states from the supplied authorized evaluation set. They are not a blanket claim of CMS, NCQA, HEDIS, payer-program, or legal compliance. Never let model prose close a rule or bypass human review.",
  ].join("\n");
}
