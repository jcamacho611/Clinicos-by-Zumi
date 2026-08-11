import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordIntentEvent } from "@/lib/growth/growth-service";
import { intentEventSchema } from "@/lib/growth/intent";
import { clientKey, rateLimit } from "@/lib/growth/rate-limit";
import { VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE_SECONDS, readVisitorId } from "@/lib/growth/visitor";

/**
 * First-party intent recording.
 *
 * Public marketing pages report what a visitor did here. There is no third-party
 * tracker in Klinikos and no pixel; this endpoint is the whole mechanism.
 *
 * Two properties worth stating:
 *
 *   - **The event type is a closed enum.** A caller cannot invent an event, so this
 *     endpoint cannot be turned into a general-purpose write channel.
 *   - **The prospect is resolved from the cookie, never from the body.** A request
 *     cannot name whose intent it is recording, which is what stops someone
 *     inflating — or poisoning — another prospect's score.
 */

const NO_STORE = { "Cache-Control": "no-store" } as const;

/** Page views are frequent; this is a ceiling on abuse, not on ordinary browsing. */
const LIMIT = 120;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "growth-intent"), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    // Silently accepted rather than surfaced as an error: intent recording is
    // best-effort telemetry, and a visitor reading a marketing page should never see
    // a failure because analytics hit a ceiling.
    return NextResponse.json({ data: { recorded: false } }, { status: 202, headers: NO_STORE });
  }

  const parsed = intentEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event." }, { status: 400, headers: NO_STORE });

  const visitorId = readVisitorId(request);
  const mintedVisitorId = visitorId ?? crypto.randomUUID();

  if (process.env.DATABASE_URL) {
    try {
      const prospectId = await resolveProspectId(mintedVisitorId);
      await recordIntentEvent({
        eventType: parsed.data.type,
        path: parsed.data.path,
        subject: parsed.data.subject,
        visitorId: mintedVisitorId,
        prospectId,
      });
    } catch {
      // Never fails a page. Losing one analytics event is immaterial; showing a
      // visitor an error because a write failed is not.
    }
  }

  const response = NextResponse.json({ data: { recorded: true } }, { headers: NO_STORE });
  if (!visitorId) {
    response.cookies.set({
      name: VISITOR_COOKIE,
      value: mintedVisitorId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
    });
  }
  return response;
}

/** The prospect this browser has already identified itself as, if any. */
async function resolveProspectId(visitorId: string) {
  const linked = await db.growthIntentEvent.findFirst({
    where: { visitorId, prospectId: { not: null } },
    select: { prospectId: true },
    orderBy: { occurredAt: "desc" },
  });
  return linked?.prospectId ?? null;
}
