import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export function networkAccessErrorResponse(error: unknown) {
  if (error instanceof NetworkAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid ClinicOS request.", details: error.issues }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "A conflicting ClinicOS record already exists." }, { status: 409 });
  }
  return NextResponse.json({ error: "ClinicOS data is temporarily unavailable." }, { status: 503 });
}
