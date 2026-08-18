import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import {
  getPatientSmsState,
  recordPatientSmsPermission,
} from "@/lib/communications/patient-sms-service";

const updateSchema = z.object({
  messageClass: z.enum(["transactional", "operational", "marketing", "clinical"]),
  status: z.enum(["granted", "denied", "revoked"]),
  // This is a staff-authenticated route. It may document what staff actually observed,
  // but it cannot impersonate a patient-portal action or a system migration.
  source: z.enum(["patient_verbal", "patient_written", "staff_documented"]),
  policyVersion: z.string().trim().min(1).max(80).optional(),
  evidenceReference: z.string().trim().min(1).max(200).optional(),
}).superRefine((value, context) => {
  if (value.source === "patient_written" && !value.evidenceReference) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["evidenceReference"],
      message: "Written consent requires an evidence reference.",
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
  if (!parsed.success) return NextResponse.json({ error: "Invalid SMS preference update." }, { status: 400 });

  // A clinical permission value may be recorded as evidence, but the actual clinical/
  // PHI SMS send path remains independently fail-closed in the policy engine.
  const result = await recordPatientSmsPermission({
    organizationId: session.organizationId,
    patientId,
    actorId: session.userId,
    messageClass: parsed.data.messageClass,
    status: parsed.data.status,
    source: parsed.data.source,
    policyVersion: parsed.data.policyVersion,
    evidenceReference: parsed.data.evidenceReference,
  });
  if (!result.ok) return NextResponse.json({ error: "Patient not found." }, { status: 404 });

  return NextResponse.json({ data: result.sms }, { headers: { "Cache-Control": "private, no-store" } });
}
