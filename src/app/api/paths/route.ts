import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { resolvePathGuidance } from "@/lib/orchestration/path-guidance-engine";
import {
  createPathInstance,
  listActivePathSnapshots,
} from "@/lib/orchestration/path-persistence-repository";

const createPathSchema = z.object({
  pathId: z.string().trim().min(2).max(120),
  goal: z.string().trim().min(2).max(1_000).optional().nullable(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "tasks", "read", { request });
  if (denied) return denied;

  try {
    return NextResponse.json({ data: await listActivePathSnapshots(session) });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "tasks", "create", { request });
  if (denied) return denied;

  try {
    const input = createPathSchema.parse(await request.json());
    const snapshot = await createPathInstance(session, input);
    return NextResponse.json(
      { data: snapshot, guidance: resolvePathGuidance(session, snapshot) },
      { status: 201 },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
