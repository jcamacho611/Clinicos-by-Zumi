import type { ClinicRole } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";

export type MemberIdentity = {
  accountId: string;
  personId: string;
  email: string;
  name: string;
  source: "account";
};

export type ClinicAccountIdentity = MemberIdentity & {
  legacyUserId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: ClinicRole;
};

export type MemberAccountSession = {
  kind: "member";
  sessionId: string;
  accountId: string;
  personId: string;
  email: string;
  name: string;
  demo: false;
  expiresAt: number;
};

export type ClinicAccountSession = {
  kind: "clinic";
  sessionId: string;
  accountId: string;
  personId: string;
  email: string;
  name: string;
  demo: false;
  expiresAt: number;
  legacyUserId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: ClinicRole;
};

export type AccountSession = MemberAccountSession | ClinicAccountSession;

export function accountIdentityHasClinicContext(identity: MemberIdentity | ClinicAccountIdentity): identity is ClinicAccountIdentity {
  return "organizationId" in identity && "legacyUserId" in identity && "role" in identity;
}

export function accountSessionHasClinicContext(session: AccountSession): session is ClinicAccountSession {
  return session.kind === "clinic";
}

export function projectClinicSessionFromAccount(session: ClinicAccountSession): ClinicSession {
  return {
    sessionId: session.sessionId,
    userId: session.legacyUserId,
    organizationId: session.organizationId,
    organizationName: session.organizationName,
    organizationSlug: session.organizationSlug,
    email: session.email,
    name: session.name,
    role: session.role,
    demo: false,
    expiresAt: session.expiresAt,
  };
}
