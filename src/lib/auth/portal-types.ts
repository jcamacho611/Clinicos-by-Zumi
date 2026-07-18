export interface PortalSession {
  sessionId: string;
  accountId: string;
  patientId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  email: string;
  name: string;
  authLevel: "password" | "mfa" | "passkey";
  expiresAt: number;
}

export type AuthenticatedPortalIdentity = Omit<PortalSession, "sessionId" | "expiresAt">;
