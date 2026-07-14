import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { NetworkAccessError } from "@/lib/repositories/network-access-repository";

export function networkAccessErrorResponse(error: unknown) {
  if (error instanceof NetworkAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid network access request.", details: error.issues }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "A conflicting network access record already exists." }, { status: 409 });
  }
  return NextResponse.json({ error: "Connected-care access is temporarily unavailable." }, { status: 503 });
}
