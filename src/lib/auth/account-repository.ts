import "server-only";

import { db } from "@/lib/db";
import { normalizeClinicRole } from "@/lib/auth/rbac";
import type { ClinicAccountIdentity, MemberIdentity } from "@/lib/auth/account-types";

export async function findAccountAuthenticationRecordByEmail(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  return db.account.findUnique({
    where: { primaryEmail: email },
    include: {
      person: true,
      credential: true,
      legacyLinks: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function resolveAccountIdentity(
  account: NonNullable<Awaited<ReturnType<typeof findAccountAuthenticationRecordByEmail>>>,
): Promise<MemberIdentity | ClinicAccountIdentity | null> {
  if (account.status !== "active" || account.person.status !== "active") return null;

  const member: MemberIdentity = {
    accountId: account.id,
    personId: account.personId,
    email: account.primaryEmail,
    name: account.displayName,
    source: "account",
  };

  // No organization relationship is a valid free-member state.
  if (account.legacyLinks.length === 0) return member;

  // Context switching is deliberately deferred. More than one legacy workspace link
  // cannot be selected by array order; authenticate the Person only and require a
  // later explicit context-selection flow instead of silently choosing a tenant.
  if (account.legacyLinks.length !== 1) return member;

  const legacyLink = account.legacyLinks[0];
  const legacyUser = await db.user.findUnique({
    where: { id: legacyLink.legacyUserId },
    include: { organization: true },
  });
  if (!legacyUser || legacyUser.status !== "active" || legacyUser.organization.status !== "active") return member;

  // The compatibility link must remain consistent with the canonical email. If the
  // data diverges, do not manufacture clinic authority from a stale relationship.
  if (legacyUser.email.trim().toLowerCase() !== account.primaryEmail) return member;

  return {
    ...member,
    legacyUserId: legacyUser.id,
    organizationId: legacyUser.organizationId,
    organizationName: legacyUser.organization.name,
    organizationSlug: legacyUser.organization.slug,
    role: normalizeClinicRole(legacyUser.roleKey),
  };
}

export async function findAccountById(accountId: string) {
  return db.account.findUnique({
    where: { id: accountId },
    include: { person: true, legacyLinks: { orderBy: { createdAt: "asc" } } },
  });
}
