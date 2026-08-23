import "server-only";

import { db } from "@/lib/db";
import { normalizeClinicRole } from "@/lib/auth/rbac";

export type LegacyAccountCompatibility = {
  legacyUserId: string;
  accountId: string;
  personId: string;
  sameEmail: boolean;
  sameDisplayName: boolean;
  sameOrganization: boolean;
  sameRole: boolean;
  samePasswordHash: boolean;
  sameCredentialSecurityState: boolean;
  deterministicMembership: boolean;
  compatible: boolean;
};

export type MissingLegacyAccountCompatibility = {
  legacyUserId: string;
  compatible: false;
  reason: "missing_account_projection";
};

export type LegacyAccountCompatibilityResult = LegacyAccountCompatibility | MissingLegacyAccountCompatibility;

export type LegacyAccountCompatibilityReport = {
  total: number;
  compatibleCount: number;
  incompatibleCount: number;
  allCompatible: boolean;
  results: LegacyAccountCompatibilityResult[];
};

export async function inspectLegacyAccountCompatibility(
  legacyUserId: string,
): Promise<LegacyAccountCompatibility | null> {
  const legacyUser = await db.user.findUnique({
    where: { id: legacyUserId },
    include: { organization: true, authCredential: true },
  });
  if (!legacyUser) return null;

  const link = await db.legacyUserAccountLink.findUnique({
    where: { legacyUserId },
    include: { account: { include: { person: true, credential: true } } },
  });
  if (!link) return null;

  const now = new Date();
  const matchingMemberships = await db.organizationMembership.findMany({
    where: {
      personId: link.account.personId,
      legacyUserId,
      organizationId: legacyUser.organizationId,
      status: "active",
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
    },
    select: { id: true, roleKey: true },
  });

  const accountCredential = link.account.credential;
  const legacyCredential = legacyUser.authCredential;
  const sameEmail = link.account.primaryEmail === legacyUser.email.trim().toLowerCase();
  const sameDisplayName = link.account.displayName === legacyUser.name;
  const sameOrganization = matchingMemberships.length === 1;
  const sameRole = matchingMemberships.length === 1
    && normalizeClinicRole(matchingMemberships[0].roleKey ?? legacyUser.roleKey) === normalizeClinicRole(legacyUser.roleKey);
  const samePasswordHash = Boolean(
    accountCredential && legacyCredential && accountCredential.passwordHash === legacyCredential.passwordHash,
  );
  const sameCredentialSecurityState = Boolean(
    accountCredential
      && legacyCredential
      && accountCredential.mustReset === legacyCredential.mustReset
      && accountCredential.failedAttempts === legacyCredential.failedAttempts
      && (accountCredential.lockedUntil?.getTime() ?? null) === (legacyCredential.lockedUntil?.getTime() ?? null)
      && accountCredential.passwordChangedAt.getTime() === legacyCredential.passwordChangedAt.getTime(),
  );
  const deterministicMembership = matchingMemberships.length === 1;

  return {
    legacyUserId,
    accountId: link.accountId,
    personId: link.account.personId,
    sameEmail,
    sameDisplayName,
    sameOrganization,
    sameRole,
    samePasswordHash,
    sameCredentialSecurityState,
    deterministicMembership,
    compatible: sameEmail
      && sameDisplayName
      && sameOrganization
      && sameRole
      && samePasswordHash
      && sameCredentialSecurityState
      && deterministicMembership,
  };
}

export async function verifyAllActiveLegacyAccountCompatibility(): Promise<LegacyAccountCompatibilityReport> {
  const users = await db.user.findMany({
    where: {
      status: "active",
      authCredential: { isNot: null },
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  const results: LegacyAccountCompatibilityResult[] = [];
  for (const user of users) {
    const result = await inspectLegacyAccountCompatibility(user.id);
    results.push(result ?? {
      legacyUserId: user.id,
      compatible: false,
      reason: "missing_account_projection",
    });
  }

  const compatibleCount = results.filter((result) => result.compatible).length;
  const incompatibleCount = results.length - compatibleCount;
  return {
    total: results.length,
    compatibleCount,
    incompatibleCount,
    allCompatible: incompatibleCount === 0,
    results,
  };
}

export async function assertAllActiveLegacyAccountsCompatible() {
  const report = await verifyAllActiveLegacyAccountCompatibility();
  if (!report.allCompatible) {
    const failedIds = report.results
      .filter((result) => !result.compatible)
      .map((result) => result.legacyUserId)
      .join(", ");
    throw new Error(`Universal Account compatibility failed for active legacy user(s): ${failedIds || "unknown"}.`);
  }
  return report;
}
