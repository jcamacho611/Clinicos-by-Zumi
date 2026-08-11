import { NextResponse } from "next/server";
import { captureProspect } from "@/lib/growth/growth-service";
import { prospectCaptureSchema } from "@/lib/growth/lead-rules";
import { clientKey, rateLimit } from "@/lib/growth/rate-limit";
import { VISITOR_COOKIE, readVisitorId } from "@/lib/growth/visitor";

/**
 * Public lead capture.
 *
 * Unauthenticated by design — requiring an account to ask for information is how a
 * marketing site collects nothing. What that costs is a session to attribute abuse
 * to, so this endpoint carries its own rate limit and a strict schema.
 *
 * The schema is the security boundary here. It has no free-text field, so there is no
 * shape in which a visitor can submit protected health information even by mistake.
 */

const NO_STORE = { "Cache-Control": "no-store" } as const;

/** Five submissions per address per hour. Generous for a person, tight for a script. */
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "growth-capture"), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Try again shortly." },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = prospectCaptureSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    // Field-level messages are returned because this is a form a person is filling
    // in; a generic failure would leave them guessing which field is wrong.
    return NextResponse.json(
      { error: "Some details need correcting.", fields: parsed.error.flatten().fieldErrors },
      { status: 400, headers: NO_STORE },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Requests are temporarily unavailable." }, { status: 503, headers: NO_STORE });
  }

  const visitorId = readVisitorId(request);

  try {
    await captureProspect({ ...parsed.data, visitorId });
  } catch {
    // The error is not forwarded. A unique-constraint message would confirm whether a
    // given email is already in the system, which is not a question a public endpoint
    // should answer.
    return NextResponse.json({ error: "We could not record that request." }, { status: 500, headers: NO_STORE });
  }

  const response = NextResponse.json(
    { data: { received: true, message: "Your Klinikos overview is on its way." } },
    { headers: NO_STORE },
  );
  ensureVisitorCookie(response, visitorId);
  return response;
}

function ensureVisitorCookie(response: NextResponse, visitorId: string | null) {
  if (visitorId) return;
  response.cookies.set({
    name: VISITOR_COOKIE,
    value: crypto.randomUUID(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}
