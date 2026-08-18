import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ingestGoDaddyConversationNotification } from "@/lib/repositories/luxe-godaddy-conversation-repository";

const MAX_BODY_CHARACTERS = 120_000;

function authorized(request: Request) {
  const expected = process.env.LUXE_GODADDY_CONVERSATIONS_TOKEN?.trim();
  const received = request.headers.get("x-klinikos-godaddy-token")?.trim();
  if (!expected || !received) return false;
  const expectedBytes = Buffer.from(expected, "utf8");
  const receivedBytes = Buffer.from(received, "utf8");
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "GoDaddy conversation ingestion is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const rawBody = await request.text();
  if (!rawBody || rawBody.length > MAX_BODY_CHARACTERS) {
    return NextResponse.json({ error: "Notification request is invalid." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Notification request must be valid JSON." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const result = await ingestGoDaddyConversationNotification(payload);
    const status = result.status === "captured" ? 202 : result.status === "manual_review" ? 202 : 200;
    return NextResponse.json({ data: result }, { status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Notification request is invalid." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    console.error("Luxe GoDaddy conversation ingestion failed", error);
    return NextResponse.json({ error: "Notification ingestion failed." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
