import { NextResponse } from "next/server";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { accessAcceptanceSchema, recordAccessAcceptance } from "@/lib/legal/access-gate";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Access acceptance logging is unavailable." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = accessAcceptanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid work email and accept the access terms." }, { status: 400 });
  }

  const metadata = requestMetadata(request);
  try {
    const acceptance = await recordAccessAcceptance(parsed.data, metadata);
    const response = NextResponse.json({ ok: true, acceptanceId: acceptance.id, acceptedAt: acceptance.acceptedAt.toISOString(), documentVersion: acceptance.documentVersion }, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "We could not record your acceptance. Please try again." }, { status: 503 });
  }
}
