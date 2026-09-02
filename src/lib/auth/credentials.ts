import "server-only";

import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import {
  DEVELOPMENT_DEMO_EMAIL,
  DEVELOPMENT_DEMO_PASSWORD,
  isDemoAuthEnabled,
} from "@/lib/auth/config";
import { normalizeClinicRole } from "@/lib/auth/rbac";
import type { AuthenticatedIdentity } from "@/lib/auth/types";

const LOCK_AFTER_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function demoIdentity(): AuthenticatedIdentity {
  return {
    userId: "user-nadja",
    organizationId: "org-bfm",
    organizationName: "Brooklyn Family Medicine",
    organizationSlug: "brooklyn-family-medicine",
    email: DEVELOPMENT_DEMO_EMAIL,
    name: "Nadja R., NP",
    role: "clinic_owner",
    demo: true,
    source: "development-demo",
  };
}

export async function authenticateCredentials(emailInput: string, password: string): Promise<AuthenticatedIdentity | null> {
  const email = emailInput.trim().toLowerCase();

  if (isDemoAuthEnabled() && email === DEVELOPMENT_DEMO_EMAIL && password === DEVELOPMENT_DEMO_PASSWORD) {
    return demoIdentity();
  }

  if (process.env.DATABASE_URL) {
    try {
      const user = await db.user.findUnique({
        where: { email },
        include: { organization: true, authCredential: true },
      });

      if (user?.status === "active" && user.organization.status === "active" && user.authCredential) {
        const credential = user.authCredential;
        if (credential.lockedUntil && credential.lockedUntil > new Date()) {
          return null;
        }

        const valid = await compare(password, credential.passwordHash);
        if (!valid) {
          // Let PostgreSQL increment the persisted value. Reading a count and then
          // writing `count + 1` loses failures when bad-password requests overlap.
          const failedCredential = await db.authCredential.update({
            where: { userId: user.id },
            data: { failedAttempts: { increment: 1 } },
            select: { failedAttempts: true },
          });

          if (failedCredential.failedAttempts >= LOCK_AFTER_ATTEMPTS) {
            const now = new Date();
            // Establish (or renew after expiry) one bounded lock. A second in-flight
            // failure cannot extend a lock that another request just established.
            await db.authCredential.updateMany({
              where: {
                userId: user.id,
                failedAttempts: { gte: LOCK_AFTER_ATTEMPTS },
                OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
              },
              data: { lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60 * 1_000) },
            });
          }
          return null;
        }

        await db.$transaction([
          db.authCredential.update({ where: { userId: user.id }, data: { failedAttempts: 0, lockedUntil: null } }),
          db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
        ]);

        return {
          userId: user.id,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          organizationSlug: user.organization.slug,
          email: user.email,
          name: user.name,
          role: normalizeClinicRole(user.roleKey),
          demo: false,
          source: "database",
        };
      }
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }
  }

  return null;
}

export async function hasClinicIdentity(emailInput: string) {
  if (!process.env.DATABASE_URL) return false;
  const email = emailInput.trim().toLowerCase();
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  return Boolean(user);
}
