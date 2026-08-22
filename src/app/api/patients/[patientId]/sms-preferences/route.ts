import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import {
  getPatientSmsState,
  recordPatientSmsPermission,
} from "@/lib/communications/patient-sms-service";
import { evaluateSameOriginMutation } from "@/lib/security/same-origin";

const updateSchema = z.object({
  messageClass: z.enum(["transactional", "operational", "marketing"]),
  status: z.enum(["granted", "denied", "revoked"]),
  // Staff may document a patient's verbal choice or an internal denial/revocation.
  // This route does not turn a typed evidence reference into patient-controlled consent.
  source: z.enum(["patient_verbal", "staff_documented"]),
  policyVersion: z.string().trim().min(1).max(80).optional(),
}).superRefine((value, context) => {
  if (value.status === "granted" && value.source !== "patient_verbal") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["source"],
      message: "A staff-entered grant requires the staff member to attest that the patient gave verbal permission.",
    });
  }
  if (value.messageClass === "marketing" && value.status === "granted") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["messageClass"],
      message: "Marketing SMS cannot be granted through the staff preference route.",
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

  const sameOrigin = evaluateSameOriginMutation(request);
  if (!sameOrigin.allowed) {
    return NextResponse.json(
      { error: "This consent change must come from the authenticated Klinikos application." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid SMS preference update." }, { status: 400 });

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
      return NextResponse.json({ error: "That SMS permission cannot be established from this staff workflow." }, { status: 400 });
    }
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  return NextResponse.json({ data: result.sms }, { headers: { "Cache-Control": "private, no-store" } });
}
