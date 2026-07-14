import { NextResponse } from "next/server";
import { patients } from "@/lib/clinic-data";

export function GET() {
  return NextResponse.json({ data: patients, mode: "fake-demo-data", count: patients.length });
}
