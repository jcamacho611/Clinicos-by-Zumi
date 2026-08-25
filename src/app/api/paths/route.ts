import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import type { ClinicSession } from "@/lib/auth/types";
import { presentPath, presentPaths } from "@/lib/home/path-presentation-resolver";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { resolvePathGuidance } from "@/lib/orchestration/path-guidance-engine";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { resolveSurfaceLookup } from "@/features/zumi/deterministic-answer";
import { detectUrgentSignal } from "@/lib/safety/urgent-signal";
import {
  createPathInstance,
  listActivePathSnapshots,
} from "@/lib/orchestration/path-persistence-repository";

/**
 * Start a Path from an already-chosen path id.
 *
 * Still supported because surfaces that already know which Path they mean — a Path
 * detail page with a Start button — have nothing to resolve.
 */
const createPathSchema = z.object({
  pathId: z.string().trim().min(2).max(120),
  goal: z.string().trim().min(2).max(1_000).optional().nullable(),
  context: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Start from what the user actually typed.
 *
 * Living Home used to resolve intent in the browser and post the winning path id. That
 * put the intent taxonomy and the path catalog in the bundle, and it also meant the
 * browser decided which surfaces the user was allowed to be sent to. Both belong here.
 */
const resolveIntentSchema = z.object({
  text: z.string().trim().min(2).max(1_000),
});

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "tasks", "read", { request });
  if (denied) return denied;

  try {
    const data = await listActivePathSnapshots(session);
    return NextResponse.json({ data, presentations: presentPaths(data) });
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
    const body = await request.json();
    const intentRequest = resolveIntentSchema.safeParse(body);

    if (intentRequest.success) {
      return await respondToTypedIntent(session, intentRequest.data.text);
    }

    const input = createPathSchema.parse(body);
    const snapshot = await createPathInstance(session, input);
    return NextResponse.json(
      {
        outcome: "path",
        data: snapshot,
        guidance: resolvePathGuidance(session, snapshot),
        presentation: presentPath(snapshot),
      },
      { status: 201 },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

/**
 * Four honest outcomes, decided here rather than in the browser.
 *
 * Urgent comes first and short-circuits everything: a sentence describing an emergency
 * must not become a scheduling Path, and nothing routine may run on the strength of it.
 *
 * Of the rest, not every sentence is a journey. "Who hasn't completed intake tomorrow?"
 * is a question about a list, and the right answer is the surface holding it — checked
 * against what this session may actually open, which is a decision the client cannot be
 * trusted to make about itself.
 */
async function respondToTypedIntent(session: ClinicSession, text: string) {
  // Before anything else. Someone describing an emergency must not be routed into a
  // scheduling Path, and no routine automation may run on the strength of that sentence.
  // Klinikos does not triage here — it stops, and it shows approved language.
  const urgent = detectUrgentSignal(text);
  if (urgent.urgent) {
    return NextResponse.json({
      outcome: "urgent",
      urgent: { category: urgent.category, message: urgent.message },
    });
  }

  const resolved = resolveIntentDeterministically(text);
  const pathId = resolved.candidatePathIds[0] ?? null;

  if (!pathId) {
    const surface = resolveSurfaceLookup(text, session.role);
    if (surface) {
      return NextResponse.json({ outcome: "surface", surface });
    }
    return NextResponse.json({
      outcome: "clarification",
      question:
        resolved.clarificationQuestions[0] ??
        "Klinikos needs one more detail before it can help with that.",
    });
  }

  const snapshot = await createPathInstance(session, { pathId, goal: text });
  return NextResponse.json(
    {
      outcome: "path",
      data: snapshot,
      guidance: resolvePathGuidance(session, snapshot),
      presentation: presentPath(snapshot),
      // Carried so the composer can still ask a follow-up after a Path is created, the
      // way it did when it resolved intent itself.
      clarification: resolved.requiresClarification
        ? resolved.clarificationQuestions[0] ?? null
        : null,
    },
    { status: 201 },
  );
}
