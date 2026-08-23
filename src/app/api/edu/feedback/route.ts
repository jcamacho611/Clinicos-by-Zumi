import { NextResponse } from "next/server";
import { z } from "zod";

import { getClinicSession } from "@/lib/auth/session";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import { submitWorkforceFeedback } from "@/lib/edu/workforce-delivery-repository";
import { canSubmitWorkforceFeedback, workforceSurveyKindForRole } from "@/lib/edu/workforce-feedback";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const feedbackSchema = z.object({
  sessionId: z.string().trim().min(1).max(128),
  overallRating: z.number().int().min(1).max(5),
  instructorRating: z.number().int().min(1).max(5).nullable().optional(),
  confidenceBefore: z.number().int().min(1).max(5).nullable().optional(),
  confidenceAfter: z.number().int().min(1).max(5).nullable().optional(),
  wouldRecommend: z.boolean().nullable().optional(),
  comments: z.string().trim().max(2_000).nullable().optional(),
});

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });

  const identity = await resolveEduIdentity();
  if (!identity?.institutionId || !canSubmitWorkforceFeedback(identity.role)) {
    return NextResponse.json({ error: "This EDU role cannot submit session feedback." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid feedback request." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS });

  const surveyKind = workforceSurveyKindForRole(identity.role);
  if (!surveyKind) return NextResponse.json({ error: "Survey provenance could not be established." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS });

  try {
    const saved = await submitWorkforceFeedback(identity, { ...parsed.data, surveyKind });
    return NextResponse.json({ data: saved }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feedback could not be saved.";
    const status = message.includes("not permitted") || message.includes("authority") ? 403 : message.includes("not found") ? 404 : 409;
    return NextResponse.json({ error: message }, { status, headers: PRIVATE_NO_STORE_HEADERS });
  }
}
