import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkLuxeLeadIntakeRateLimit, recordLuxeLeadIntakeAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { ingestPublicLuxeLead } from "@/lib/repositories/luxe-acquisition-repository";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://luxe-medi.com",
  "https://www.luxe-medi.com",
  "https://klinikos.io",
  "https://www.klinikos.io",
];
const MAX_BODY_CHARACTERS = 16_000;

function allowedOrigins() {
  const configured = process.env.LUXE_MEDI_ALLOWED_ORIGINS?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (origin && allowedOrigins().has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, X-Klinikos-Luxe-Token";
    headers["Access-Control-Max-Age"] = "600";
  }
  return headers;
}

function tokenMatches(request: Request) {
  const expected = process.env.LUXE_MEDI_INGEST_TOKEN?.trim();
  const received = request.headers.get("x-klinikos-luxe-token")?.trim();
  if (!expected || !received) return false;
  const expectedBytes = Buffer.from(expected, "utf8");
  const receivedBytes = Buffer.from(received, "utf8");
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

function requestSourceIsAccepted(request: Request) {
  if (tokenMatches(request)) return true;
  const origin = request.headers.get("origin");
  return Boolean(origin && allowedOrigins().has(origin));
}

function withHeaders(response: NextResponse, headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
  return response;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().has(origin)) {
    return new NextResponse(null, { status: 403, headers: { "Cache-Control": "no-store", Vary: "Origin" } });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Lead intake is temporarily unavailable." }, { status: 503, headers });
  }

  // This is a public acquisition surface. Origin allowlisting limits normal browser
  // callers and CORS exposure, but it is not authentication because non-browser
  // clients can forge Origin. Abuse resistance therefore relies on bounded input,
  // honeypot, rate limiting, replay/idempotency controls where available, and any
  // approved bot challenge added at the edge. Server-to-server callers use a secret.
  if (!requestSourceIsAccepted(request)) {
    return NextResponse.json({ error: "Lead intake is not available from this source." }, { status: 403, headers });
  }

  const metadata = requestMetadata(request);
  const rateKey = `${metadata.ipAddress ?? "unknown"}:${origin ?? "trusted-server"}`;
  const limit = checkLuxeLeadIntakeRateLimit(rateKey);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
  recordLuxeLeadIntakeAttempt(rateKey);

  const rawBody = await request.text();
  if (!rawBody || rawBody.length > MAX_BODY_CHARACTERS) {
    return NextResponse.json({ error: "Lead request is invalid." }, { status: 400, headers });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Lead request must be valid JSON." }, { status: 400, headers });
  }

  try {
    const result = await ingestPublicLuxeLead(payload);
    return NextResponse.json(
      { received: true },
      { status: result.created ? 201 : 200, headers },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Lead request is invalid." }, { status: 400, headers });
    }
    return withHeaders(networkAccessErrorResponse(error), headers);
  }
}
