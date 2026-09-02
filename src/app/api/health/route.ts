import { NextResponse } from "next/server";
import { readRuntimeReleaseIdentity } from "@/lib/readiness/release-identity";

export function GET() {
  // Read configuration before building the response rather than inside it. Only the
  // answer to "is a database configured" crosses to the browser — never the value, and
  // never a second environment read hidden in the payload.
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  return NextResponse.json({
    status: "ok",
    service: "klinikos",
    mode: "demo",
    databaseConfigured,
    liveIntegrations: false,
    release: readRuntimeReleaseIdentity(),
    timestamp: new Date().toISOString(),
  });
}
