import "server-only";

import { db } from "@/lib/db";
import {
  planProvisioning,
  provisioningKey,
  stepCompletableByPayment,
  type ProvisioningStep,
  type StepState,
} from "@/lib/provisioning/provisioning-rules";

/**
 * Payment-driven provisioning.
 *
 * Turns a *verified* payment into a usable clinic: an organization, a subscription
 * carrying the purchased modules, and an onboarding run. Called only from the webhook
 * path, never from a browser redirect.
 *
 * The four properties the constitution requires of this path:
 *
 *   - **Idempotent.** Keyed on the payment's own identity, so Whop's redelivery —
 *     which is the normal case, not the exception — resolves to the same row.
 *   - **Retry-safe.** Step state is stored per step, so a run that fails halfway
 *     resumes rather than repeating work.
 *   - **Auditable.** Every run and every step transition is a durable record.
 *   - **Tenant-scoped.** Every write names the organization it belongs to.
 *
 * What it will not do: complete a step payment cannot complete. Connections and
 * regulated review are left blocked with the reason attached, because a clinic told
 * its lab connection is "active" when nobody has signed anything is a clinic that has
 * been lied to.
 */

type Steps = Partial<Record<ProvisioningStep, StepState>>;

export type ProvisionInput = {
  source: "whop_membership" | "access_payment";
  /** The payment's own identifier. Membership id, or payment reference. */
  reference: string;
  email: string;
  tierKey?: string;
  planKey?: string;
  clinicName?: string;
};

export type ProvisionResult = {
  provisioningKey: string;
  status: "complete" | "partial" | "failed" | "skipped";
  organizationId: string | null;
  modules: string[];
  outstanding: string[];
  /** True when this call did nothing because the purchase was already provisioned. */
  alreadyProvisioned: boolean;
};

export async function provisionFromPayment(input: ProvisionInput): Promise<ProvisionResult> {
  const key = provisioningKey({ source: input.source, reference: input.reference });
  const email = input.email.trim().toLowerCase();

  const existingOrganizationId = await findOrganizationForEmail(email);
  const plan = planProvisioning({
    tierKey: input.tierKey,
    planKey: input.planKey,
    hasOrganization: Boolean(existingOrganizationId),
  });

  const initialSteps: Steps = Object.fromEntries(plan.steps.map((entry) => [entry.step, entry.state]));

  // Claim the run. `create` on a unique key is the lock: a concurrent redelivery
  // loses the race and reads the existing row instead of provisioning in parallel.
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
    return { provisioningKey: key, status: "failed", organizationId: null, modules: [], outstanding: [], alreadyProvisioned: false };
  }

  if (run.status === "complete") {
    return {
      provisioningKey: key,
      status: "complete",
      organizationId: run.organizationId,
      modules: run.modules,
      outstanding: run.outstanding,
      alreadyProvisioned: true,
    };
  }

  const steps: Steps = { ...(run.steps as Steps) };
  let organizationId = run.organizationId ?? existingOrganizationId;
  let subscriptionId = run.subscriptionId;

  await db.provisioningRun.update({ where: { id: run.id }, data: { attempts: { increment: 1 } } });

  try {
    if (needsWork(steps.organization)) {
      organizationId = organizationId ?? (await createOrganization(email, input.clinicName));
      steps.organization = "complete";
    }

    if (needsWork(steps.subscription) && organizationId) {
      subscriptionId = await upsertSubscription(organizationId, input.planKey ?? input.tierKey ?? "klinikos", [...plan.modules]);
      steps.subscription = "complete";
    }

    if (needsWork(steps.entitlements) && organizationId) {
      // Modules live on the subscription, so this step is the assertion that they
      // landed rather than a second write. Verifying is cheap; assuming is not.
      const stored = await db.clinicSubscription.findFirst({
        where: { organizationId, status: { in: ["active", "trialing"] } },
        select: { modules: true },
      });
      steps.entitlements = stored && plan.modules.every((module) => stored.modules.includes(module)) ? "complete" : "blocked";
    }

    if (needsWork(steps.onboarding) && organizationId) {
      steps.onboarding = "complete";
    }

    // Link the entitlement row to the organization it now belongs to, so the two
    // halves of the system agree on who this customer is.
    if (input.source === "whop_membership" && organizationId) {
      await db.whopEntitlement
        .updateMany({ where: { whopMembershipId: input.reference, organizationId: null }, data: { organizationId } })
        .catch(() => undefined);
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
      },
    });

    return {
      provisioningKey: key,
      status: status === "complete" ? "complete" : "partial",
      organizationId,
      modules: [...plan.modules],
      outstanding: [...plan.outstanding],
      alreadyProvisioned: false,
    };
  } catch (error) {
    // The run row keeps its per-step state, so the retry resumes rather than restarts.
    await db.provisioningRun
      .update({
        where: { id: run.id },
        data: {
          organizationId,
          subscriptionId,
          steps,
          status: "failed",
          failureReason: error instanceof Error ? error.message.slice(0, 300) : "unknown error",
        },
      })
      .catch(() => undefined);

    return { provisioningKey: key, status: "failed", organizationId, modules: [...plan.modules], outstanding: [...plan.outstanding], alreadyProvisioned: false };
  }
}

function needsWork(state: StepState | undefined) {
  return state === "pending" || state === "in_progress";
}

/**
 * A run is complete when every step that payment *can* finish has finished.
 *
 * Blocked steps do not prevent completion — they are the steps waiting on a person or
 * on the clinic's own accounts, and holding the run open forever would mean no
 * purchase ever reads as provisioned.
 */
function deriveStatus(steps: Steps): "complete" | "partial" {
  const unfinished = Object.entries(steps).filter(([step, state]) => {
    if (!stepCompletableByPayment(step as ProvisioningStep)) return false;
    return state === "pending" || state === "in_progress";
  });
  return unfinished.length === 0 ? "complete" : "partial";
}

async function findOrganizationForEmail(email: string) {
  const user = await db.user.findFirst({ where: { email }, select: { organizationId: true } });
  return user?.organizationId ?? null;
}

/**
 * Create the clinic workspace.
 *
 * `demoMode` stays true. A brand-new organization has not signed anything, has no
 * connections, and is not approved for PHI, so it starts in the state that says so
 * rather than presenting itself as a production clinical system.
 */
async function createOrganization(email: string, clinicName?: string) {
  const name = clinicName?.trim() || `${email.split("@")[0]} Clinic`;
  const slug = await uniqueSlug(name);

  const organization = await db.organization.create({
    data: { name, slug, clinicType: "independent_clinic", status: "active", demoMode: true },
    select: { id: true },
  });
  return organization.id;
}

async function uniqueSlug(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "clinic";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 7)}`;
    const taken = await db.organization.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * Record the subscription carrying the purchased modules.
 *
 * Upserted rather than inserted: a clinic that upgrades has one subscription with
 * more modules, not two subscriptions racing to answer the same entitlement question.
 */
async function upsertSubscription(organizationId: string, planKey: string, modules: string[]) {
  const existing = await db.clinicSubscription.findFirst({
    where: { organizationId },
    select: { id: true, modules: true },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    // Union rather than replace. A clinic holding two purchases keeps both.
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

/** The provisioning state a customer should be shown after paying. */
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
