import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getClinicSession } from "@/lib/auth/session";
import { networkContextSelectionSchema } from "@/lib/network-context";
import {
  NETWORK_CONTEXT_COOKIE,
  TenantContextError,
  readStoredNetworkContextSelection,
  resolveTenantContext,
  serializeNetworkContextSelection,
} from "@/lib/tenant-context";

function errorResponse(error: unknown) {
  if (error instanceof TenantContextError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Context could not be resolved." }, { status: 400 });
}

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    return NextResponse.json({ data: await resolveTenantContext(session) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const patch = networkContextSelectionSchema.parse(await request.json());
    const current = await readStoredNetworkContextSelection();
    const requested = {
      ...current,
      ...patch,
      // Organization comes from the session. An echoed organization ID is validated
      // by resolveTenantContext; absence never means the client can choose another.
      organizationId: patch.organizationId ?? session.organizationId,
      networkId: patch.networkId ?? null,
    };
    const resolved = await resolveTenantContext(session, requested);

    const store = await cookies();
    store.set(
      NETWORK_CONTEXT_COOKIE,
      serializeNetworkContextSelection({
        organizationId: resolved.context.organizationId,
        networkId: null,
        locationId: resolved.context.locationId,
        departmentId: resolved.context.departmentId,
        workspaceId: resolved.context.workspaceId,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      },
    );

    return NextResponse.json({ data: resolved });
  } catch (error) {
    return errorResponse(error);
  }
}
