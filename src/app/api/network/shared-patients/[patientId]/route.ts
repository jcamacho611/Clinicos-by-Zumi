import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { networkPurposeSchema, shareableCategorySchema } from "@/lib/network-access-rules";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { readSharedPatientRecord } from "@/lib/repositories/network-access-repository";

const querySchema = z.object({
  sourceOrganizationId: z.string().min(1),
  purposeOfUse: networkPurposeSchema,
  categories: z.array(shareableCategorySchema).min(1).max(10),
});

export async function GET(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!can(session.role, "network", "read")) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  try {
    const { patientId } = await params;
    const url = new URL(request.url);
    const query = querySchema.parse({
      sourceOrganizationId: url.searchParams.get("sourceOrganizationId"),
      purposeOfUse: url.searchParams.get("purposeOfUse") ?? "treatment",
      categories: (url.searchParams.get("categories") ?? "").split(",").filter(Boolean),
    });
    const sharedRecord = await readSharedPatientRecord(session, { patientId, ...query });
    const response = NextResponse.json({ data: sharedRecord });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
