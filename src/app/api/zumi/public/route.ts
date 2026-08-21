import { NextResponse } from "next/server";
import { z } from "zod";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { checkZumiProcessRateLimit } from "@/features/zumi/rate-limit";
import { resolvePublicZumiTurn } from "@/features/zumi/public-intelligence";

export const maxDuration = 20;

const MAX_BODY_BYTES = 16 * 1024;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  Vary: "Origin",
} as const;

const requestSchema = z.object({
  question: z.string().trim().min(1).max(1_200),
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
  // The real public boundary is bounded input + rate limiting + no tenant/private data
  // + pre-provider minimization + zero authenticated tools/actions.
  if (!originAccepted(request)) {
    return NextResponse.json({ error: "Public conversation is not available from this source." }, { status: 403, headers: NO_STORE_HEADERS });
  }

  const metadata = requestMetadata(request);
  const rateKey = `public-zumi:${metadata.ipAddress ?? "unknown"}`;
  const limit = checkZumiProcessRateLimit(rateKey);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please try again shortly." },
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
