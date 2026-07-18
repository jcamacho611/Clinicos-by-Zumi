import "server-only";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { can, type ClinicAction, type ClinicResource } from "@/lib/auth/rbac";
import { requestMetadata } from "@/lib/auth/request-metadata";
import type { ClinicSession } from "@/lib/auth/types";

interface AuthorizationContext {
  request?: Request;
  resourceId?: string;
}

export async function enforceApiPermission(
  session: ClinicSession,
  resource: ClinicResource,
  action: ClinicAction,
  context: AuthorizationContext = {},
) {
  if (can(session.role, resource, action)) return null;

  const metadata = context.request
    ? requestMetadata(context.request)
    : { ipAddress: undefined, userAgent: undefined };
  const endpoint = context.request ? new URL(context.request.url).pathname : undefined;
  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "authorization.denied",
      resourceType: resource,
      resourceId: context.resourceId ?? `${resource}:${action}`,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: { requiredAction: action, role: session.role, endpoint },
    },
  }).catch(() => undefined);

  return NextResponse.json({ error: "Access denied." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
}
