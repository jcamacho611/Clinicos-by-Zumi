import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { advancePathInstance } from "@/lib/orchestration/path-persistence-repository";

const advanceSchema = z.object({
  completedNodeId: z.string().trim().min(2).max(160),
});

export async function POST(request: Request, { params }: { params: Promise<{ instanceId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "tasks", "update", { request });
  if (denied) return denied;

  try {
    const { instanceId } = await params;
    const input = advanceSchema.parse(await request.json());
    return NextResponse.json({
      data: await advancePathInstance(session, { instanceId, completedNodeId: input.completedNodeId }),
    });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
