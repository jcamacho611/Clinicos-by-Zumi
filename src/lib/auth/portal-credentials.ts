import "server-only";

import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import type { AuthenticatedPortalIdentity } from "@/lib/auth/portal-types";

const LOCK_AFTER_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

interface PortalLoginMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export async function authenticatePortalCredentials(input: {
  organizationSlug: string;
  email: string;
  password: string;
  metadata: PortalLoginMetadata;
}): Promise<AuthenticatedPortalIdentity | null> {
  const organizationSlug = input.organizationSlug.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const account = await db.portalAccount.findFirst({
    where: { email, organization: { slug: organizationSlug } },
    include: { organization: true, patient: true },
  });

  if (!account) return null;
  const active = account.status === "active" && account.organization.status === "active" &&
    account.patient.status === "active" && account.patient.portalStatus === "active";
  const currentlyLocked = Boolean(account.lockedUntil && account.lockedUntil > new Date());
  const valid = active && !currentlyLocked && await compare(input.password, account.passwordHash);

  if (!valid) {
    const failedAttempts = account.failedAttempts + 1;
    await db.$transaction([
      db.portalAccount.update({
        where: { id: account.id },
        data: {
          failedAttempts,
          lockedUntil: failedAttempts >= LOCK_AFTER_ATTEMPTS
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : account.lockedUntil,
        },
      }),
      db.auditLog.create({
        data: {
          organizationId: account.organizationId,
          actorId: account.id,
          actorType: "patient",
          action: "portal.login_failed",
          resourceType: "portal_account",
          resourceId: account.id,
          patientId: account.patientId,
          ipAddress: input.metadata.ipAddress,
          userAgent: input.metadata.userAgent,
          metadata: { reason: currentlyLocked ? "account_locked" : active ? "invalid_credentials" : "account_unavailable" },
        },
      }),
    ]);
    return null;
  }

  await db.$transaction([
    db.portalAccount.update({ where: { id: account.id }, data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } }),
    db.auditLog.create({
      data: {
        organizationId: account.organizationId,
        actorId: account.id,
        actorType: "patient",
        action: "portal.login_succeeded",
        resourceType: "portal_account",
        resourceId: account.id,
        patientId: account.patientId,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: { authLevel: "password" },
      },
    }),
  ]);

  return {
    accountId: account.id,
    patientId: account.patientId,
    organizationId: account.organizationId,
    organizationName: account.organization.name,
    organizationSlug: account.organization.slug,
    email: account.email,
    name: account.patient.preferredName ?? account.patient.firstName,
    authLevel: "password",
  };
}
