import "server-only";

import { db } from "@/lib/db";
import type { KnownContext, OnboardingAnswers } from "@/lib/onboarding/onboarding-rules";

/**
 * What Klinikos already knows about a clinic before onboarding starts.
 *
 * Assembled from the organization record and, when the buyer came through the Growth
 * Engine, the enquiry they already filled in. Every fact recovered here is a question
 * the owner is never asked.
 */
export async function loadKnownContext(organizationId: string, email: string): Promise<KnownContext> {
  const [organization, prospect] = await Promise.all([
    db.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, clinicType: true, providerCount: true, locationCount: true, currentSystem: true },
    }),
    db.growthProspect.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { clinicName: true, clinicType: true, locationCount: true, providerCount: true, contactName: true },
    }).catch(() => null),
  ]);

  const sources: KnownContext["sources"] = {};
  // Prefer what the buyer typed about themselves over a name Klinikos generated for
  // them at provisioning. "dana Clinic" is a placeholder; "Harbor Aesthetics" is real.
  const clinicName = prospect?.clinicName ?? organization?.name ?? null;
  if (prospect?.clinicName) sources.clinicName = "enquiry";
  else if (organization?.name) sources.clinicName = "organization";

  // Answers already recorded on the organization count as known too — a re-run of
  // setup should not re-ask what the owner answered the first time.
  if (prospect?.locationCount) sources.locationCount = "enquiry";
  else if (organization?.locationCount) sources.locationCount = "organization";
  if (prospect?.providerCount) sources.providerCount = "enquiry";
  else if (organization?.providerCount) sources.providerCount = "organization";

  return {
    clinicName,
    clinicType: prospect?.clinicType ?? organization?.clinicType ?? null,
    locationCount: prospect?.locationCount ?? organization?.locationCount ?? null,
    providerCount: prospect?.providerCount ?? organization?.providerCount ?? null,
    contactName: prospect?.contactName ?? null,
    sources,
  };
}

/**
 * Apply the owner's answers to the tenant.
 *
 * Only fields the owner actually supplied are written; an omitted answer leaves the
 * existing value alone rather than overwriting it with a blank.
 *
 * `demoMode` is cleared here and only here. It is the flag that says this
 * organization has not been configured by a person, and completing onboarding is the
 * moment that stops being true.
 */
export async function applyOnboarding(organizationId: string, answers: OnboardingAnswers) {
  const data: {
    name?: string;
    clinicType?: string;
    demoMode?: boolean;
    providerCount?: string;
    locationCount?: string;
    currentSystem?: string;
  } = { demoMode: false };
  if (answers.clinicName) data.name = answers.clinicName;
  if (answers.specialty) data.clinicType = answers.specialty;
  // Every answer the owner gave is kept. Clearing `demoMode` below closes this page for
  // good, so an answer dropped here is one they have no way to supply again.
  if (answers.providerCount) data.providerCount = answers.providerCount;
  if (answers.locationCount) data.locationCount = answers.locationCount;
  if (answers.currentSystem) data.currentSystem = answers.currentSystem;

  await db.organization.update({ where: { id: organizationId }, data });

  // The priorities the owner named become the operating focus. Stored on the
  // subscription because that is where Klinikos already reads what a clinic has.
  if (answers.priorities?.length) {
    const subscription = await db.clinicSubscription.findFirst({
      where: { organizationId },
      select: { id: true, modules: true },
      orderBy: { createdAt: "desc" },
    });
    if (subscription) {
      const focus = answers.priorities.map((priority) => `focus:${priority}`);
      const merged = [...new Set([...subscription.modules.filter((module) => !module.startsWith("focus:")), ...focus])];
      await db.clinicSubscription.update({ where: { id: subscription.id }, data: { modules: merged } });
    }
  }

  return { ok: true as const };
}

/** Whether this organization still needs onboarding. */
export async function needsOnboarding(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { demoMode: true },
  });
  return organization?.demoMode ?? false;
}
