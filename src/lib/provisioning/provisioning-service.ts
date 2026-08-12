import "server-only";

import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { createAccountActivationToken } from "@/lib/auth/account-activation";
import { canonicalAppUrl, canonicalAppUrlIsPublic } from "@/lib/app-url";
import { deliverOutbound } from "@/lib/communications/outbound";
import {
  buyerRoleForModules,
  planProvisioning,
  provisioningKey,
  stepCompletableByPayment,
  type ProvisioningStep,
  type StepState,
} from "@/lib/provisioning/provisioning-rules";

/**
 * How long a claim is honoured before it is treated as abandoned.
 *
 * Long enough that a slow but living run is not overtaken, short enough that a crashed
 * worker delays a purchase by minutes rather than forever.
 */
const CLAIM_TIMEOUT_MS = 2 * 60 * 1000;

type Steps = Partial<Record<ProvisioningStep, StepState>>;

export type ProvisionInput = {
  source: "whop_membership" | "access_payment";
  reference: string;
  email: string;
  tierKey?: string;
  planKey?: string;
  clinicName?: string;
};

export type ProvisionResult = {
  provisioningKey: string;
  /**
   * `contended` means another worker holds this run's claim, so this caller did no work
   * and cannot say whether the purchase provisioned. Callers treat it like a failure —
   * retry — but it is recorded distinctly because nothing went wrong.
   */
  status: "complete" | "partial" | "failed" | "skipped" | "contended";
  organizationId: string | null;
  modules: string[];
  outstanding: string[];
  alreadyProvisioned: boolean;
  activation?: { userId: string; token: string; expiresAt: Date } | null;
};

export async function provisionFromPayment(input: ProvisionInput): Promise<ProvisionResult> {
  const key = provisioningKey({ source: input.source, reference: input.reference });
  const email = input.email.trim().toLowerCase();

  const existingUser = await db.user.findUnique({ where: { email }, select: { id: true, organizationId: true } });
  const existingOrganizationId = existingUser?.organizationId ?? null;
  const plan = planProvisioning({
    tierKey: input.tierKey,
    planKey: input.planKey,
    hasOrganization: Boolean(existingOrganizationId),
  });

  const initialSteps: Steps = Object.fromEntries(plan.steps.map((entry) => [entry.step, entry.state]));

  let run = await db.provisioningRun.findUnique({ where: { provisioningKey: key } });
  if (!run) {
    try {
      run = await db.provisioningRun.create({
        data: {
          provisioningKey: key,
          source: input.source,
          reference: input.reference,
          email,
          tierKey: input.tierKey ?? null,
          planKey: input.planKey ?? null,
          organizationId: existingOrganizationId,
          status: "pending",
          steps: initialSteps,
          modules: [...plan.modules],
          outstanding: [...plan.outstanding],
        },
      });
    } catch {
      run = await db.provisioningRun.findUnique({ where: { provisioningKey: key } });
    }
  }

  if (!run) {
    return { provisioningKey: key, status: "failed", organizationId: null, modules: [], outstanding: [], alreadyProvisioned: false, activation: null };
  }

  if (run.status === "complete") {
    const user = await db.user.findUnique({ where: { email }, select: { id: true, organizationId: true, authCredential: { select: { id: true } } } });
    const activation = user && !user.authCredential
      ? { ...(await createAccountActivationToken({ email, userId: user.id, organizationId: user.organizationId })), userId: user.id }
      : null;
    return {
      provisioningKey: key,
      status: "complete",
      organizationId: run.organizationId,
      modules: run.modules,
      outstanding: run.outstanding,
      alreadyProvisioned: true,
      activation,
    };
  }

  const steps: Steps = { ...(run.steps as Steps) };
  let subscriptionId = run.subscriptionId;

  // Take the claim before doing anything. `updateMany` with these conditions is the
  // lock: exactly one concurrent caller matches a row, and the others match none. The
  // stale-claim clause is what keeps a crashed worker from stranding the purchase —
  // an abandoned claim becomes takeable again after the timeout.
  const claimToken = randomUUID();
  const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS);
  const claimed = await db.provisioningRun.updateMany({
    where: {
      id: run.id,
      status: { not: "complete" },
      OR: [{ claimedAt: null }, { claimedAt: { lt: staleBefore } }],
    },
    data: { claimedAt: new Date(), claimedBy: claimToken, attempts: { increment: 1 } },
  });

  if (claimed.count === 0) {
    // Another worker is executing this run right now. Doing the work anyway is exactly
    // what created two tenants for one purchase, so this caller does nothing and says so.
    return {
      provisioningKey: key,
      status: "contended",
      organizationId: run.organizationId,
      modules: [...plan.modules],
      outstanding: [...plan.outstanding],
      alreadyProvisioned: false,
      activation: null,
    };
  }

  // Only read after the claim is held. Reading it earlier would use a snapshot the
  // previous holder may have moved on from.
  const held = await db.provisioningRun.findUnique({ where: { id: run.id }, select: { organizationId: true } });
  let organizationId = held?.organizationId ?? existingOrganizationId;

  try {
    let activation: ProvisionResult["activation"] = null;

    // Creating the organization and attaching the buyer to it happen together or not at
    // all. Separately, a failed attachment left behind an organization nobody could reach
    // — and writing that orphan's id onto the run poisoned every later retry, because the
    // buyer's real organization no longer matched.
    if (plan.modules.length > 0) {
      const attached = await attachBuyerToTenant({
        email,
        organizationId,
        clinicName: input.clinicName,
        roleKey: buyerRoleForModules(plan.modules),
      });
      organizationId = attached.organizationId;
      steps.organization = "complete";
      if (!attached.hasCredential) {
        activation = { ...(await createAccountActivationToken({ email, userId: attached.userId, organizationId })), userId: attached.userId };
      }
    } else if (needsWork(steps.organization)) {
      steps.organization = "complete";
    }

    if (needsWork(steps.subscription) && organizationId) {
      subscriptionId = await upsertSubscription(organizationId, input.planKey ?? input.tierKey ?? "klinikos", [...plan.modules]);
      steps.subscription = "complete";
    }

    if (needsWork(steps.entitlements) && organizationId) {
      const stored = await db.clinicSubscription.findFirst({
        where: { organizationId, status: { in: ["active", "trialing"] } },
        select: { modules: true },
      });
      steps.entitlements = stored && plan.modules.every((module) => stored.modules.includes(module)) ? "complete" : "blocked";
    }

    if (needsWork(steps.onboarding) && organizationId) steps.onboarding = "complete";

    if (input.source === "whop_membership" && organizationId) {
      await db.whopEntitlement.updateMany({ where: { whopMembershipId: input.reference, organizationId: null }, data: { organizationId } }).catch(() => undefined);
    }

    const status = deriveStatus(steps);
    await db.provisioningRun.update({
      where: { id: run.id },
      data: {
        organizationId,
        subscriptionId,
        steps,
        status,
        completedAt: status === "complete" ? new Date() : null,
        failureReason: null,
        claimedAt: null,
        claimedBy: null,
      },
    });

    return {
      provisioningKey: key,
      status: status === "complete" ? "complete" : "partial",
      organizationId,
      modules: [...plan.modules],
      outstanding: [...plan.outstanding],
      alreadyProvisioned: false,
      activation,
    };
  } catch (error) {
    // The claim is released so a retry can proceed. `organizationId` is deliberately not
    // written: on this path the buyer may not be attached to it, and persisting an
    // organization the buyer does not belong to is what made retries fail forever.
    await db.provisioningRun.update({
      where: { id: run.id },
      data: {
        subscriptionId,
        steps,
        status: "failed",
        failureReason: error instanceof Error ? error.message.slice(0, 300) : "unknown error",
        claimedAt: null,
        claimedBy: null,
      },
    }).catch(() => undefined);

    return { provisioningKey: key, status: "failed", organizationId, modules: [...plan.modules], outstanding: [...plan.outstanding], alreadyProvisioned: false, activation: null };
  }
}

function needsWork(state: StepState | undefined) {
  return state === "pending" || state === "in_progress";
}

function deriveStatus(steps: Steps): "complete" | "partial" {
  const unfinished = Object.entries(steps).filter(([step, state]) => {
    if (!stepCompletableByPayment(step as ProvisioningStep)) return false;
    return state === "pending" || state === "in_progress";
  });
  return unfinished.length === 0 ? "complete" : "partial";
}

/**
 * Put the buyer inside a tenant, creating one only if they do not already have it.
 *
 * One transaction, deliberately. Previously the organization was created by one
 * statement and the buyer attached by another, so a failed attachment left an
 * unreachable organization behind — and the id of that orphan then got written onto the
 * shared provisioning run, after which every retry read it and failed the
 * cross-organization identity check forever.
 *
 * Idempotent on the buyer's email, which is unique. A concurrent create loses that
 * constraint and rolls the whole transaction back, including the organization, so the
 * loser leaves nothing behind to clean up.
 */
async function attachBuyerToTenant(input: {
  email: string;
  organizationId: string | null;
  clinicName?: string;
  roleKey: "clinic_owner" | "contractor";
}) {
  return db.$transaction(async (tx) => {
    // Re-read inside the transaction. The caller's view may predate another worker
    // finishing, and an email that now exists must be honoured rather than duplicated.
    const existing = await tx.user.findUnique({
      where: { email: input.email },
      select: { id: true, organizationId: true, authCredential: { select: { id: true } } },
    });

    if (existing) {
      // Moving someone between tenants is not something a payment webhook may do.
      if (input.organizationId && existing.organizationId !== input.organizationId) {
        throw new Error("Buyer identity is already attached to another organization.");
      }
      return {
        organizationId: existing.organizationId,
        userId: existing.id,
        hasCredential: Boolean(existing.authCredential),
      };
    }

    const organizationId = input.organizationId ?? (await createOrganization(input.email, input.clinicName, tx));
    const user = await tx.user.create({
      data: {
        organizationId,
        email: input.email,
        name: input.email.split("@")[0] || "Klinikos member",
        roleKey: input.roleKey,
        status: "active",
      },
      select: { id: true },
    });

    return { organizationId, userId: user.id, hasCredential: false };
  });
}

/**
 * Get the activation link to the buyer.
 *
 * Routed through the outbound port, so the result is what a provider actually said. If
 * no email provider is configured the link is *not* reported as sent: the run records
 * that it is undelivered, and an operator can reissue it. A buyer who never receives
 * this cannot sign in, so silently losing it is the failure this function exists to
 * make visible.
 */
export async function deliverActivation(input: { email: string; token: string; provisioningKey: string }) {
  // A link with no host is not a link. Refusing here means the run records the problem
  // as an undelivered activation an operator can see and reissue, rather than the email
  // provider accepting a message whose only useful content is unusable.
  if (!canonicalAppUrlIsPublic()) {
    await db.provisioningRun
      .update({
        where: { provisioningKey: input.provisioningKey },
        data: {
          activationDeliveredAt: null,
          activationDeliveryFailure: "No public application URL is configured, so the activation link would not resolve.",
        },
      })
      .catch(() => undefined);
    return { ok: false as const, reason: "provider_error" as const, detail: "No public application URL is configured." };
  }

  const link = `${canonicalAppUrl()}/activate?token=${encodeURIComponent(input.token)}`;
  const outcome = await deliverOutbound({
    channel: "email",
    to: input.email,
    subject: "Set your Klinikos password",
    body: [
      "Your Klinikos access is ready.",
      "",
      "Choose a password to finish setting up your account:",
      link,
      "",
      "This link expires in 24 hours. If it has expired, ask Klinikos to send a new one.",
    ].join("\n"),
  });

  await db.provisioningRun
    .update({
      where: { provisioningKey: input.provisioningKey },
      data: {
        activationDeliveredAt: outcome.ok ? new Date() : null,
        activationDeliveryFailure: outcome.ok ? null : outcome.detail,
      },
    })
    .catch(() => undefined);

  return outcome;
}

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

async function createOrganization(email: string, clinicName: string | undefined, tx: TxClient) {
  const name = clinicName?.trim() || `${email.split("@")[0]} Clinic`;
  const slug = await uniqueSlug(name, tx);
  const organization = await tx.organization.create({
    data: { name, slug, clinicType: "independent_clinic", status: "active", demoMode: true },
    select: { id: true },
  });
  return organization.id;
}

async function uniqueSlug(name: string, tx: TxClient) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "clinic";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 7)}`;
    const taken = await tx.organization.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function upsertSubscription(organizationId: string, planKey: string, modules: string[]) {
  const existing = await db.clinicSubscription.findFirst({
    where: { organizationId },
    select: { id: true, modules: true },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const merged = [...new Set([...existing.modules, ...modules])];
    await db.clinicSubscription.update({
      where: { id: existing.id },
      data: { planKey, status: "active", modules: merged },
    });
    return existing.id;
  }

  const created = await db.clinicSubscription.create({
    data: { organizationId, planKey, status: "active", modules },
    select: { id: true },
  });
  return created.id;
}

export async function provisioningStatusForEmail(email: string) {
  const run = await db.provisioningRun.findFirst({
    where: { email: email.trim().toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
  if (!run) return null;
  return {
    status: run.status,
    steps: run.steps as Steps,
    modules: run.modules,
    outstanding: run.outstanding,
    organizationId: run.organizationId,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
  };
}


/**
 * Withdraw the capabilities a purchase granted, when the purchase stops being valid.
 *
 * Provisioning had only one direction. A membership that went invalid revoked the
 * `WhopEntitlement` while the `ClinicSubscription` it created stayed active with no end
 * date — and entitlements are resolved from the subscription, so a cancelled buyer kept
 * every paid capability indefinitely.
 *
 * What this does **not** do is delete anything. The organization, its users, and its
 * records survive; only the paid modules stop. Losing access to capabilities is the
 * lever a lapsed subscription pulls. Losing a clinic's data is not.
 */
export async function revokeProvisionedAccess(input: {
  source: "whop_membership" | "access_payment";
  reference: string;
  /** `revoked` ends access now; `grace` keeps it while billing is retried. */
  state: "revoked" | "grace";
}) {
  const key = provisioningKey({ source: input.source, reference: input.reference });
  const run = await db.provisioningRun.findUnique({
    where: { provisioningKey: key },
    select: { organizationId: true, subscriptionId: true },
  });
  if (!run?.organizationId) return { ok: false as const, reason: "not_provisioned" as const };

  // Grace is a billing state, not a revocation. `entitlementsFromSubscriptions` already
  // withholds paid capabilities from a `past_due` subscription, so marking the status is
  // the whole change — there is nothing to strip.
  const status = input.state === "grace" ? "past_due" : "canceled";

  const updated = await db.clinicSubscription.updateMany({
    where: run.subscriptionId
      ? { id: run.subscriptionId }
      : { organizationId: run.organizationId, status: { in: ["active", "trialing", "past_due"] } },
    data: {
      status,
      // A definite end date is what stops a stale `status` column from granting
      // capabilities forever if a later webhook never arrives.
      currentPeriodEndsAt: input.state === "revoked" ? new Date() : undefined,
    },
  });

  return { ok: true as const, organizationId: run.organizationId, subscriptionsUpdated: updated.count, status };
}
