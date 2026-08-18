import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

/**
 * Public liveness is intentionally information-poor. Deployment identity, branch,
 * database configuration, provider state, integration readiness, and other diagnostics
 * belong on authenticated/internal surfaces and must not be fingerprinting material for
 * arbitrary visitors.
 */
export function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}
