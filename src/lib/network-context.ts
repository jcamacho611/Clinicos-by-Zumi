import { z } from "zod";

/**
 * Canonical product hierarchy.
 *
 * The product is architected as:
 * Platform -> Network -> Organization -> Location -> Department -> Workspace.
 *
 * IMPORTANT: the persisted tenant boundary is still Organization today. `networkId`
 * therefore remains nullable until a real network-membership model exists. Nothing in
 * this type grants cross-organization access or pretends the migration already happened.
 */
export const KLINIKOS_PLATFORM_ID = "klinikos" as const;

export const networkContextSchema = z.object({
  platformId: z.literal(KLINIKOS_PLATFORM_ID),
  networkId: z.string().trim().min(1).max(200).nullable(),
  organizationId: z.string().trim().min(1).max(200),
  locationId: z.string().trim().min(1).max(200).nullable(),
  departmentId: z.string().trim().min(1).max(200).nullable(),
  workspaceId: z.string().trim().min(1).max(160).nullable(),
});

export const networkContextSelectionSchema = z.object({
  // The browser may echo the signed-in organization for optimistic UI purposes, but
  // the server must compare it to the authenticated session. It is never authority.
  organizationId: z.string().trim().min(1).max(200).optional(),
  // Current persistence has no Network tenant model. A non-null network selector is
  // rejected server-side until that migration is real.
  networkId: z.string().trim().min(1).max(200).nullable().optional(),
  locationId: z.string().trim().min(1).max(200).nullable().optional(),
  departmentId: z.string().trim().min(1).max(200).nullable().optional(),
  workspaceId: z.string().trim().min(1).max(160).nullable().optional(),
});

export type NetworkContext = z.infer<typeof networkContextSchema>;
export type NetworkContextSelection = z.infer<typeof networkContextSelectionSchema>;

export type ContextOption = {
  id: string;
  label: string;
  parentId?: string | null;
};

export type NetworkContextOptions = {
  organization: ContextOption;
  locations: ContextOption[];
  departments: ContextOption[];
  workspaces: ContextOption[];
  /** Honest migration signal. False means Network is architectural, not a tenant selector. */
  networkSwitchingAvailable: boolean;
};

export type ResolvedNetworkContext = {
  context: NetworkContext;
  options: NetworkContextOptions;
};

export const resourceClassifications = [
  "clinical",
  "operational",
  "financial",
  "network",
  "grid",
  "education",
  "document",
  "communication",
  "identity",
  "configuration",
] as const;

export type ResourceClassification = (typeof resourceClassifications)[number];

/**
 * Every server-owned resource can expose the same identity envelope even while some
 * legacy tables still persist only a subset of the hierarchy. Null means unknown/not
 * yet persisted, never "all tenants".
 */
export const canonicalResourceIdentitySchema = z.object({
  networkId: z.string().trim().min(1).max(200).nullable(),
  organizationId: z.string().trim().min(1).max(200),
  locationId: z.string().trim().min(1).max(200).nullable(),
  departmentId: z.string().trim().min(1).max(200).nullable(),
  workspaceId: z.string().trim().min(1).max(160).nullable(),
  classification: z.enum(resourceClassifications),
});

export type CanonicalResourceIdentity = z.infer<typeof canonicalResourceIdentitySchema>;

export function canonicalResourceIdentity(
  context: Pick<NetworkContext, "networkId" | "organizationId" | "locationId" | "departmentId" | "workspaceId">,
  classification: ResourceClassification,
): CanonicalResourceIdentity {
  return canonicalResourceIdentitySchema.parse({ ...context, classification });
}

export function contextBelongsToOrganization(context: NetworkContext, organizationId: string) {
  return context.organizationId === organizationId;
}

export const ORGANIZATION_SCOPED_NETWORK_NOTICE =
  "Klinikos models Network as the layer above organizations, but the current authenticated tenant boundary remains Organization until network membership is persisted and audited.";
