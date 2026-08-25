import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { resolveSurfaceLookup } from "@/features/zumi/deterministic-answer";
import { projectLivingHomePath } from "@/lib/home/living-home-presentation";
import type { LivingHomeCommandView } from "@/lib/home/living-home-view-model";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { resolvePathGuidance } from "@/lib/orchestration/path-guidance-engine";
import { createPathInstance } from "@/lib/orchestration/path-persistence-repository";

const commandSchema = z.object({
  text: z.string().trim().min(2).max(1_000),
}).strict();

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "tasks", "create", { request });
  if (denied) return denied;

  try {
    const { text } = commandSchema.parse(await request.json());
    const resolved = resolveIntentDeterministically(text);
    const pathId = resolved.candidatePathIds[0] ?? null;

    if (!pathId) {
      const surface = resolveSurfaceLookup(text, session.role);
      if (surface) {
        const payload: LivingHomeCommandView = {
          kind: "surface",
          message: surface.answer,
          surface: { label: surface.label, href: surface.href },
        };
        return NextResponse.json(payload);
      }

      const clarification = resolved.clarificationQuestions[0]
        ?? "Tell me what outcome you are trying to reach and Klinikos will organize the next safe step.";
      const payload: LivingHomeCommandView = {
        kind: "clarification",
        message: "Klinikos needs one more detail before it can organize that outcome.",
        clarification,
      };
      return NextResponse.json(payload);
    }

    if (resolved.requiresClarification) {
      const clarification = resolved.clarificationQuestions[0]
        ?? "Which outcome matters most right now?";
      const payload: LivingHomeCommandView = {
        kind: "clarification",
        message: "I found more than one possible Path and will not choose one for you without that detail.",
        clarification,
      };
      return NextResponse.json(payload);
    }

    const snapshot = await createPathInstance(session, { pathId, goal: text });
    const guidance = resolvePathGuidance(session, snapshot);
    const path = projectLivingHomePath(snapshot, guidance);
    const payload: LivingHomeCommandView = {
      kind: "path",
      message: guidance?.reason ?? "This is organized. The next safe step is below.",
      path,
    };
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
