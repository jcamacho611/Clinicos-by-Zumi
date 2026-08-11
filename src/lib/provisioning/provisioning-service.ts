import "server-only";

import { db } from "@/lib/db";
import { createAccountActivationToken } from "@/lib/auth/account-activation";
import {
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

    let activation: ProvisionResult["activation"] = null;
    if (organizationId && plan.modules.includes("clinic_workspace")) {
      const user = await attachBuyerToOrganization(email, organizationId);
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

async function attachBuyerToOrganization(email: string, organizationId: string) {
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
      name: email.split("@")[0] || "Clinic owner",
      roleKey: "clinic_owner",
      status: "active",
    },
    include: { authCredential: { select: { id: true } } },
  });
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
