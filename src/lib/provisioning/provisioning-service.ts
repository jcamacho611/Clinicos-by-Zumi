import "server-only";

import { db } from "@/lib/db";
import { createAccountActivationToken } from "@/lib/auth/account-activation";
import { deliverOutbound } from "@/lib/communications/outbound";
import {
  buyerRoleForModules,
  planProvisioning,
  provisioningKey,
  stepCompletableByPayment,
  type ProvisioningStep,
  type StepState,
} from "@/lib/provisioning/provisioning-rules";

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
  status: "complete" | "partial" | "failed" | "skipped";
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
  let organizationId = run.organizationId ?? existingOrganizationId;
  let subscriptionId = run.subscriptionId;

  await db.provisioningRun.update({ where: { id: run.id }, data: { attempts: { increment: 1 } } });

  try {
    if (needsWork(steps.organization)) {
      organizationId = organizationId ?? (await createOrganization(email, input.clinicName));
      steps.organization = "complete";
    }

    // Every module-bearing purchase gets an identity attached to the tenant it just
    // paid for. Without this the buyer owns a subscription inside an organization they
    // cannot authenticate into, and creating a workspace later would make a second one.
    let activation: ProvisionResult["activation"] = null;
    if (organizationId && plan.modules.length > 0) {
      const user = await attachBuyerToOrganization(email, organizationId, buyerRoleForModules(plan.modules));
      if (!user.authCredential) {
        activation = { ...(await createAccountActivationToken({ email, userId: user.id, organizationId })), userId: user.id };
      }
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
    await db.provisioningRun.update({
      where: { id: run.id },
      data: {
        organizationId,
        subscriptionId,
        steps,
        status: "failed",
        failureReason: error instanceof Error ? error.message.slice(0, 300) : "unknown error",
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
 * Bind the buyer's identity to the tenant their payment created.
 *
 * Idempotent by the user's email, which is unique: a webhook redelivery finds the same
 * row rather than making a second buyer. An email that already belongs to another
 * organization is an error rather than a silent re-parent — moving someone between
 * tenants is not something a payment webhook should be able to do.
 */
async function attachBuyerToOrganization(email: string, organizationId: string, roleKey: "clinic_owner" | "contractor") {
  const existing = await db.user.findUnique({
    where: { email },
    include: { authCredential: { select: { id: true } } },
  });
  if (existing) {
    if (existing.organizationId !== organizationId) throw new Error("Buyer identity is already attached to another organization.");
    return existing;
  }
  return db.user.create({
    data: {
      organizationId,
      email,
      name: email.split("@")[0] || "Klinikos member",
      roleKey,
      status: "active",
    },
    include: { authCredential: { select: { id: true } } },
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
  const link = `${(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")}/activate?token=${encodeURIComponent(input.token)}`;
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
