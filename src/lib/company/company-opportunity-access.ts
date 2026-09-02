import type { ClinicAction, ClinicRole } from "@/lib/auth/rbac";
import { can } from "@/lib/auth/rbac";

export const DEFAULT_KLINIKOS_PLATFORM_ORGANIZATION_SLUG = "clinicos-by-zumi";

export function configuredKlinikosPlatformOrganizationSlug() {
  return (
    process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG?.trim() ||
    process.env.CLINICOS_SALES_ORGANIZATION_SLUG?.trim() ||
    DEFAULT_KLINIKOS_PLATFORM_ORGANIZATION_SLUG
  );
}

export function isCompanyOpportunityAccessAllowed(input: {
  role: ClinicRole;
  action: ClinicAction;
  organizationSlug: string;
  platformOrganizationSlug?: string;
}) {
  const platformOrganizationSlug =
    input.platformOrganizationSlug?.trim() || configuredKlinikosPlatformOrganizationSlug();
  return (
    input.organizationSlug === platformOrganizationSlug &&
    can(input.role, "company", input.action)
  );
}
