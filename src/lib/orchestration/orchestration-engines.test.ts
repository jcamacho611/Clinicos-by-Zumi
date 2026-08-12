import { describe, expect, it } from "vitest";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { rankMatches, requiredEligibilityDimension, availabilityOverlap, distanceScore } from "@/lib/orchestration/matching-engine";
import { advancePathSnapshot, resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import { nextActionsFromPath, rankNextActions } from "@/lib/orchestration/next-action-engine";
import { blockersFromPolicy } from "@/lib/orchestration/blocker-engine";
import { collapseSignals, signalFromEvent } from "@/lib/orchestration/event-engine";
import { switchActorContext, contextsAreDataIsolated } from "@/lib/orchestration/context-engine";
import { neighbors, scopeGraphToOrganization, shortestPath } from "@/lib/orchestration/graph-engine";
import { canDispatchNotification, notificationFromEvent } from "@/lib/orchestration/notification-engine";
import { calculateFinancialObligation, transitionFinancialObligation } from "@/lib/orchestration/financial-engine";
import { canReserveTransaction, transitionTransaction, type TransactionRecord } from "@/lib/orchestration/transaction-engine";
import { decideReview, reviewQueue, type HumanReviewItem } from "@/lib/orchestration/human-review-engine";
import { nextConnectorActivationState } from "@/lib/orchestration/connector-entitlement-engine";
import { createWorkflowJob, failWorkflowJob, startWorkflowJob, succeedWorkflowJob } from "@/lib/orchestration/workflow-engine";
import { searchAuthorizedRecords } from "@/lib/orchestration/search-engine";
import { pathConversionRate, timeToOutcome } from "@/lib/orchestration/telemetry-engine";
import type { ActorContext, DomainEvent, NextAction } from "@/lib/orchestration/contracts";

describe("Klinikos orchestration engines", () => {
  it("resolves a clinic staffing intent into the staffing Path without model authority", () => {
    const intent = resolveIntentDeterministically("I need an injector Saturday in Brooklyn");
    expect(intent.actor).toBe("clinic");
    expect(intent.candidatePathIds[0]).toBe("fill-staffing-need");
    expect(intent.timing?.toLowerCase()).toContain("saturday");
    expect(intent.location).toBe("Brooklyn");
    expect(intent.requiresClarification).toBe(false);
  });

  it("keeps unknown intent explicit instead of inventing a Path", () => {
    const intent = resolveIntentDeterministically("Help me with something unusual");
    expect(intent.actor).toBe("unknown");
    expect(intent.candidatePathIds).toEqual([]);
    expect(intent.requiresClarification).toBe(true);
  });

  it("hydrates and advances a Path runtime from a persisted snapshot", () => {
    const snapshot: PersistedPathSnapshot = {
      instanceId: "path-1",
      pathId: "fill-staffing-need",
      goal: "Cover Saturday",
      status: "active",
      completedNodeIds: ["need"],
      blockedNodeIds: [],
      currentNodeId: "matches",
      blockers: [],
    };

    const runtime = resolvePathRuntime({ pathId: snapshot.pathId, snapshot });
    expect(runtime?.progress).toBe(0.25);
    expect(runtime?.currentNodeId).toBe("matches");

    const advanced = advancePathSnapshot({ snapshot, completedNodeId: "matches" });
    expect(advanced.completedNodeIds).toContain("matches");
    expect(advanced.currentNodeId).toBe("availability");
  });

  it("turns the current Path node into a ranked Next Action", () => {
    const runtime = resolvePathRuntime({ pathId: "fix-referral-leakage" });
    expect(runtime).not.toBeNull();
    const actions = nextActionsFromPath(runtime!);
    expect(actions[0]?.title).toBe("Find open loops");
    expect(actions[0]?.state).toBe("recommended");
  });

  it("prioritizes urgent care workflow actions over lower-weight general actions", () => {
    const now = new Date("2026-08-12T12:00:00Z");
    const actions: NextAction[] = [
      { id: "a", title: "Continue learning", reason: "Path", sourceType: "edu", state: "available", priority: 0, blockers: [] },
      { id: "b", title: "Review result", reason: "Clinical result", sourceType: "result", state: "available", priority: 0, dueAt: new Date("2026-08-12T13:00:00Z"), blockers: [] },
    ];
    expect(rankNextActions(actions, now)[0]?.id).toBe("b");
  });

  it("keeps ineligible candidates below eligible candidates regardless of score", () => {
    const candidates = [
      { id: "eligible", eligible: true, quality: 0.5 },
      { id: "blocked", eligible: false, quality: 1 },
    ];
    const ranked = rankMatches({
      candidates,
      dimensions: [
        requiredEligibilityDimension((candidate) => ({ eligible: candidate.eligible, reasons: candidate.eligible ? [] : ["Credential missing"] })),
        { key: "quality", weight: 100, evaluate: (candidate) => ({ pass: true, score: candidate.quality, reason: "Quality score" }) },
      ],
    });
    expect(ranked[0]?.id).toBe("eligible");
    expect(ranked[1]?.blockers).toContain("Credential missing");
  });

  it("computes overlap and distance without treating unknown distance as a match", () => {
    expect(availabilityOverlap({
      requestedStart: new Date("2026-08-15T12:00:00Z"),
      requestedEnd: new Date("2026-08-15T18:00:00Z"),
      availableStart: new Date("2026-08-15T12:00:00Z"),
      availableEnd: new Date("2026-08-15T15:00:00Z"),
    })).toBe(0.5);
    expect(distanceScore(null, 10)).toBe(0);
    expect(distanceScore(5, 10)).toBe(0.5);
  });

  it("converts connector policy failures into actionable fallback blockers", () => {
    const blockers = blockersFromPolicy({
      state: "blocked",
      reasons: ["Connector unavailable"],
      missingRoles: [],
      missingPermissions: [],
      missingConnectors: ["stripe"],
      requiredConfirmations: [],
    });
    expect(blockers[0]?.owner).toBe("connector");
    expect(blockers[0]?.alternatives[0]?.title).toMatch(/manual fallback/i);
  });

  it("turns domain events into collapsible Moving signals", () => {
    const base: DomainEvent = {
      id: "e1",
      type: "grid_match_available",
      organizationId: "org-1",
      sourceType: "grid",
      severity: "attention",
      occurredAt: new Date("2026-08-12T12:00:00Z"),
      payload: { label: "Grid opportunities", value: 1, detail: "New match", href: "/grid" },
    };
    const second: DomainEvent = { ...base, id: "e2", occurredAt: new Date("2026-08-12T12:05:00Z") };
    const collapsed = collapseSignals([signalFromEvent(base), signalFromEvent(second)]);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]?.value).toBe(2);
  });

  it("switches context only to active memberships and isolates organizations", () => {
    const context = switchActorContext({
      actorId: "person-1",
      contextKind: "clinic",
      organizationId: "org-a",
      memberships: [{ actorId: "person-1", userId: "user-1", organizationId: "org-a", contextKind: "clinic", roleKeys: ["owner"], permissionKeys: ["clinic.read"], status: "active" }],
    });
    expect(context?.organizationId).toBe("org-a");
    const other: ActorContext = { ...context!, organizationId: "org-b" };
    expect(contextsAreDataIsolated(context!, other)).toBe(true);
  });

  it("traverses the healthcare relationship graph without leaking another organization", () => {
    const graph = {
      nodes: [
        { id: "person", kind: "person" as const, label: "Person", organizationId: "org-a" },
        { id: "provider", kind: "provider" as const, label: "Provider", organizationId: "org-a" },
        { id: "opp", kind: "opportunity" as const, label: "Opportunity", organizationId: "org-a" },
        { id: "other", kind: "patient" as const, label: "Other", organizationId: "org-b" },
      ],
      edges: [
        { id: "e1", fromId: "person", toId: "provider", type: "is_provider", organizationId: "org-a" },
        { id: "e2", fromId: "provider", toId: "opp", type: "matches", organizationId: "org-a" },
        { id: "e3", fromId: "provider", toId: "other", type: "unrelated", organizationId: "org-b" },
      ],
    };
    const scoped = scopeGraphToOrganization(graph, "org-a");
    expect(neighbors(scoped, "provider").map((node) => node.id).sort()).toEqual(["opp", "person"]);
    expect(shortestPath(scoped, "person", (node) => node.kind === "opportunity").map((node) => node.id)).toEqual(["person", "provider", "opp"]);
  });

  it("blocks PHI notifications on unapproved channels", () => {
    const event: DomainEvent = { id: "e3", type: "result_ready", sourceType: "result", severity: "attention", occurredAt: new Date(), payload: { label: "Result ready", detail: "Review required" } };
    const notification = notificationFromEvent({ event, recipientId: "user-1", channel: "sms", containsPhi: true });
    expect(canDispatchNotification({ notification, phiApprovedChannels: ["in_app"] }).allowed).toBe(false);
  });

  it("requires human approval and verified payment evidence for financial completion", () => {
    const obligation = calculateFinancialObligation({ id: "fo-1", transactionType: "grid_shift", payerId: "clinic", payeeId: "provider", grossAmountCents: 10000, processorFeeCents: 300, reason: "Completed Grid work", feeRules: [{ key: "platform", applies: () => true, calculateCents: () => 1000 }] });
    expect(obligation.netAmountCents).toBe(8700);
    const due = transitionFinancialObligation({ obligation, nextState: "due", humanApproved: true });
    const authorized = transitionFinancialObligation({ obligation: due, nextState: "authorized" });
    expect(() => transitionFinancialObligation({ obligation: authorized, nextState: "paid", paymentVerified: false })).toThrow(/verified/i);
    expect(transitionFinancialObligation({ obligation: authorized, nextState: "paid", paymentVerified: true }).state).toBe("paid");
  });

  it("prevents overlapping reservations and requires fulfillment before transaction completion", () => {
    const base: TransactionRecord = { id: "t1", type: "grid_shift", requesterId: "clinic", fulfillerId: "provider", resourceId: "provider", state: "accepted", startsAt: new Date("2026-08-15T12:00:00Z"), endsAt: new Date("2026-08-15T18:00:00Z"), createdAt: new Date(), updatedAt: new Date() };
    const candidate: TransactionRecord = { ...base, id: "t2", startsAt: new Date("2026-08-15T16:00:00Z"), endsAt: new Date("2026-08-15T20:00:00Z") };
    expect(canReserveTransaction({ candidate, existing: [base] }).allowed).toBe(false);
    const reserved = transitionTransaction({ transaction: base, nextState: "reserved" });
    const inProgress = transitionTransaction({ transaction: reserved, nextState: "in_progress" });
    const fulfilled = transitionTransaction({ transaction: inProgress, nextState: "fulfilled" });
    expect(() => transitionTransaction({ transaction: fulfilled, nextState: "completed", fulfillmentConfirmed: false })).toThrow(/fulfillment/i);
  });

  it("orders human review by risk and records a reasoned decision", () => {
    const low: HumanReviewItem = { id: "r1", subjectType: "document", subjectId: "d1", actionKey: "release", riskClass: "review", requestedBy: "u1", reason: "Release", state: "pending", evidenceRefs: [], requestedAt: new Date("2026-08-12T12:00:00Z") };
    const high: HumanReviewItem = { ...low, id: "r2", riskClass: "regulated", subjectId: "credential" };
    expect(reviewQueue([low, high])[0]?.id).toBe("r2");
    expect(decideReview({ item: high, reviewerId: "reviewer", decision: "approved", reason: "Primary source verified" }).state).toBe("approved");
  });

  it("keeps connector activation grounded in external readiness", () => {
    expect(nextConnectorActivationState({ current: "entitled", externalRequirementsSatisfied: false, manualFallbackAvailable: true })).toBe("manual_fallback");
    expect(nextConnectorActivationState({ current: "entitled", externalRequirementsSatisfied: true, manualFallbackAvailable: false })).toBe("production_ready");
  });

  it("retries workflow jobs with backoff and dead-letters exhausted work", () => {
    const now = new Date("2026-08-12T12:00:00Z");
    const job = createWorkflowJob({ id: "j1", type: "connector.sync", payload: {}, maxAttempts: 2, runAfter: now, now });
    const running = startWorkflowJob(job, now);
    const waiting = failWorkflowJob({ job: running, error: "timeout", now, baseDelayMs: 1000 });
    expect(waiting.state).toBe("waiting");
    const runningAgain = startWorkflowJob({ ...waiting, runAfter: now }, now);
    const dead = failWorkflowJob({ job: runningAgain, error: "timeout", now });
    expect(dead.state).toBe("dead_letter");
    expect(succeedWorkflowJob({ ...runningAgain, state: "running" }, now).state).toBe("succeeded");
  });

  it("filters command search by organization before ranking results", () => {
    const context: ActorContext = { actorId: "u1", actorKind: "user", userId: "u1", organizationId: "org-a", contextKind: "clinic", roleKeys: ["owner"], permissionKeys: [] };
    const results = searchAuthorizedRecords({ context, query: "referral", records: [
      { id: "a", type: "referral", title: "Referral queue", keywords: ["stuck"], href: "/referrals", organizationId: "org-a" },
      { id: "b", type: "referral", title: "Referral queue", keywords: ["stuck"], href: "/referrals", organizationId: "org-b" },
    ] });
    expect(results.map((record) => record.id)).toEqual(["a"]);
  });

  it("measures path conversion and intent-to-outcome duration", () => {
    const events = [
      { id: "o1", type: "intent_captured" as const, actorId: "u1", pathInstanceId: "p1", occurredAt: new Date("2026-08-12T12:00:00Z"), metadata: {} },
      { id: "o2", type: "path_started" as const, actorId: "u1", pathInstanceId: "p1", occurredAt: new Date("2026-08-12T12:01:00Z"), metadata: {} },
      { id: "o3", type: "path_completed" as const, actorId: "u1", pathInstanceId: "p1", occurredAt: new Date("2026-08-12T13:00:00Z"), metadata: {} },
    ];
    expect(pathConversionRate(events)).toBe(1);
    expect(timeToOutcome({ events, actorId: "u1", pathInstanceId: "p1", outcomeTypes: ["path_completed"] })?.durationMs).toBe(3_600_000);
  });
});
