import { NextResponse } from "next/server";
import { listPublicGridResources } from "@/lib/grid/resource-repository";
import { networkAccessErrorResponse } from "@/lib/network-access-http";

export async function GET() {
  try {
    return NextResponse.json({ data: await listPublicGridResources() });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
