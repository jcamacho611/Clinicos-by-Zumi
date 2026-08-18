import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import {
  getPatientSmsState,
  recordPatientSmsPermission,
} from "@/lib/communications/patient-sms-service";

const updateSchema = z.object({
  messageClass: z.enum(["transactional", "operational", "marketing"]),
  status: z.enum(["granted", "denied", "revoked"]),
  // This staff workflow can document a patient's verbal authorization or a staff
  // denial/revocation. Written/marketing consent requires a future dedicated patient
  // ceremony; a generic signed form is not silently reclassified as SMS authorization.
  source: z.enum(["patient_verbal", "staff_documented"]),
  policyVersion: z.string().trim().min(1).max(80).optional(),
}).superRefine((value, context) => {
  if (value.status === "granted" && value.source !== "patient_verbal") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["source"],
      message: "This staff workflow can grant transactional or operational SMS only from documented patient verbal authorization.",
    });
  }
  if (value.messageClass === "marketing" && value.status === "granted") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["messageClass"],
      message: "Marketing SMS cannot be granted in the staff workflow. A dedicated patient-facing written-consent ceremony is required.",
    });
  }
});

export async function GET(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { patientId } = await params;
  const denied = await enforceApiPermission(session, "consents", "read", { request, resourceId: patientId });
  if (denied) return denied;

  const state = await getPatientSmsState({ organizationId: session.organizationId, patientId });
  if (!state) return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  return NextResponse.json({ data: state }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { patientId } = await params;
  const denied = await enforceApiPermission(session, "consents", "update", { request, resourceId: patientId });
  if (denied) return denied;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid SMS preference update." }, { status: 400 });
  }

  const result = await recordPatientSmsPermission({
    organizationId: session.organizationId,
    patientId,
    actorId: session.userId,
    messageClass: parsed.data.messageClass,
    status: parsed.data.status,
    source: parsed.data.source,
    policyVersion: parsed.data.policyVersion,
  });
  if (!result.ok) {
    if (result.reason === "invalid_evidence") {
      return NextResponse.json({ error: "SMS permission evidence does not satisfy the server policy." }, { status: 400 });
    }
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  return NextResponse.json({ data: result.sms }, { headers: { "Cache-Control": "private, no-store" } });
}
