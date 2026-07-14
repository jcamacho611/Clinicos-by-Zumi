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
          const failedAttempts = credential.failedAttempts + 1;
          await db.authCredential.update({
            where: { userId: user.id },
            data: {
              failedAttempts,
              lockedUntil: failedAttempts >= LOCK_AFTER_ATTEMPTS
                ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
                : null,
            },
          });
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
