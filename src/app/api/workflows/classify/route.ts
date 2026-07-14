import { NextResponse } from "next/server";
import { z } from "zod";
import { classifyWorkflow } from "@/lib/workflow-rules";

const requestSchema = z.object({ message: z.string().trim().min(1).max(5000) });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A message between 1 and 5,000 characters is required." }, { status: 400 });
  }

  return NextResponse.json({
    decision: classifyWorkflow(parsed.data.message),
    createdAt: new Date().toISOString(),
    mode: "deterministic-demo-rules",
  });
}
