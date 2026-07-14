import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "zumi-clinicos",
    mode: "demo",
    liveIntegrations: false,
    timestamp: new Date().toISOString(),
  });
}
