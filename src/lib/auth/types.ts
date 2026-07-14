import type { ClinicRole } from "@/lib/auth/rbac";

export interface ClinicSession {
  sessionId: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  email: string;
  name: string;
  role: ClinicRole;
  demo: boolean;
  expiresAt: number;
}

export type AuthenticatedIdentity = Omit<ClinicSession, "sessionId" | "expiresAt"> & {
  source: "database" | "development-demo";
};
