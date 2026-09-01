import { NextResponse } from "next/server";
import { LIFE_THREATENING_MESSAGE, detectUrgentSignal } from "@/lib/safety/urgent-signal";
import { z } from "zod";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { checkZumiProcessRateLimit } from "@/features/zumi/rate-limit";
import { publicZumiDurableQuotaAttested } from "@/features/zumi/public-quota-attestation";
import { resolvePublicZumiTurn } from "@/features/zumi/public-intelligence";
import { resolvePublicLivingIntent, type PublicLivingResolution } from "@/lib/orchestration/public-living-intent";

export const maxDuration = 20;

const MAX_BODY_BYTES = 16 * 1024;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  Vary: "Origin",
} as const;

/**
 * The prior resolution is the exact DTO this route already sent the browser, handed
 * back so the deterministic fallback can be reproduced server-side. It is public,
 * flat, and re-validated here rather than trusted.
 */
const priorResolutionSchema = z.object({
  kind: z.enum(["conversation", "route"]),
  title: z.string().trim().max(400),
  body: z.string().trim().max(4_000),
  assumption: z.string().trim().max(400).nullable().default(null),
  // Only the key survives the boundary. The engine rebuilds href and action from its
  // own rules, so accepting them here would let a visitor hand the server a link it
  // then presents as its own. `strip` (the default) also drops any extra fields the
  // browser attaches, which `passthrough()` previously carried straight through.
  destination: z.object({
    key: z.string().trim().max(60),
  }).nullable().default(null),
  confidence: z.number().min(0).max(1),
});

const requestSchema = z.object({
  question: z.string().trim().min(1).max(1_200),
  priorResolution: priorResolutionSchema.nullish().default(null),
  unresolvedTurns: z.number().int().min(0).max(24).default(0),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(600),
  })).max(12).default([]),
  sessionId: z.string().uuid().optional(),
  surface: z.string().trim().max(160).regex(/^\/(?!\/)/).optional(),
});

function configuredOrigins() {
  const origins = new Set([
    "https://klinikos.io",
    "https://www.klinikos.io",
  ]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {
      // Misconfigured public app URL must not broaden the origin allowlist.
    }
  }
  const additional = process.env.PUBLIC_ZUMI_ALLOWED_ORIGINS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];
  for (const value of additional) {
    try {
      origins.add(new URL(value).origin);
    } catch {
      // Ignore malformed operator entries instead of weakening the check.
    }
  }
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }
  return origins;
}

function originAccepted(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    if (origin === new URL(request.url).origin) return true;
  } catch {
    return false;
  }
  return configuredOrigins().has(origin);
}

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
  // Origin is defense-in-depth, not authentication: non-browser callers can forge it.
  // Paid anonymous inference additionally requires durable quota evidence from a trusted
  // edge/data-layer authority. Browser-controlled IP headers and this process-local
  // limiter are never sufficient authority to spend provider money.
  if (!originAccepted(request)) {
    return NextResponse.json({ error: "Public conversation is not available from this source." }, { status: 403, headers: NO_STORE_HEADERS });
  }

  const metadata = requestMetadata(request);
  const rateKey = `public-zumi:${metadata.ipAddress ?? "unknown"}`;
  const limit = checkZumiProcessRateLimit(rateKey);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Too many messages. Please try again shortly.",
        // A refusal must never be the last thing someone in an emergency reads. The body
        // has not been parsed at this point, so this is unconditional rather than
        // detected — short, always true, and cheap.
        emergency: LIFE_THREATENING_MESSAGE,
      },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = await boundedJson(request);
  if (body.tooLarge) {
    return NextResponse.json({ error: "That message is too large." }, { status: 413, headers: NO_STORE_HEADERS });
  }

  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "That message could not be processed." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  // Before quota, before any model. A public visitor describing an emergency gets
  // emergency language, not a routed marketing answer — and this path costs nothing, so
  // it cannot be refused for lack of paid inference. Klinikos does not triage: it stops.
  const urgent = detectUrgentSignal(parsed.data.question);
  if (urgent.urgent) {
    return NextResponse.json(
      {
        data: {
          resolution: {
            kind: "conversation",
            title: "This may be an emergency",
            body: urgent.message,
            assumption: null,
            destination: null,
            confidence: 1,
          },
          suggestions: [],
          degraded: false,
        },
      },
      { headers: NO_STORE_HEADERS },
    );
  }

  // If the durable quota authority is absent, unavailable, or did not attest this
  // request, fail closed against paid model execution rather than letting spoofable
  // forwarded-IP metadata authorize it.
  //
  // The no-cost path stays no-cost: `resolvePublicLivingIntent` is a pure deterministic
  // function with no model call. It used to run in the browser, which shipped Klinikos
  // routing logic to every visitor of the public site. It now runs here, and the
  // browser receives only the resolved presentation DTO.
  if (!publicZumiDurableQuotaAttested(request)) {
    const local = resolvePublicLivingIntent(
      parsed.data.question,
      (parsed.data.priorResolution ?? null) as PublicLivingResolution | null,
      parsed.data.unresolvedTurns,
    );
    return NextResponse.json({
      data: {
        resolution: {
          kind: local.kind,
          title: local.title,
          body: local.body,
          assumption: local.assumption,
          destination: local.destination,
          confidence: local.confidence,
        },
        suggestions: [],
        // Truthful marker: this turn was answered by deterministic guidance, not by the
        // full public intelligence path.
        degraded: true,
      },
    }, { headers: { ...NO_STORE_HEADERS, "Retry-After": "60" } });
  }

  const result = await resolvePublicZumiTurn(parsed.data);
  const resolution = result.resolution;
  // Presentation DTO only. The compatibility fields are constants required by the
  // existing client presentation type; they are not internal confidence/router state.
  // Suggestions are server-owned prompt shortcuts, never arbitrary executable actions.
  return NextResponse.json({
    data: {
      resolution: {
        kind: resolution.kind,
        title: resolution.title,
        body: resolution.body,
        assumption: null,
        destination: resolution.destination,
        confidence: 1,
      },
      suggestions: result.suggestions.slice(0, 4).map((suggestion) => ({
        id: suggestion.id,
        label: suggestion.label,
        prompt: suggestion.prompt,
      })),
    },
  }, { headers: NO_STORE_HEADERS });
}
