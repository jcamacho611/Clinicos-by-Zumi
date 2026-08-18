import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

function safeNetworkMessage(error: NetworkAccessError) {
  if (error.status === 401) return "Authentication required.";
  if (error.status === 403) return "Access denied.";
  if (error.status === 404) return "The requested ClinicOS resource was not found.";
  if (error.status === 409) return "The request conflicts with the current ClinicOS state.";
  if (error.status >= 500) return "ClinicOS data is temporarily unavailable.";
  return error.message;
}

/**
 * Shared API error boundary. Raw Zod issue arrays, Prisma metadata, stack traces,
 * repository paths, and unexpected exception messages are deliberately server-only.
 */
export function networkAccessErrorResponse(error: unknown) {
  if (error instanceof NetworkAccessError) {
    return NextResponse.json({ error: safeNetworkMessage(error) }, { status: error.status, headers: NO_STORE });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid ClinicOS request." }, { status: 400, headers: NO_STORE });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "A conflicting ClinicOS record already exists." }, { status: 409, headers: NO_STORE });
  }

  const reference = crypto.randomUUID();
  console.error("[clinic-api] unexpected request failure", {
    reference,
    kind: error instanceof Error ? error.name : typeof error,
  });
  return NextResponse.json(
    { error: "ClinicOS data is temporarily unavailable.", reference },
    { status: 503, headers: NO_STORE },
  );
}
