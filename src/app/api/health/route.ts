import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "klinikos",
    mode: "demo",
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    liveIntegrations: false,
    timestamp: new Date().toISOString(),
  });
}
