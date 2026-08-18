import { NextResponse } from "next/server";

/**
 * Public liveness endpoint for the deployment platform. It intentionally proves only
 * that the web process can answer HTTP. Release SHAs/branches, database configuration,
 * deployment mode, and integration readiness are private operational observability,
 * not public health metadata.
 */
export function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
