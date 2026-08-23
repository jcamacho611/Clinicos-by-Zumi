import { NextResponse } from "next/server";
import { z } from "zod";

import { invokeZumi } from "@/features/zumi/gateway";
import { resolveOrganizationEntitlements } from "@/features/zumi/entitlements";
import { getClinicSession } from "@/lib/auth/session";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import {
  buildEduZumiServerContext,
  eduZumiPracticeModeKeys,
  getEduZumiPracticeMode,
  mayUseEduZumiPracticeMode,
} from "@/lib/edu/zumi-workforce-practice";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const requestSchema = z.object({
  mode: z.enum(eduZumiPracticeModeKeys),
  question: z.string().trim().min(1).max(6_000),
  pathway: z.string().trim().max(80).nullable().optional(),
});

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });

  const identity = await resolveEduIdentity();
  if (!identity?.institutionId) {
    return NextResponse.json({ error: "A Klinikos EDU institution context is required." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid practice request." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS });

  const mode = getEduZumiPracticeMode(parsed.data.mode);
  if (!mode || !mayUseEduZumiPracticeMode(identity.role, mode.key)) {
    return NextResponse.json({ error: "This EDU role cannot use that practice mode." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const entitlements = await resolveOrganizationEntitlements(session.organizationId);
  const context = buildEduZumiServerContext({
    role: identity.role,
    institutionId: identity.institutionId,
    enrollmentId: identity.enrollmentId,
    mode,
    pathway: parsed.data.pathway,
  });

  const result = await invokeZumi({
    session,
    capability: mode.capability,
    organizationId: session.organizationId,
    entitlements,
    question: parsed.data.question,
    context,
    allowWebResearch: false,
    allowKnowledgeSearch: true,
    allowCodeInterpreter: false,
    presence: {
      surface: "education",
      mode: "conversation",
      autonomy: "answer_only",
      pathname: "/edu/zumi-practice",
      pageTitle: "Zumi Workforce Practice",
      inputModalities: ["text"],
      outputModalities: ["text"],
    },
    accessibility: {
      responseLength: "balanced",
      languageStyle: "plain",
      speechOutput: false,
      captions: true,
      keyboardFirst: false,
      reducedMotion: false,
      highContrast: false,
    },
  });

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: result.message,
        practiceMode: mode.key,
        authorityBoundary: mode.authorityBoundary,
        intelligenceAvailable: result.reason !== "provider_unavailable",
      },
      { status: result.status, headers: PRIVATE_NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      data: {
        answer: result.response.answer,
        practiceMode: mode.key,
        authorityBoundary: mode.authorityBoundary,
        modelGenerated: true,
        requiresInstructorReview: mode.capability === "edu_instructor_assist",
      },
    },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}
