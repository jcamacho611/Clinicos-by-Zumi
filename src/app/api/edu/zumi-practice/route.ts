import { NextResponse } from "next/server";
import { z } from "zod";

import { sanitizeZumiAnswerForClient } from "@/features/zumi/client-projection";
import { resolveOrganizationEntitlements } from "@/features/zumi/entitlements";
import { invokeZumi } from "@/features/zumi/gateway";
import { checkZumiProcessRateLimit } from "@/features/zumi/rate-limit";
import { getClinicSession } from "@/lib/auth/session";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { resolveEduIdentity } from "@/lib/edu/edu-session";
import {
  buildEduZumiServerContext,
  eduZumiPracticeModeKeys,
  getEduZumiPracticeMode,
  mayUseEduZumiPracticeMode,
} from "@/lib/edu/zumi-workforce-practice";
import { recordSecurityEvent } from "@/lib/security/events";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const MAX_BODY_BYTES = 48 * 1024;

const requestSchema = z.object({
  mode: z.enum(eduZumiPracticeModeKeys),
  question: z.string().trim().min(1).max(6_000),
  pathway: z.string().trim().max(80).nullable().optional(),
});

async function boundedJson(request: Request) {
  const declared = Number.parseInt(request.headers.get("content-length") ?? "", 10);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return { tooLarge: true as const, value: null };
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return { tooLarge: true as const, value: null };
  try {
    return { tooLarge: false as const, value: JSON.parse(raw) as unknown };
  } catch {
    return { tooLarge: false as const, value: null };
  }
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });

  const metadata = requestMetadata(request);
  const limit = checkZumiProcessRateLimit(`edu:${session.userId}:${metadata.ipAddress ?? "unknown"}`);
  if (!limit.allowed) {
    await recordSecurityEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "zumi.edu_rate_limited",
      risk: "MEDIUM",
      resourceType: "ai",
      resourceId: "edu-practice",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: { retryAfterSeconds: limit.retryAfterSeconds },
    });
    return NextResponse.json(
      { error: "Too many practice requests. Try again shortly." },
      { status: 429, headers: { ...PRIVATE_NO_STORE_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const identity = await resolveEduIdentity();
  if (!identity?.institutionId) {
    return NextResponse.json({ error: "A Klinikos EDU institution context is required." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await boundedJson(request);
  if (body.tooLarge) {
    await recordSecurityEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "zumi.edu_oversized_request",
      risk: "MEDIUM",
      resourceType: "ai",
      resourceId: "edu-practice",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: { maxBytes: MAX_BODY_BYTES },
    });
    return NextResponse.json({ error: "That practice request is too large." }, { status: 413, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const parsed = requestSchema.safeParse(body.value);
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

  const projected = sanitizeZumiAnswerForClient(result.response.answer);
  if (projected.blockedMarkers.length || projected.blockedKinds.length) {
    await recordSecurityEvent({
      organizationId: session.organizationId,
      actorId: session.userId,
      action: "zumi.edu_client_disclosure_blocked",
      risk: "HIGH",
      resourceType: "ai_response",
      resourceId: result.response.auditLogId ?? "edu-practice-response",
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: {
        markerCount: projected.blockedMarkers.length,
        patternCount: projected.blockedKinds.length,
        patternKinds: projected.blockedKinds,
      },
    });
  }

  return NextResponse.json(
    {
      data: {
        answer: projected.answer,
        practiceMode: mode.key,
        authorityBoundary: mode.authorityBoundary,
        modelGenerated: true,
        requiresInstructorReview: mode.capability === "edu_instructor_assist",
        rateLimitRemaining: limit.remaining,
      },
    },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}
