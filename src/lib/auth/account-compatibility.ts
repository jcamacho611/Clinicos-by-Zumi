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

  const matchingMemberships = await db.organizationMembership.findMany({
    where: {
      personId: link.account.personId,
      legacyUserId,
      organizationId: legacyUser.organizationId,
      status: "active",
      effectiveFrom: { lte: new Date() },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
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
