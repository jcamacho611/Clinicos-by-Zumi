import "server-only";

import { cookies } from "next/headers";
import type { ClinicSession } from "@/lib/auth/types";
import { canAccessWorkspace } from "@/lib/auth/workspace-authorization";
import { db } from "@/lib/db";
import { navigation } from "@/lib/navigation";
import {
  KLINIKOS_PLATFORM_ID,
  networkContextSelectionSchema,
  type NetworkContextSelection,
  type ResolvedNetworkContext,
} from "@/lib/network-context";

export const NETWORK_CONTEXT_COOKIE = "klinikos_context_v1";

export class TenantContextError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "TenantContextError";
    this.status = status;
  }
}

function assertWorkspaceAllowed(session: ClinicSession, workspaceId: string | null) {
  if (!workspaceId) return;
  if (workspaceId === "edu") return;
  if (!canAccessWorkspace(session.role, workspaceId)) {
    throw new TenantContextError("That workspace is not available for this role.", 403);
  }
}

function availableWorkspaces(session: ClinicSession) {
  const seen = new Set<string>();
  const workspaces: { id: string; label: string }[] = [];

  for (const group of navigation) {
    for (const item of group.items) {
      const id = item.href.replace(/^\//, "");
      if (!id || seen.has(id)) continue;
      if (id !== "edu" && !canAccessWorkspace(session.role, id)) continue;
      seen.add(id);
      workspaces.push({ id, label: item.label });
    }
  }

  return workspaces;
}

export function assertTenantScopedOrganization(session: ClinicSession, organizationId: string) {
  if (organizationId !== session.organizationId) {
    throw new TenantContextError("Requested organization is outside the authenticated tenant.", 403);
  }
  return organizationId;
}

function parseStoredSelection(value: string | undefined): NetworkContextSelection {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return networkContextSelectionSchema.parse(parsed);
  } catch {
    return {};
  }
}

export async function readStoredNetworkContextSelection(): Promise<NetworkContextSelection> {
  const store = await cookies();
  return parseStoredSelection(store.get(NETWORK_CONTEXT_COOKIE)?.value);
}

/**
 * Resolve the active Klinikos context from server-owned session scope.
 *
 * Browser/cookie selections are preferences only. Organization ownership, location
 * ownership, department ownership, department/location compatibility, and workspace
 * authorization are all re-read and re-validated here before the context is returned.
 */
export async function resolveTenantContext(
  session: ClinicSession,
  requestedSelection?: NetworkContextSelection,
): Promise<ResolvedNetworkContext> {
  const selection = networkContextSelectionSchema.parse(
    requestedSelection ?? (await readStoredNetworkContextSelection()),
  );

  if (selection.organizationId) {
    assertTenantScopedOrganization(session, selection.organizationId);
  }

  // The current Prisma model has no Network membership/tenant table. Do not create a
  // fake cross-organization selector from a client-provided network ID.
  if (selection.networkId != null) {
    throw new TenantContextError(
      "Network switching is not available until network membership is persisted and audited.",
      409,
    );
  }

  const workspaces = availableWorkspaces(session);
  const workspaceId = selection.workspaceId ?? null;
  assertWorkspaceAllowed(session, workspaceId);

  // Development/demo auth can exist before a database is attached. Preserve the
  // organization tenant boundary but expose no invented location/department scope.
  if (!process.env.DATABASE_URL) {
    if (selection.locationId || selection.departmentId) {
      throw new TenantContextError("Location and department context require a connected database.", 409);
    }
    return {
      context: {
        platformId: KLINIKOS_PLATFORM_ID,
        networkId: null,
        organizationId: session.organizationId,
        locationId: null,
        departmentId: null,
        workspaceId,
      },
      options: {
        organization: { id: session.organizationId, label: session.organizationName },
        locations: [],
        departments: [],
        workspaces,
        networkSwitchingAvailable: false,
      },
    };
  }

  const [organization, locations, departments] = await Promise.all([
    db.organization.findUnique({
      where: { id: session.organizationId },
      select: { id: true, name: true, status: true },
    }),
    db.location.findMany({
      where: { organizationId: session.organizationId, status: "active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 250,
    }),
    db.department.findMany({
      where: { organizationId: session.organizationId, status: "active" },
      select: { id: true, name: true, locationId: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);

  if (!organization || organization.status !== "active") {
    throw new TenantContextError("Authenticated organization is not active.", 403);
  }

  const locationId = selection.locationId ?? null;
  const departmentId = selection.departmentId ?? null;
  const location = locationId ? locations.find((entry) => entry.id === locationId) : null;
  if (locationId && !location) {
    throw new TenantContextError("Requested location is outside the authenticated organization.", 403);
  }

  const department = departmentId ? departments.find((entry) => entry.id === departmentId) : null;
  if (departmentId && !department) {
    throw new TenantContextError("Requested department is outside the authenticated organization.", 403);
  }
  if (department?.locationId && locationId && department.locationId !== locationId) {
    throw new TenantContextError("Requested department does not belong to the selected location.", 409);
  }

  return {
    context: {
      platformId: KLINIKOS_PLATFORM_ID,
      networkId: null,
      organizationId: session.organizationId,
      locationId,
      departmentId,
      workspaceId,
    },
    options: {
      organization: { id: organization.id, label: organization.name },
      locations: locations.map((entry) => ({ id: entry.id, label: entry.name })),
      departments: departments.map((entry) => ({ id: entry.id, label: entry.name, parentId: entry.locationId })),
      workspaces,
      networkSwitchingAvailable: false,
    },
  };
}

export function serializeNetworkContextSelection(selection: NetworkContextSelection) {
  const parsed = networkContextSelectionSchema.parse(selection);
  return JSON.stringify({
    organizationId: parsed.organizationId ?? undefined,
    networkId: null,
    locationId: parsed.locationId ?? null,
    departmentId: parsed.departmentId ?? null,
    workspaceId: parsed.workspaceId ?? null,
  });
}
